import {
    AFFORDANCE_TYPES,
    Affordance,
    AffordanceType,
    Affordances,
    Form,
    LANGUAGES_SUPPORT,
    Op,
    PROTOCOL,
} from "../types.js";

/**
 * Maps vendor-specific vocabulary prefixes used on form keys to their protocol.
 * Used to infer the protocol when a form has a relative href (no URI scheme),
 * e.g. a form carrying `modbus:address` / `modv:address` keys uses Modbus.
 */
const PROTOCOL_VOCABULARY_PREFIXES: Record<string, string> = {
    htv: PROTOCOL.HTTP,
    cov: PROTOCOL.COAP,
    mqv: PROTOCOL.MQTT,
    modv: PROTOCOL.MODBUS,
    modbus: PROTOCOL.MODBUS,
    opc: PROTOCOL.OPC_UA,
    mbus: PROTOCOL.M_BUS,
};

/**
 * Extracts the protocol from a URI scheme.
 * e.g. "https://example.com" → "https", "modbus+tcp://..." → "modbus".
 * Returns "" when the href is relative and carries no scheme (e.g. "/").
 */
export function getProtocolFromHref(href: string): string {
    const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(href);
    if (!scheme) {
        return "";
    }
    return scheme[1].split(".")[0].split("+")[0].toLowerCase();
}

/**
 * Determines the protocol used by a form.
 * Prefers the URI scheme from the href; if the href is relative (no scheme),
 * falls back to vendor-specific vocabulary prefixes on the form's keys
 * (e.g. "modbus:address" → "modbus").
 */
export function getProtocolFromForm(form: Form): string {
    const scheme = getProtocolFromHref(form.href);
    if (scheme) {
        return scheme;
    }

    let httpFallback = "";
    for (const key of Object.keys(form)) {
        const prefix = key.split(":")[0];
        if (prefix === key) {
            continue; // not a namespaced key
        }
        const protocol = PROTOCOL_VOCABULARY_PREFIXES[prefix.toLowerCase()];
        if (!protocol) {
            continue;
        }
        // Protocol-specific prefixes win over the generic HTTP vocabulary.
        if (protocol === PROTOCOL.HTTP) {
            httpFallback = protocol;
        } else {
            return protocol;
        }
    }
    return httpFallback;
}

/**
 * Returns the effective op(s) for a form, applying WoT TD defaults when op is omitted.
 * - properties: ["readproperty", "writeproperty"] (or adjusted by readOnly/writeOnly)
 * - actions: ["invokeaction"]
 * - events: ["subscribeevent"]
 */
export function getEffectiveOps(form: Form, affordanceType: AffordanceType, affordance?: Affordance): Op[] {
    if (form.op !== undefined) {
        return Array.isArray(form.op) ? form.op : [form.op];
    }
    switch (affordanceType) {
        case "properties":
            if (affordance?.readOnly) return ["readproperty"] as Op[];
            if (affordance?.writeOnly) return ["writeproperty"] as Op[];
            return ["readproperty", "writeproperty"] as Op[];
        case "actions":
            return ["invokeaction"] as Op[];
        case "events":
            return ["subscribeevent"] as Op[];
    }
}

/* -------------------------------------------------------------------------- */
/*  Shared selection helpers                                                  */
/*  Used by every code-gen front-end (CLI, web playground, ...) so that the   */
/*  available affordances, operations, languages, libraries and protocols are */
/*  derived from a single source of truth.                                    */
/* -------------------------------------------------------------------------- */

/**
 * Extracts the interaction affordances present in a Thing Description,
 * grouped by affordance type. Missing affordance types resolve to an empty
 * record so the returned shape is always complete.
 */
export function extractAvailableAffordances(td: Affordances): Affordances {
    const affordances: Affordances = {
        properties: {},
        actions: {},
        events: {},
    };
    for (const affordanceType of AFFORDANCE_TYPES) {
        if (td?.[affordanceType]) {
            affordances[affordanceType] = td[affordanceType];
        }
    }
    return affordances;
}

