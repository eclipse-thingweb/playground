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

const { AsyncAPI, ExternalDocs } = require("./src/definitions");
const genChannels = require("./src/genChannels");
const { genInfo, genTags, genBaseServer } = require("./src/genRoot");
const defaults = require("@thing-description-playground/defaults");

const {mapSecurity} = require("./src/mapSecurity");

/**
 * Create an AsyncAPI instance from a Web of Things Thing Description
 * @param {object} td A Thing Description object as input
 * @returns {Promise<{json:object, yaml:String}>} Resolves as object containing the OAP document or rejects
 */
function toAsyncAPI(td) {
    return new Promise((res, rej) => {
        if (typeof td !== "object") {
            rej("TD has wrong type, should be an object");
        }
        const {securitySchemes, security} = mapSecurity(td.securityDefinitions, td.security);       
        const components = {
            securitySchemes
        };

        defaults.addDefaults(td);

        const servers = genBaseServer(td, security);
        const asyncApiInstance = new AsyncAPI("2.0.0", genInfo(td), genChannels(td, servers), {
            id: td.id,
            servers,
            tags: genTags(td),
            components: components,
            externalDocs: new ExternalDocs(
                "http://plugfest.thingweb.io/playground/",
                "This AsyncAPI instance was generated from a Web of Things (WoT) - Thing Description by the WoT Playground"
            ),
        });

        asyncApiInstance.parse().then(
            (apiExport) => {
                res(apiExport);
            },
            (err) => {
                console.log(asyncApiInstance.asYaml());
                rej(err);
            }
        );
    });
}

module.exports = toAsyncAPI;
