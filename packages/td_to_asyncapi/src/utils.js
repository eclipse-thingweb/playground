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

/**
 * Convert a TD Data Schema object to an AsyncAPI Schema
 * @param {object} source The TD data Schema object
 * @returns {object} An AsyncAPI Schema instance
 */
function dataToAsyncSchema(source) {
    if (source === undefined) {
        return;
    }
    const target = {};
    const tdCustoms = ["@type", "titles", "descriptions", "unit"];
    const commons = ["title", "type", "description", "const", "oneOf", "enum", "readOnly", "writeOnly", "format"];

    copySpecExtensions(tdCustoms, source, target);

    commons.forEach((commonKey) => {
        if (source[commonKey] !== undefined) {
            target[commonKey] = source[commonKey];
        }
    });

    // recursively parse oneOf subschemas
    if (source.oneOf !== undefined) {
        target.oneOf = [];
        source.oneOf.forEach((subschema) => {
            const newAsyncSchema = dataToAsyncSchema(subschema);
            target.oneOf.push(newAsyncSchema);
        });
    }

    if (Object.keys(target).length === 0) {
        return undefined;
    } else {
        return target;
    }
}

/**
 * Takes an array of keys to check which properties are present on the source object,
 * then adds them prefix with "x-" or "x-AT-" to the target array.
 * The @ symbol is not allowed as part of an specification extension key in
 * AsyncAPI that makes the "x-AT-" prefix necessary.
 * @param {string[]} keys The property keys, e.g. ["@context", descriptions]
 * @param {object} source Mostly an subObject of the input TD
 * @param {object} target Mostly an subObject of the AsyncAPI instance to create
 */
function copySpecExtensions(keys, source, target) {
    keys.forEach((key) => {
        if (source[key] !== undefined) {
            if (key.startsWith("@")) {
                target["x-AT-" + key.slice(1)] = source[key];
            } else {
                target["x-" + key] = source[key];
            }
        }
    });
}

/**
 * Detect type of link and separate into server and channel, e.g.:
 * @param {string} link The whole or partial URL, e.g. `http://example.com/asdf/1`
 * @returns {{server:string|undefined, channel:string}} Channel and Server if given,
 * e.g., `{server: "http://example.com", channel: "/asdf/1"}`
 */
function extractChannel(link) {
    let server;
    let channel;
    if (link.search("://") !== -1) {
        const [protocol, sLink] = link.split("://");
        server = protocol + "://" + sLink.split("/").shift();
        channel = "/" + sLink.split("/").slice(1).join("/");
    } else {
        channel = link;
        if (!channel.startsWith("/")) {
            channel = "/" + channel;
        }
    }
    return { channel, server };
}

module.exports = { dataToAsyncSchema, extractChannel, copySpecExtensions };