/**
 * Returns the de-duplicated list of operations available for an affordance,
 * applying WoT TD op defaults (via {@link getEffectiveOps}) when a form omits
 * its `op`. Returns an empty array when the affordance has no forms.
 */
export function getAvailableOperations(affordance: Affordance | undefined, affordanceType: AffordanceType): Op[] {
    if (!affordance?.forms?.length) {
        return [];
    }
    return Array.from(new Set(affordance.forms.flatMap((form) => getEffectiveOps(form, affordanceType, affordance))));
}

/**
 * Returns the de-duplicated list of protocols used by an affordance's forms.
 * When an `operation` is supplied, only the forms supporting that operation
 * are considered. Forms whose protocol cannot be determined are ignored.
 */
export function getAvailableProtocols(
    affordance: Affordance | undefined,
    affordanceType: AffordanceType,
    operation?: Op
): string[] {
    if (!affordance?.forms?.length) {
        return [];
    }
    const forms = operation
        ? affordance.forms.filter((form) => getEffectiveOps(form, affordanceType, affordance).includes(operation))
        : affordance.forms;
    return Array.from(new Set(forms.map((form) => getProtocolFromForm(form)).filter(Boolean)));
}

/**
 * Returns the languages supported by the algorithmic (non-LLM) generators.
 */
export function getAvailableLanguages(): string[] {
    return Object.keys(LANGUAGES_SUPPORT);
}

/**
 * Returns the libraries available for a given language. Unknown languages
 * resolve to an empty array.
 */
export function getAvailableLibraries(language: string): string[] {
    return Object.keys(LANGUAGES_SUPPORT[language]?.libraries ?? {});
}

/**
 * Splits a language's libraries into those that support at least one of the
 * supplied protocols and those that do not. Useful for front-ends that want to
 * surface compatible libraries while still listing the incompatible ones
 * (e.g. as disabled choices).
 */
export function splitLibrariesByProtocolSupport(
    language: string,
    availableProtocols: string[]
): { supportedLibraries: string[]; unsupportedLibraries: string[] } {
    const supportedLibraries: string[] = [];
    const unsupportedLibraries: string[] = [];
    const librariesForLanguage = LANGUAGES_SUPPORT[language]?.libraries ?? {};
    for (const [name, protocols] of Object.entries(librariesForLanguage)) {
        if (protocols.some((protocol) => availableProtocols.includes(protocol))) {
            supportedLibraries.push(name);
        } else {
            unsupportedLibraries.push(name);
        }
    }
    return { supportedLibraries, unsupportedLibraries };
}

/** Context passed to each code generator */
export interface CodeGeneratorContext {
    td: Affordances;
    affordanceType: AffordanceType;
    affordanceKey: string;
    operation: Op;
    form: Form;
    affordance: Affordance;
}

/** A code generator function that returns a complete code snippet */
export type CodeGenerator = (ctx: CodeGeneratorContext) => string;

/**
 * Returns the default HTTP method for a WoT operation,
 * respecting any htv:methodName override on the form.
 */
export function getHttpMethod(operation: Op, form: Form): string {
    if (form["htv:methodName"]) {
        return form["htv:methodName"];
    }
    switch (operation) {
        case "readproperty":
        case "readallproperties":
        case "readmultiproperties":
        case "queryaction":
        case "queryallactions":
            return "GET";
        case "writeproperty":
        case "writeallproperties":
        case "writemultiproperties":
            return "PUT";
        case "invokeaction":
            return "POST";
        case "cancelaction":
            return "DELETE";
        case "observeproperty":
        case "observeallproperties":
        case "subscribeevent":
        case "subscribeallevents":
            return "GET";
        case "unobserveproperty":
        case "unobserveallproperties":
        case "unsubscribeevent":
        case "unsubscribeallevents":
            return "DELETE";
        default:
            return "GET";
    }
}

