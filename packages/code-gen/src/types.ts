export type GenerateCodeResult =
    | {
          code: string;
      }
    | {
          prompt: string;
      };

export interface GenerateCodeParams {
    td: Affordances; // we only care about the affordances for the TD, so we can simplify the type here
    language: string;
    library: string;
    affordanceType: AffordanceType;
    affordanceKey: string;
    operation: Op;
    output?: string;
}
export type Affordances = Record<AffordanceType, Record<string, Affordance>>;

export const AFFORDANCE_TYPES = ["properties", "actions", "events"] as const;
export type AffordanceType = (typeof AFFORDANCE_TYPES)[number];

export interface Affordance {
    forms: Form[];
    type?: string;
    readOnly?: boolean;
    writeOnly?: boolean;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    data?: Record<string, unknown>;
}

export interface Form {
    href: string;
    op?: Op | Op[];
    "htv:methodName"?: string;
    subprotocol?: string;
    "modv:unitID"?: number;
    "modv:address"?: number;
    "modv:function"?: string;
    "modv:quantity"?: number;
}

export const OPERATIONS = {
    property: [
        "readproperty",
        "readallproperties",
        "readmultiproperties",
        "writeproperty",
        "writeallproperties",
        "writemultiproperties",
        "observeproperty",
        "observeallproperties",
        "unobserveproperty",
        "unobserveallproperties",
    ],
    action: ["invokeaction", "queryaction", "cancelaction", "queryallactions"],
    event: ["subscribeevent", "unsubscribeevent", "subscribeallevents", "unsubscribeallevents"],
} as const;
export type Op = (typeof OPERATIONS)[keyof typeof OPERATIONS][number];

export enum PROTOCOL {
    COAP = "coap",
    COAPS = "coaps",
    HTTP = "http",
    HTTPS = "https",
    MQTT = "mqtt",
    OPC_UA = "opc",
    NETCONF = "netconf",
    MODBUS = "modbus",
    M_BUS = "mbus",
    WEB_SOCKET = "websocket",
    FILE = "file",
}

interface LanguagesSupport {
    [language: string]: {
        fileExtension: string;
        libraries: {
            [libraryName: string]: readonly PROTOCOL[];
        };
    };
}

export const LANGUAGES_SUPPORT: LanguagesSupport = {
    javascript: {
        fileExtension: "js",
        libraries: {
            fetch: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
            "node-wot": [
                PROTOCOL.HTTP,
                PROTOCOL.HTTPS,
                PROTOCOL.COAP,
                PROTOCOL.COAPS,
                PROTOCOL.MQTT,
                PROTOCOL.OPC_UA,
                PROTOCOL.NETCONF,
                PROTOCOL.MODBUS,
                PROTOCOL.M_BUS,
            ],
            webthing: [PROTOCOL.HTTP, PROTOCOL.HTTPS, PROTOCOL.WEB_SOCKET],
            "modbus-serial": [PROTOCOL.MODBUS],
        },
    },
    python: {
        fileExtension: "py",
        libraries: {
            requests: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
            wotpy: [PROTOCOL.HTTP, PROTOCOL.HTTPS, PROTOCOL.COAP, PROTOCOL.COAPS, PROTOCOL.WEB_SOCKET, PROTOCOL.MQTT],
            PyModbus: [PROTOCOL.MODBUS],
        },
    },
    java: {
        fileExtension: "java",
        libraries: {
            httpclient: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
            "wot-servient": [
                PROTOCOL.HTTP,
                PROTOCOL.HTTPS,
                PROTOCOL.COAP,
                PROTOCOL.COAPS,
                PROTOCOL.MQTT,
                PROTOCOL.FILE,
                PROTOCOL.WEB_SOCKET,
            ],
            "digitalpetri/modbus": [PROTOCOL.MODBUS],
        },
    },
    rust: {
        fileExtension: "rs",
        libraries: {
            reqwest: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
        },
    },
    go: {
        fileExtension: "go",
        libraries: {
            "net-http": [PROTOCOL.HTTP, PROTOCOL.HTTPS],
        },
    },
    "c#": {
        fileExtension: "cs",
        libraries: {
            httpclient: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
            "WoT.Net": [PROTOCOL.HTTP, PROTOCOL.HTTPS],
        },
    },
    php: {
        fileExtension: "php",
        libraries: {
            curl: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
        },
    },
    ruby: {
        fileExtension: "rb",
        libraries: {
            "net-http": [PROTOCOL.HTTP, PROTOCOL.HTTPS],
        },
    },
    dart: {
        fileExtension: "dart",
        libraries: {
            "dart-wot": [PROTOCOL.HTTP, PROTOCOL.HTTPS, PROTOCOL.COAP, PROTOCOL.COAPS, PROTOCOL.MQTT],
            http: [PROTOCOL.HTTP, PROTOCOL.HTTPS],
        },
    },
} as const;
