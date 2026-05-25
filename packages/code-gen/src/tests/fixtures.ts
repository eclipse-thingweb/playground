import { Affordances, PROTOCOL } from "../types.js";

/**
 * A minimal HTTP-based Thing Description for testing code generators.
 */
export const HTTP_TD: Affordances = {
    properties: {
        temperature: {
            type: "number",
            forms: [
                {
                    href: "https://example.com/properties/temperature",
                    op: ["readproperty", "writeproperty"],
                },
            ],
        },
        status: {
            type: "string",
            readOnly: true,
            forms: [
                {
                    href: "https://example.com/properties/status",
                },
            ],
        },
    },
    actions: {
        toggle: {
            input: { type: "boolean" },
            output: { type: "string" },
            forms: [
                {
                    href: "https://example.com/actions/toggle",
                    op: "invokeaction",
                },
            ],
        },
    },
    events: {
        overheating: {
            data: { type: "number" },
            forms: [
                {
                    href: "https://example.com/events/overheating",
                    op: ["subscribeevent", "unsubscribeevent"],
                },
            ],
        },
    },
};

/**
 * A Modbus-based Thing Description for testing Modbus generators.
 */
export const MODBUS_TD: Affordances = {
    properties: {
        coilStatus: {
            type: "boolean",
            forms: [
                {
                    href: "modbus+tcp://192.168.1.1:502/1/100",
                    op: ["readproperty"],
                    "modv:function": "readCoil",
                    "modv:unitID": 1,
                    "modv:address": 100,
                    "modv:quantity": 4,
                },
                {
                    href: "modbus+tcp://192.168.1.1:502/1/100",
                    op: ["writeproperty"],
                    "modv:function": "writeSingleCoil",
                    "modv:unitID": 1,
                    "modv:address": 100,
                },
            ],
        },
        holdingRegister: {
            type: "number",
            forms: [
                {
                    href: "modbus+tcp://192.168.1.1:502/1/200",
                    op: ["readproperty"],
                    "modv:function": "readHoldingRegisters",
                    "modv:unitID": 1,
                    "modv:address": 200,
                    "modv:quantity": 2,
                },
            ],
        },
    },
    actions: {},
    events: {},
};

/**
 * A Thing Description with an observable property and WebSocket form.
 */
export const STREAMING_TD: Affordances = {
    properties: {
        liveData: {
            type: "number",
            forms: [
                {
                    href: "https://example.com/properties/liveData",
                    op: "observeproperty",
                    subprotocol: "longpoll",
                },
                {
                    href: "https://example.com/properties/liveData",
                    op: "readproperty",
                },
            ],
        },
    },
    actions: {},
    events: {
        alarm: {
            data: { type: "string" },
            forms: [
                {
                    href: "https://example.com/events/alarm",
                    op: "subscribeevent",
                },
            ],
        },
    },
};

/**
 * A TD with a custom HTTP method override.
 */
export const CUSTOM_METHOD_TD: Affordances = {
    properties: {
        config: {
            type: "object",
            forms: [
                {
                    href: "https://example.com/properties/config",
                    op: "readproperty",
                    "htv:methodName": "POST",
                },
            ],
        },
    },
    actions: {},
    events: {},
};

/**
 * A TD with CoAP protocol forms for WoT-based generators.
 */
export const COAP_TD: Affordances = {
    properties: {
        sensor: {
            type: "number",
            forms: [
                {
                    href: "coap://example.com/sensor",
                    op: "readproperty",
                },
            ],
        },
    },
    actions: {},
    events: {},
};

/**
 * A TD with MQTT protocol forms.
 */
export const MQTT_TD: Affordances = {
    properties: {
        telemetry: {
            type: "number",
            forms: [
                {
                    href: "mqtt://broker.example.com/telemetry",
                    op: "observeproperty",
                },
            ],
        },
    },
    actions: {},
    events: {},
};

/**
 * An empty TD for edge case testing.
 */
export const EMPTY_TD: Affordances = {
    properties: {},
    actions: {},
    events: {},
};

/**
 * A TD with writeOnly property.
 */
export const WRITE_ONLY_TD: Affordances = {
    properties: {
        command: {
            type: "string",
            writeOnly: true,
            forms: [
                {
                    href: "https://example.com/properties/command",
                },
            ],
        },
    },
    actions: {},
    events: {},
};
