export interface ExecuteParams {
    td: TD;
    language: string;
    library: string;
    affordanceType: AffordanceType;
    affordanceKey: string;
    operation: Op;
    output?: string;
}

export type TD = Record<AffordanceType, Record<string, Affordance>>;

export const affordance_types = ["properties", "actions", "events"] as const;
export type AffordanceType = (typeof affordance_types)[number];
export interface Form {
    href: string;
    op: Op | Op[];
    "htv:methodName"?: string;
    subprotocol?: string;
    "modv:unitID"?: number;
    "modv:address"?: number;
    "modv:function"?: string;
    "modv:quantity"?: number;
    [key: string]: unknown;
}

export interface Affordance {
    forms: Form[];
    type?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    data?: Record<string, unknown>;
}

export const operations = {
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
export type Op = (typeof operations)[keyof typeof operations][number];

export const supportedLibraries = {
    javascript: ["fetch", "node-wot", "modbus-serial"],
    python: ["requests"],
};
export type SupportedLanguage = keyof typeof supportedLibraries;
