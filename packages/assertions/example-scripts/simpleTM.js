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

const tmAsserter = require("../index").tmAssertions;
const fs = require("fs");

const simpleTD = JSON.stringify({
    id: "urn:basic",
    "@context": ["https://www.w3.org/2022/wot/td/v1.1"],
    "@type": "tm:ThingModel",
    title: "Smart Lamp Control with Dimming",
    links: [
        {
            rel: "tm:extends",
            href: "http://example.com/BasicOnOffTM",
            type: "application/td+json",
        },
    ],
    properties: {
        dim: {
            title: "Dimming level",
            type: "integer",
            minimum: 0,
            maximum: 100,
        },
    },
});

function fileLoad(loc) {
    return new Promise((res, rej) => {
        fs.readFile(loc, "utf8", (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

tmAsserter([simpleTD], fileLoad).then(
    (result) => {
        console.log("OKAY");
        console.log(result);
    },
    (err) => {
        console.log("ERROR");
        console.error(err);
    }
);
