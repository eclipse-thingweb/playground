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
 * An openAPI Server object
 * @param {string} url e.g. "https://example.com"
 * @param {string} description information about the server, e.g. "production"
 * @param {object} variables url template variables as string:object map
 */
function Server(url, description, variables) {
    if (url === undefined) {
        throw new Error("url for server object missing");
    }
    this.url = url;
    if (description) {
        this.description = description;
    }
    if (variables) {
        this.variables = variables;
    }
}

/**
 * An openAPI ExternalDocs object
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

module.exports = { Server, ExternalDocs };