/** Returns true if the operation sends a request body */
export function operationHasPayload(operation: Op): boolean {
    return ["writeproperty", "writeallproperties", "writemultiproperties", "invokeaction"].includes(operation);
}

/** Returns true if the operation is a long-lived subscription */
export function isStreamingOperation(operation: Op): boolean {
    return ["observeproperty", "observeallproperties", "subscribeevent", "subscribeallevents"].includes(operation);
}

/**
 * Selects the first form that matches the operation and one of the supported protocols.
 */
export function selectForm(
    forms: Form[],
    operation: Op,
    supportedProtocols: readonly PROTOCOL[],
    affordanceType?: AffordanceType,
    affordance?: Affordance
): Form {
    const match = forms.find(
        (form) =>
            getEffectiveOps(form, affordanceType ?? "properties", affordance).includes(operation) &&
            supportedProtocols.some((p) => getProtocolFromForm(form).includes(p))
    );
    if (!match) {
        throw new Error(`No form found for operation "${operation}" with supported protocols`);
    }
    return match;
}

/** Parsed connection details from a Modbus form */
export interface ModbusInfo {
    host: string;
    port: number;
    unitId: number;
    address: number;
    quantity: number;
    modbusFunction: string;
}

/**
 * Extracts Modbus connection parameters from a form,
 * using modv: extensions and falling back to the href path segments.
 */
export function parseModbusInfo(form: Form): ModbusInfo {
    const sanitized = form.href.replace(/^modbus\+tcp/, "http");
    const url = new URL(sanitized);
    const pathParts = url.pathname.split("/").filter(Boolean);

    return {
        host: url.hostname,
        port: parseInt(url.port) || 502,
        unitId: form["modv:unitID"] ?? (pathParts[0] ? parseInt(pathParts[0]) : 1),
        address: form["modv:address"] ?? (pathParts[1] ? parseInt(pathParts[1]) : 0),
        quantity: form["modv:quantity"] ?? 1,
        modbusFunction: form["modv:function"] ?? "readCoil",
    };
}

/** Protocol-binding import info for node-wot */
export interface BindingInfo {
    packageName: string;
    factoryName: string;
}

/** Maps a protocol string to its node-wot binding package and factory class */
export const NODE_WOT_BINDINGS: Record<string, BindingInfo> = {
    http: { packageName: "@node-wot/binding-http", factoryName: "HttpClientFactory" },
    https: { packageName: "@node-wot/binding-http", factoryName: "HttpClientFactory" },
    coap: { packageName: "@node-wot/binding-coap", factoryName: "CoapClientFactory" },
    coaps: { packageName: "@node-wot/binding-coap", factoryName: "CoapClientFactory" },
    mqtt: { packageName: "@node-wot/binding-mqtt", factoryName: "MqttClientFactory" },
    opc: { packageName: "@node-wot/binding-opcua", factoryName: "OpcuaClientFactory" },
    modbus: { packageName: "@node-wot/binding-modbus", factoryName: "ModbusClientFactory" },
    netconf: { packageName: "@node-wot/binding-netconf", factoryName: "NetconfClientFactory" },
    mbus: { packageName: "@node-wot/binding-mbus", factoryName: "MbusClientFactory" },
};

/**
 * Collects the unique node-wot binding imports needed for the protocols
 * used across the given forms.
 */
export function getNodeWotBindings(forms: Form[]): BindingInfo[] {
    const seen = new Set<string>();
    const bindings: BindingInfo[] = [];
    for (const form of forms) {
        const protocol = getProtocolFromForm(form);
        const binding = NODE_WOT_BINDINGS[protocol];
        if (binding && !seen.has(binding.factoryName)) {
            seen.add(binding.factoryName);
            bindings.push(binding);
        }
    }
    return bindings;
}
