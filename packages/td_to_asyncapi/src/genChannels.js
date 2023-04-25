/*
 *  Copyright (c) 2023 Contributors to the Eclipse Foundation
 *
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

const { dataToAsyncSchema, extractChannel } = require("./utils");
const { Channel, Operation, Tag, Message, MqttOperationBinding, Server } = require("./definitions");

/**
 * Maps TD interactions and their forms to AsyncAPI channels
 * by iterating over all TD properties & events forms
 * to find relevant ones
 * @param {object} td The Thing Description input
 * @param {object} servers The AsyncAPI servers map
 */
function genChannels(td, servers) {
    const channels = {};

    // Scan Properties
    const allInteractionsInfo = {
        properties: {
            ops: ["observeproperty", "unobserveproperty"],
            tdOp: "observe",
            interaction: "property",
            getDataSchema: (property) => property,
        },
        events: {
            ops: ["subscribeevent", "unsubscribeevent"],
            tdOp: "subscribe",
            interaction: "event",
            getDataSchema: (event) => event.data,
        },
    };

    Object.keys(allInteractionsInfo).forEach((interactionType) => {
        const interactionInfo = allInteractionsInfo[interactionType];

        if (td[interactionType]) {
            Object.keys(td[interactionType]).forEach((interactionName) => {
                const interaction = td[interactionType][interactionName];

                if (interaction.forms) {
                    interaction.forms.forEach((form) => {
                        const dataSchema = interactionInfo.getDataSchema(interaction);
                        const payload = dataToAsyncSchema(dataSchema);
                        scanPropForm(form, channels, interactionName, payload, servers, interactionInfo);
                    });
                }
            });
        }
    });

    return channels;
}

/**
 * Array containing all protocols to convert and their relevant properties
 */
const tryProtocols = [
    {
        id: "mqtt",
        checkForm: (form) => form["mqv:controlPacketValue"] === "SUBSCRIBE",
        addBinding: (form) => {
            let bindings;
            if (form["mqv:options"]) {
                let qos;
                let retain;
                form["mqv:options"].forEach((mqvOption) => {
                    if (mqvOption["mqv:optionName"] && mqvOption["mqv:optionValue"]) {
                        if (mqvOption["mqv:optionName"] === "qos") {
                            qos = mqvOption["mqv:optionValue"];
                        } else if (mqvOption["mqv:optionName"] === "retain") {
                            retain = mqvOption["mqv:optionValue"];
                        }
                    }
                });
                if (qos !== undefined || retain !== undefined) {
                    bindings = new MqttOperationBinding({ qos, retain });
                }
            }
            return bindings;
        },
    },
];

/**
 * Check if form is relevant
 * @param {object} form One form
 */
function scanPropForm(form, channels, propertyName, payload, servers, interactionInfo) {
    const hasBase = servers.base !== undefined ? true : false;
    const isRelative = form.href && form.href.search("://") === -1 ? true : false;

    tryProtocols.forEach((tryProtocol) => {
        if (form.href && (form.href.startsWith(tryProtocol.id + "://") || (hasBase && isRelative))) {
            const opArray = typeof form.op === "string" ? [form.op] : form.op;
            if (
                opArray.some((op) => interactionInfo.ops.some((intOp) => op === intOp)) ||
                tryProtocol.checkForm(form)
            ) {
                const { channel, server } = extractChannel(form.href);
                // add server
                addServer(servers, server, tryProtocol.id);

                // add channel
                if (!channels[channel]) {
                    Object.assign(
                        channels,
                        new Channel(channel, {
                            subscribe: new Operation({
                                tdOp: interactionInfo.tdOp,
                                opName: propertyName,
                                ixType: interactionInfo.interaction,
                                message: new Message({
                                    contentType: form.contentType,
                                    payload,
                                }),
                                bindings: tryProtocol.addBinding(form),
                            }),
                        })
                    );
                }
            }
        }
    });
}

/**
 * Add a new server if it doesn't already exist in the servers object
 * @param {[key:string]:Server} servers The AsyncAPI servers map
 * @param {string|undefined} newServerUri
 * @param {string} protocol
 */
function addServer(servers, newServerUri, newServerProtocol) {
    if (
        newServerUri &&
        Object.keys(servers).every(
            (asyncServer) =>
                servers[asyncServer].url !== newServerUri || servers[asyncServer].protocol !== newServerProtocol
        )
    ) {
        let i = 0;
        while (Object.keys(servers).some((asyncServer) => asyncServer === i.toString())) {
            i++;
        }
        servers[i.toString()] = new Server(newServerUri, newServerProtocol);
    }
}

module.exports = genChannels;
