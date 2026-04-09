export interface ExecuteParams {
    td: TD;
    language: string;
    library: string;
    affordanceType: AffordanceType;
    affordanceKey: string;
    operation: Op;
}

export type TD = Record<AffordanceType, Record<string, Affordance>>;

export const affordance_types = ["properties", "actions", "events"] as const;
export type AffordanceType = (typeof affordance_types)[number];
export interface Affordance {
    forms: {
        href: string;
        op: Op | Op[];
    }[];
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

export const supportedLanguages = ["javascript", "python", "java"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const supportedLibraries: Record<SupportedLanguage, string[]> = {
    javascript: ["fetch", "axios"],
    python: ["requests", "httpx"],
    java: ["okhttp", "apache-httpclient"],
};
