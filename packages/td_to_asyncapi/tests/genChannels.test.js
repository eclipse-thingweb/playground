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

/**
 * @file Test the functionality of the genChannels function by different TD/Server combinations as input
 * and different TD fragments
 */

const genChannels = require("../src/genChannels");

test("noMatching", () => {
    const emptyServers = {};
    const td = {
        properties: {
            temperature: {
                forms: [
                    {
                        href: "mqtt://example.com/temperatureVal",
                        op: ["readproperty", "writeproperty"],
                    },
                ],
            },
        },
        events: {
            overheating: {
                forms: [
                    {
                        href: "ftp://example.com/warnings/overheating",
                        op: ["subscribeevent", "unsubscribeevent"],
                    },
                ],
            },
        },
    };
    const channels = {};
    expect(genChannels(td, emptyServers)).toEqual(channels);
    expect(emptyServers).toEqual({});
});

test("observeProperty", () => {
    const emptyServers = {};
    const chServers = {
        0: {
            url: "mqtt://example.com",
            protocol: "mqtt",
        },
    };
    const td = {
        properties: {
            temperature: {
                forms: [
                    {
                        href: "mqtt://example.com/temperatureVal",
                        op: ["observeproperty", "unobserveproperty"],
                    },
                ],
            },
        },
    };
    const channels = {
        "/temperatureVal": {
            subscribe: {
                operationId: "observetemperatureproperty",
                tags: [{ name: "properties" }],
                message: {},
            },
        },
    };
    expect(genChannels(td, emptyServers)).toEqual(channels);
    expect(emptyServers).toEqual(chServers);
});

test("observeProperty_payload", () => {
    const emptyServers = {};
    const td = {
        properties: {
            temperature: {
                readOnly: true,
                unit: "celsius",
                forms: [
                    {
                        href: "mqtt://example.com/temperatureVal",
                        op: ["observeproperty", "unobserveproperty"],
                    },
                ],
            },
        },
    };
    const channels = {
        "/temperatureVal": {
            subscribe: {
                operationId: "observetemperatureproperty",
                tags: [{ name: "properties" }],
                message: {
                    payload: {
                        readOnly: true,
                        "x-unit": "celsius",
                    },
                },
            },
        },
    };
    expect(genChannels(td, emptyServers)).toEqual(channels);
});

test("observeProperty_operationBinding", () => {
    const emptyServers = {};
    const td = {
        properties: {
            temperature: {
                forms: [
                    {
                        href: "mqtt://example.com/temperatureVal",
                        op: ["observeproperty", "unobserveproperty"],
                        "mqv:options": [
                            {
                                "mqv:optionName": "qos",
                                "mqv:optionValue": 1,
                            },
                        ],
                    },
                ],
            },
        },
    };
    const channels = {
        "/temperatureVal": {
            subscribe: {
                operationId: "observetemperatureproperty",
                tags: [{ name: "properties" }],
                message: {},
                bindings: {
                    mqtt: {
                        bindingVersion: expect.any(String),
                        qos: 1,
                    },
                },
            },
        },
    };
    expect(genChannels(td, emptyServers)).toEqual(channels);
});

test("subscribeEvent", () => {
    const emptyServers = {};
    const chServers = {
        0: {
            url: "mqtt://example.com",
            protocol: "mqtt",
        },
    };
    const td = {
        events: {
            overheating: {
                forms: [
                    {
                        href: "mqtt://example.com/warnings/overheating",
                        op: ["subscribeevent", "unsubscribeevent"],
                    },
                ],
            },
        },
    };
    const channels = {
        "/warnings/overheating": {
            subscribe: {
                operationId: "subscribeoverheatingevent",
                tags: [{ name: "events" }],
                message: {},
            },
        },
    };
    expect(genChannels(td, emptyServers)).toEqual(channels);
    expect(emptyServers).toEqual(chServers);
});

test("subscribeEvent_payload", () => {
    const emptyServers = {};
    const td = {
        events: {
            overheating: {
                data: {
                    oneOf: [{ readOnly: true }, { writeOnly: true }],
                },
                forms: [
                    {
                        href: "mqtt://example.com/warnings/overheating",
                        op: ["subscribeevent", "unsubscribeevent"],
                    },
                ],
            },
        },
    };
    const channels = {
        "/warnings/overheating": {
            subscribe: {
                operationId: "subscribeoverheatingevent",
                tags: [{ name: "events" }],
                message: {
                    payload: {
                        oneOf: [{ readOnly: true }, { writeOnly: true }],
                    },
                },
            },
        },
    };
    expect(genChannels(td, emptyServers)).toEqual(channels);
});

test("subscribeEvent_relPath", () => {
    const servers = {
        base: {
            url: "mqtt://example.com/mybroker",
            protocol: "mqtt",
        },
    };
    const chServers = {
        base: {
            url: "mqtt://example.com/mybroker",
            protocol: "mqtt",
        },
    };
    const td = {
        events: {
            overheating: {
                data: {
                    oneOf: [{ readOnly: true }, { writeOnly: true }],
                },
                forms: [
                    {
                        href: "warnings/overheating",
                        op: ["subscribeevent", "unsubscribeevent"],
                    },
                ],
            },
        },
    };
    const channels = {
        "/warnings/overheating": {
            subscribe: {
                operationId: "subscribeoverheatingevent",
                tags: [{ name: "events" }],
                message: {
                    payload: {
                        oneOf: [{ readOnly: true }, { writeOnly: true }],
                    },
                },
            },
        },
    };
    expect(genChannels(td, servers)).toEqual(channels);
    expect(servers).toEqual(chServers);
});
