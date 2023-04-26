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

const SwaggerParser = require("swagger-parser");
const YAML = require("json-to-pretty-yaml");
const { Server, ExternalDocs } = require("./definitions");
const crawlPaths = require("./crawlPaths");
const createInfo = require("./createInfo");
const { mapSecurity } = require("./mapSecurity");

module.exports = toOpenAPI;

/**
 * Create an OpenAPI document from a Web of Things Thing Description
 * @param {object} td A Thing Description object as input
 * @returns {Promise<{json:object, yaml:String}>} Resolves as object containing the OAP document or rejects
 */
function toOpenAPI(td) {
    return new Promise((res, rej) => {
        if (typeof td !== "object") {
            rej("TD has wrong type, should be an object");
        }

        /* required */
        const API = {
            openapi: "3.0.3",
            info: createInfo(td),
            paths: crawlPaths(td),
        };

        /* optional */
        const servers = crawlServers(td.base);
        const { securitySchemes, security } = mapSecurity(td.securityDefinitions, td.security);
        const components = {
            securitySchemes,
        };

        const tags = addTags(td);
        const externalDocs = new ExternalDocs(
            "http://plugfest.thingweb.io/playground/",
            "This OAP specification was generated from a Web of Things (WoT) - Thing Description by the WoT Playground"
        );

        // add optional fields if they are filled
        if (servers.length > 0) {
            API.servers = servers;
        }
        if (tags.length > 0) {
            API.tags = tags;
        }
        if (Object.keys(components.securitySchemes).length > 0) {
            API.components = components;
        }

        if (security.length > 0) {
            API.security = security;
        }

        SwaggerParser.validate(API).then(
            () => {
                res({ json: API, yaml: YAML.stringify(API) });
            },
            (err) => {
                // console.log(JSON.stringify(API, undefined, 4))
                rej(err);
            }
        );
    });
}

/* ####### FUNCTIONS #############*/

/**
 * Adds the base-server of the Thing if it exists
 * @param {String} base The base-url of the TD
 */
function crawlServers(base) {
    const cServers = [];

    if (base !== undefined) {
        cServers.push(new Server(base, "TD base url"));
    }
    return cServers;
}

/**
 * Generate OAP-tags for the TD Properties, Actions and Events
 * if the respective type of interaction is present in the input TD
 * @param {object} td The input TD
 */
function addTags(td) {
    const tags = [];

    // add normal interactions
    const interactions = {
        properties: {
            name: "properties",
            description:
                "A property can expose a variable of a Thing, this variable might be readable, writable and/or observable.",
            externalDocs: new ExternalDocs(
                "https://www.w3.org/TR/wot-thing-description/#propertyaffordance",
                "Find out more about Property Affordances."
            ),
        },
        actions: {
            name: "actions",
            description: "An action can expose something to be executed by a Thing, an action can be invoked.",
            externalDocs: new ExternalDocs(
                "https://www.w3.org/TR/wot-thing-description/#actionaffordance",
                "Find out more about Action Affordances."
            ),
        },
        events: {
            name: "events",
            description:
                "An event can expose a notification by a Thing, this notification can be subscribed and/or unsubscribed.",
            externalDocs: new ExternalDocs(
                "https://www.w3.org/TR/wot-thing-description/#eventaffordance",
                "Find out more about Event Affordances."
            ),
        },
    };
    Object.keys(interactions).forEach((interactionType) => {
        if (td[interactionType] !== undefined) {
            tags.push(interactions[interactionType]);
        }
    });

    // add root level interactions, e.g., readAllProperties
    const rootInteractions = {
        name: "rootInteractions",
        description: "An interaction that allows interacting with several properties in one request.",
        externalDocs: new ExternalDocs(
            "https://www.w3.org/TR/wot-thing-description/#thing",
            "Read about the property 'forms' of a Thing to find out more."
        ),
    };
    if (td.forms) {
        tags.push(rootInteractions);
    }

    return tags;
}
