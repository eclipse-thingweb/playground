/* 
 *   Copyright (c) 2023 Contributors to the Eclipse Foundation
 *   
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *   
 *   This program and the accompanying materials are made available under the
 *   terms of the Eclipse Public License v. 2.0 which is available at
 *   http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *   Document License (2015-05-13) which is available at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *   
 *   SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

const apiParser = require("@asyncapi/parser");
const YAML = require("json-to-pretty-yaml");

/**
 * AsyncAPI Instance Constructor
 * @param {string} asyncapi The asyncapi specification version to apply
 * @param {Info} info The root level information, e.g., title
 * @param {{[key:string]: Channel}} channels The channels (= topics = ...) of the instance
 * @param {{
 *          id?,
 *          servers?: {[key:string]: Server},
 *          components?,
 *          tags?: Tag[],
 *          externalDocs?: ExternalDocs
 *         } | undefined} opts The AsyncAPI instance optional properties
 */
function AsyncAPI(asyncapi, info, channels, opts) {
    if (!asyncapi || !info || !channels) {
        throw new Error("AsyncAPI constructor problem, parameter missing");
    }
    if (!opts) {
        opts = {};
    }
    this.props = { asyncapi, info, channels };
    Object.assign(this.props, opts);

    this.asYaml = function () {
        return YAML.stringify(this.props);
    };

    this.parse = function () {
        return new Promise((res, rej) => {
            // use object copy to avoid exporting parser annotations
            const propsCopy = JSON.parse(JSON.stringify(this.props));
            apiParser.parse(propsCopy).then((parsedAapi) => {
                this.aap = parsedAapi;
                res({ json: this.props, yaml: this.asYaml() });
            });
        });
    };
}

/**
 * The AsyncAPI Info object
 * @param {string} title The title of the application
 * @param {string} version The API version (NOT async specification version), defaults to undefined
 * @param {{description?, termsOfService?, contact?, license?} | undefined} opts Optional properties
 */
function Info(title, version, opts) {
    if (title === undefined || version === undefined) {
        throw new Error("title or version for infos object missing");
    }
    if (opts === undefined) {
        opts = {};
    }
    this.title = title;
    this.version = version;
    this.description = opts.description;
    this.termsOfService = opts.termsOfService;
    this.contact = opts.contact;
    this.license = opts.license;
}

/**
 * An AsyncAPI ExternalDocs object
 * @param {string} url  e.g. "https://example.com/docs/iot"
 * @param {string} description e.g. "An explanation of the Internet of Things"
 */
function ExternalDocs(url, description) {
    if (url === undefined) {
        throw new Error("url for external docs object missing");
    }
    this.url = url;
    if (description) {
        this.description = description;
    }
}

/**
 * The AsyncAPI Tag object
 * @param {string} name The Tag name
 * @param {{description?: string, externalDocs?: ExternalDocs}| undefined} opts optional properties
 */
function Tag(name, opts) {
    if (name === undefined) {
        throw new Error("name for tag missing");
    }
    this.name = name;
    if (opts === undefined) {
        opts = {};
    }
    Object.assign(this, opts);
}

/**
 * One AsyncAPI Channel Item Object
 * @param {string} channel The channel, e.g. "user/signup"
 * @param {{description?: string,
 *          subscribe?: Operation,
 *          publish?: Operation,
 *          parameters?,
 *          bindings?
 *          }|undefined} opts The possible object properties
 */
function Channel(channel, opts) {
    if (typeof channel !== "string") {
        throw new Error("Channel was constructed with wrong channel type: " + typeof channel);
    }
    this[channel] = {};
    Object.assign(this[channel], opts);
}

/**
 * An Async API Operation object
 * @param {{
 *          tdOp?: "observe" | "read" | "write" | "subscribe",
 *          opName?: string,
 *          ixType?: "property" | "action" | "event",
 *          summary?: string,
 *          description?: string,
 *          tags?: Tag[],
 *          externalDocs?: ExternalDocs,
 *          bindings?: MqttOperationBinding,
 *          message?: Message | {oneOf: Message[]}
 * }} opts All parameters are optional
 */
function Operation(opts) {
    if (opts.tdOp !== undefined && opts.opName !== undefined && opts.ixType !== undefined) {
        this.operationId = "" + opts.tdOp + opts.opName + opts.ixType;
    }
    if (opts.tags === undefined && opts.ixType) {
        if (opts.ixType === "property") {
            this.tags = [new Tag("properties")];
        } else if (opts.ixType === "action" || opts.ixType === "event") {
            this.tags = [new Tag(opts.ixType + "s")];
        }
    }
    delete opts.tdOp;
    delete opts.opName;
    delete opts.ixType;

    if (opts === undefined) {
        opts = {};
    }
    Object.assign(this, opts);
}

/**
 * An AsyncAPI message object
 * @param {{
 *          headers?,
 *          payload?,
 *          schemaFormat?,
 *          contentType?,
 *          examples?
 *        }} opts All parameters are optional
 */
function Message(opts) {
    Object.keys(opts).forEach((key) => {
        if (opts[key] !== undefined) {
            this[key] = opts[key];
        }
    });
}

/**
 * An AsyncAPI mqtt protocol operation binding
 * @param {{
 *          qos?: 0 | 1 | 2,
 *          retain?: boolean
 * }} opts All parameters are optional
 */
function MqttOperationBinding(opts) {
    this.mqtt = {};
    this.mqtt.bindingVersion = "0.1.0";
    Object.assign(this.mqtt, opts);
}

/**
 * An AsyncAPI server
 * @param {string} url e.g. subdomain.example.com
 * @param {"mqtt"} protocol
 * @param {{
 *          protocolVersion?: string,
 *          security?,
 *          variables?,
 *          bindings?
 * }} opts Optional parameters
 */
function Server(url, protocol, opts) {
    if (typeof url !== "string" || typeof protocol !== "string") {
        throw new Error("url and protocol have to be type string");
    }
    this.url = url;
    this.protocol = protocol;
    Object.assign(this, opts);
}

module.exports = {
    AsyncAPI,
    Info,
    ExternalDocs,
    Tag,
    Channel,
    Operation,
    Message,
    MqttOperationBinding,
    Server,
};
