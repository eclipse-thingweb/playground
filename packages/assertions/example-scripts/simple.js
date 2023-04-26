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

const tdAsserter = require("../index").tdAssertions;
const fs = require("fs");

const simpleTD = JSON.stringify({
    id: "urn:simple",
    "@context": "https://www.w3.org/2019/wot/td/v1",
    title: "MyLampThing",
    description: "Valid TD copied from the specs first example",
    securityDefinitions: {
        basic_sc: {
            scheme: "basic",
            in: "header",
        },
    },
    security: ["basic_sc"],
    properties: {
        status: {
            type: "string",
            forms: [
                {
                    href: "https://mylamp.example.com/status",
                },
            ],
        },
    },
    actions: {
        toggle: {
            forms: [
                {
                    href: "https://mylamp.example.com/toggle",
                },
            ],
        },
    },
    events: {
        overheating: {
            data: {
                type: "string",
            },
            forms: [
                {
                    href: "https://mylamp.example.com/oh",
                    subprotocol: "longpoll",
                },
            ],
        },
    },
});

const simpleTDusingTM = JSON.stringify({
    id: "urn:required",
    $comment: "example 57 of the spec",
    "@context": "https://www.w3.org/2022/wot/td/v1.1",
    title: "Smart Ventilator",
    description: "Demonstrating the use adding _name onto affordances when using a TM",
    securityDefinitions: {
        basic_sc: {
            scheme: "basic",
            in: "header",
        },
    },
    security: "basic_sc",
    properties: {
        status: {
            type: "string",
            description: "current status of the lamp (on|off)",
            readOnly: true,
            writeOnly: false,
            observable: false,
            enum: ["on_value", "off_value", "error_value"],
            forms: [
                {
                    op: "readproperty",
                    href: "http://127.0.13.232:4563/status",
                },
            ],
        },
        ventilation_switch: {
            type: "boolean",
            description: "True=On; False=Off",
            readOnly: true,
            writeOnly: false,
            observable: false,
            forms: [
                {
                    op: "readproperty",
                    href: "http://127.0.13.212:4563/switch",
                },
            ],
        },
        ventilation_adjustRpm: {
            type: "number",
            readOnly: true,
            writeOnly: false,
            observable: false,
            minimum: 200,
            maximum: 1200,
            forms: [
                {
                    op: "readproperty",
                    href: "http://127.0.13.212:4563/adjustRpm",
                },
            ],
        },
        led_R: {
            type: "number",
            readOnly: true,
            writeOnly: false,
            observable: false,
            description: "Red color",
            forms: [
                {
                    op: "readproperty",
                    href: "http://127.0.13.211:4563/R",
                },
            ],
        },
        led_G: {
            type: "number",
            readOnly: true,
            writeOnly: false,
            observable: false,
            description: "Green color",
            forms: [
                {
                    op: "readproperty",
                    href: "http://127.0.13.211:4563/G",
                },
            ],
        },
        led_B: {
            type: "number",
            readOnly: true,
            writeOnly: false,
            observable: false,
            description: "Blue color",
            forms: [
                {
                    op: "readproperty",
                    href: "http://127.0.13.211:4563/B",
                },
            ],
        },
    },
    actions: {
        led_fadeIn: {
            title: "fadeIn",
            input: {
                type: "number",
                description: "fadeIn in ms",
            },
            forms: [
                {
                    op: "invokeaction",
                    href: "http://127.0.13.211:4563/fadeIn",
                },
            ],
        },
        led_fadeOut: {
            title: "fadeOut",
            input: {
                type: "number",
                description: "fadeOut in ms",
            },
            forms: [
                {
                    op: "invokeaction",
                    href: "http://127.0.13.211:4563/fadeOut",
                },
            ],
        },
    },
    links: [
        {
            rel: "type",
            href: "https://raw.githubusercontent.com/thingweb/thingweb-playground/master/packages/core/examples/tms/valid/optional.json",
            type: "application/td+json",
        },
    ],
    events: {
        overheating: {
            description: "Lamp reaches a critical temperature (overheating)",
            data: {
                type: "string",
            },
            forms: [
                {
                    href: "https://mylamp.example.com/oh",
                    subprotocol: "longpoll",
                },
            ],
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

tdAsserter([simpleTD, simpleTDusingTM], fileLoad).then(
    (result) => {
        console.log("OKAY");
        console.log(result);
    },
    (err) => {
        console.log("ERROR");
        console.error(err);
    }
);
