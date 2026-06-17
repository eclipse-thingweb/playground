import { describe, it, expect } from "vitest";
import {
    getProtocolFromHref,
    getProtocolFromForm,
    getEffectiveOps,
    getHttpMethod,
    operationHasPayload,
    isStreamingOperation,
    selectForm,
    parseModbusInfo,
    getNodeWotBindings,
    extractAvailableAffordances,
    getAvailableOperations,
    getAvailableProtocols,
    getAvailableLanguages,
    getAvailableLibraries,
    splitLibrariesByProtocolSupport,
} from "../generators/helpers.js";
import { Form, Op } from "../types.js";
import { HTTP_TD, MODBUS_TD, EMPTY_TD, WRITE_ONLY_TD } from "./fixtures.js";

describe("getProtocolFromHref", () => {
    it("extracts http from a standard URL", () => {
        expect(getProtocolFromHref("http://example.com/foo")).toBe("http");
    });

    it("extracts https from a secure URL", () => {
        expect(getProtocolFromHref("https://example.com/foo")).toBe("https");
    });

    it("extracts coap from a CoAP URL", () => {
        expect(getProtocolFromHref("coap://example.com/sensor")).toBe("coap");
    });

    it("extracts modbus from modbus+tcp URL", () => {
        expect(getProtocolFromHref("modbus+tcp://192.168.1.1:502/1/100")).toBe("modbus");
    });

    it("extracts mqtt from an MQTT URL", () => {
        expect(getProtocolFromHref("mqtt://broker.example.com/topic")).toBe("mqtt");
    });

    it("handles empty string", () => {
        expect(getProtocolFromHref("")).toBe("");
    });

    it("handles URL with no path", () => {
        expect(getProtocolFromHref("http://localhost")).toBe("http");
    });

    it("extracts coaps from coaps URL", () => {
        expect(getProtocolFromHref("coaps://example.com/sensor")).toBe("coaps");
    });

    it("returns empty string for a relative href with no scheme", () => {
        expect(getProtocolFromHref("/")).toBe("");
        expect(getProtocolFromHref("/properties/status")).toBe("");
    });
});

describe("getProtocolFromForm", () => {
    it("uses the href scheme when the href is absolute", () => {
        expect(getProtocolFromForm({ href: "https://example.com/foo" })).toBe("https");
        expect(getProtocolFromForm({ href: "modbus+tcp://192.168.1.1:502/1/100" })).toBe("modbus");
    });

    it("infers modbus from vocabulary prefixes when the href is relative", () => {
        const form = {
            op: ["readproperty"],
            href: "/",
            "modbus:unitID": "{{UNITID}}",
            "modbus:quantity": 1,
            "modbus:address": 109,
            "modbus:entity": "HoldingRegister",
        } as unknown as Form;
        expect(getProtocolFromForm(form)).toBe("modbus");
    });

    it("infers modbus from the official modv prefix", () => {
        expect(getProtocolFromForm({ href: "/", "modv:address": 1 } as unknown as Form)).toBe("modbus");
    });

    it("prefers a protocol-specific prefix over the generic HTTP vocabulary", () => {
        const form = {
            href: "/",
            "htv:methodName": "GET",
            "modbus:address": 1,
        } as unknown as Form;
        expect(getProtocolFromForm(form)).toBe("modbus");
    });

    it("falls back to http when only the HTTP vocabulary is present on a relative href", () => {
        expect(getProtocolFromForm({ href: "/", "htv:methodName": "GET" } as unknown as Form)).toBe("http");
    });

    it("returns empty string when no protocol can be determined", () => {
        expect(getProtocolFromForm({ href: "/" })).toBe("");
    });
});

describe("getEffectiveOps", () => {
    it("returns form.op array when op is specified as array", () => {
        const form: Form = { href: "http://x", op: ["readproperty", "writeproperty"] };
        expect(getEffectiveOps(form, "properties")).toEqual(["readproperty", "writeproperty"]);
    });

    it("returns form.op wrapped in array when op is a single string", () => {
        const form: Form = { href: "http://x", op: "invokeaction" };
        expect(getEffectiveOps(form, "actions")).toEqual(["invokeaction"]);
    });

    it("returns default property ops when op is omitted", () => {
        const form: Form = { href: "http://x" };
        expect(getEffectiveOps(form, "properties")).toEqual(["readproperty", "writeproperty"]);
    });

    it("returns readproperty only for readOnly properties", () => {
        const form: Form = { href: "http://x" };
        expect(getEffectiveOps(form, "properties", { readOnly: true, forms: [] })).toEqual(["readproperty"]);
    });

    it("returns writeproperty only for writeOnly properties", () => {
        const form: Form = { href: "http://x" };
        expect(getEffectiveOps(form, "properties", { writeOnly: true, forms: [] })).toEqual(["writeproperty"]);
    });

    it("returns invokeaction for actions when op is omitted", () => {
        const form: Form = { href: "http://x" };
        expect(getEffectiveOps(form, "actions")).toEqual(["invokeaction"]);
    });

    it("returns subscribeevent for events when op is omitted", () => {
        const form: Form = { href: "http://x" };
        expect(getEffectiveOps(form, "events")).toEqual(["subscribeevent"]);
    });
});

describe("getHttpMethod", () => {
    it("returns GET for readproperty", () => {
        expect(getHttpMethod("readproperty", { href: "" })).toBe("GET");
    });

    it("returns PUT for writeproperty", () => {
        expect(getHttpMethod("writeproperty", { href: "" })).toBe("PUT");
    });

    it("returns POST for invokeaction", () => {
        expect(getHttpMethod("invokeaction", { href: "" })).toBe("POST");
    });

    it("returns DELETE for cancelaction", () => {
        expect(getHttpMethod("cancelaction", { href: "" })).toBe("DELETE");
    });

    it("returns GET for observeproperty", () => {
        expect(getHttpMethod("observeproperty", { href: "" })).toBe("GET");
    });

    it("returns GET for subscribeevent", () => {
        expect(getHttpMethod("subscribeevent", { href: "" })).toBe("GET");
    });

    it("returns DELETE for unsubscribeevent", () => {
        expect(getHttpMethod("unsubscribeevent", { href: "" })).toBe("DELETE");
    });

    it("respects htv:methodName override", () => {
        const form: Form = { href: "", "htv:methodName": "PATCH" };
        expect(getHttpMethod("readproperty", form)).toBe("PATCH");
    });

    it("returns GET for readallproperties", () => {
        expect(getHttpMethod("readallproperties", { href: "" })).toBe("GET");
    });

    it("returns PUT for writeallproperties", () => {
        expect(getHttpMethod("writeallproperties", { href: "" })).toBe("PUT");
    });

    it("returns GET for queryaction", () => {
        expect(getHttpMethod("queryaction", { href: "" })).toBe("GET");
    });

    it("returns DELETE for unobserveproperty", () => {
        expect(getHttpMethod("unobserveproperty", { href: "" })).toBe("DELETE");
    });
});

describe("operationHasPayload", () => {
    it("returns true for writeproperty", () => {
        expect(operationHasPayload("writeproperty")).toBe(true);
    });

    it("returns true for invokeaction", () => {
        expect(operationHasPayload("invokeaction")).toBe(true);
    });

    it("returns false for readproperty", () => {
        expect(operationHasPayload("readproperty")).toBe(false);
    });

    it("returns false for subscribeevent", () => {
        expect(operationHasPayload("subscribeevent")).toBe(false);
    });

    it("returns true for writeallproperties", () => {
        expect(operationHasPayload("writeallproperties")).toBe(true);
    });

    it("returns true for writemultiproperties", () => {
        expect(operationHasPayload("writemultiproperties")).toBe(true);
    });

    it("returns false for observeproperty", () => {
        expect(operationHasPayload("observeproperty")).toBe(false);
    });
});

describe("isStreamingOperation", () => {
    it("returns true for observeproperty", () => {
        expect(isStreamingOperation("observeproperty")).toBe(true);
    });

    it("returns true for subscribeevent", () => {
        expect(isStreamingOperation("subscribeevent")).toBe(true);
    });

    it("returns true for observeallproperties", () => {
        expect(isStreamingOperation("observeallproperties")).toBe(true);
    });

    it("returns true for subscribeallevents", () => {
        expect(isStreamingOperation("subscribeallevents")).toBe(true);
    });

    it("returns false for readproperty", () => {
        expect(isStreamingOperation("readproperty")).toBe(false);
    });

    it("returns false for invokeaction", () => {
        expect(isStreamingOperation("invokeaction")).toBe(false);
    });
});

describe("selectForm", () => {
    const forms: Form[] = [
        { href: "https://example.com/prop", op: ["readproperty", "writeproperty"] },
        { href: "coap://example.com/prop", op: "readproperty" },
        { href: "mqtt://broker.example.com/prop", op: "observeproperty" },
    ];

    it("selects the HTTPS form for readproperty with HTTP/HTTPS support", () => {
        const form = selectForm(forms, "readproperty", ["http", "https"] as any);
        expect(form.href).toBe("https://example.com/prop");
    });

    it("selects the CoAP form for readproperty with CoAP support", () => {
        const form = selectForm(forms, "readproperty", ["coap"] as any);
        expect(form.href).toBe("coap://example.com/prop");
    });

    it("throws when no form matches", () => {
        expect(() => selectForm(forms, "invokeaction", ["http"] as any)).toThrow(
            'No form found for operation "invokeaction"'
        );
    });

    it("selects based on default ops when form.op is undefined", () => {
        const formsNoOp: Form[] = [{ href: "https://example.com/prop" }];
        const form = selectForm(formsNoOp, "readproperty", ["https"] as any, "properties");
        expect(form.href).toBe("https://example.com/prop");
    });
});

describe("parseModbusInfo", () => {
    it("parses a standard Modbus form with all extensions", () => {
        const form: Form = {
            href: "modbus+tcp://192.168.1.1:502/1/100",
            "modv:unitID": 5,
            "modv:address": 200,
            "modv:quantity": 10,
            "modv:function": "readHoldingRegisters",
        };
        const info = parseModbusInfo(form);
        expect(info.host).toBe("192.168.1.1");
        expect(info.port).toBe(502);
        expect(info.unitId).toBe(5);
        expect(info.address).toBe(200);
        expect(info.quantity).toBe(10);
        expect(info.modbusFunction).toBe("readHoldingRegisters");
    });

    it("falls back to path segments when extensions are missing", () => {
        const form: Form = {
            href: "modbus+tcp://192.168.1.1:502/3/50",
        };
        const info = parseModbusInfo(form);
        expect(info.host).toBe("192.168.1.1");
        expect(info.port).toBe(502);
        expect(info.unitId).toBe(3);
        expect(info.address).toBe(50);
        expect(info.quantity).toBe(1);
        expect(info.modbusFunction).toBe("readCoil");
    });

    it("uses default port 502 when port is missing", () => {
        const form: Form = {
            href: "modbus+tcp://192.168.1.1/1/0",
        };
        const info = parseModbusInfo(form);
        expect(info.port).toBe(502);
    });

    it("uses default unitId and address when path is empty", () => {
        const form: Form = {
            href: "modbus+tcp://192.168.1.1:502",
        };
        const info = parseModbusInfo(form);
        expect(info.unitId).toBe(1);
        expect(info.address).toBe(0);
    });
});

describe("getNodeWotBindings", () => {
    it("returns unique bindings for forms with different protocols", () => {
        const forms: Form[] = [
            { href: "http://example.com/a" },
            { href: "https://example.com/b" },
            { href: "coap://example.com/c" },
        ];
        const bindings = getNodeWotBindings(forms);
        expect(bindings).toHaveLength(2); // http and https share HttpClientFactory
        expect(bindings[0].factoryName).toBe("HttpClientFactory");
        expect(bindings[1].factoryName).toBe("CoapClientFactory");
    });

    it("deduplicates bindings for the same protocol", () => {
        const forms: Form[] = [{ href: "http://a.com/1" }, { href: "http://b.com/2" }];
        const bindings = getNodeWotBindings(forms);
        expect(bindings).toHaveLength(1);
    });

    it("returns empty array for unknown protocols", () => {
        const forms: Form[] = [{ href: "ftp://example.com" }];
        const bindings = getNodeWotBindings(forms);
        expect(bindings).toHaveLength(0);
    });

    it("handles MQTT and Modbus bindings", () => {
        const forms: Form[] = [{ href: "mqtt://broker.com/topic" }, { href: "modbus+tcp://192.168.1.1/1/0" }];
        const bindings = getNodeWotBindings(forms);
        expect(bindings).toHaveLength(2);
        expect(bindings.map((b) => b.factoryName)).toContain("MqttClientFactory");
        expect(bindings.map((b) => b.factoryName)).toContain("ModbusClientFactory");
    });
});

describe("extractAvailableAffordances", () => {
    it("returns affordances grouped by type", () => {
        const affordances = extractAvailableAffordances(HTTP_TD);
        expect(Object.keys(affordances.properties)).toEqual(["temperature", "status"]);
        expect(Object.keys(affordances.actions)).toEqual(["toggle"]);
        expect(Object.keys(affordances.events)).toEqual(["overheating"]);
    });

    it("always returns a complete shape with empty records for missing types", () => {
        const affordances = extractAvailableAffordances(MODBUS_TD);
        expect(affordances.actions).toEqual({});
        expect(affordances.events).toEqual({});
    });

    it("returns empty records for an empty TD", () => {
        const affordances = extractAvailableAffordances(EMPTY_TD);
        expect(affordances).toEqual({ properties: {}, actions: {}, events: {} });
    });
});

describe("getAvailableOperations", () => {
    it("returns the declared ops for an affordance", () => {
        const ops = getAvailableOperations(HTTP_TD.properties.temperature, "properties");
        expect(ops).toEqual(["readproperty", "writeproperty"]);
    });

    it("applies readOnly default when op is omitted", () => {
        const ops = getAvailableOperations(HTTP_TD.properties.status, "properties");
        expect(ops).toEqual(["readproperty"]);
    });

    it("applies writeOnly default when op is omitted", () => {
        const ops = getAvailableOperations(WRITE_ONLY_TD.properties.command, "properties");
        expect(ops).toEqual(["writeproperty"]);
    });

    it("de-duplicates ops across multiple forms", () => {
        const ops = getAvailableOperations(MODBUS_TD.properties.coilStatus, "properties");
        expect(ops.sort()).toEqual(["readproperty", "writeproperty"]);
    });

    it("returns an empty array for an undefined affordance", () => {
        expect(getAvailableOperations(undefined, "properties")).toEqual([]);
    });

    it("returns an empty array for an affordance with no forms", () => {
        expect(getAvailableOperations({ forms: [] }, "properties")).toEqual([]);
    });
});

describe("getAvailableProtocols", () => {
    it("returns the protocols used by all forms when no operation is given", () => {
        const protocols = getAvailableProtocols(HTTP_TD.properties.temperature, "properties");
        expect(protocols).toEqual(["https"]);
    });

    it("filters forms by operation when one is supplied", () => {
        const readProtocols = getAvailableProtocols(MODBUS_TD.properties.coilStatus, "properties", "readproperty");
        expect(readProtocols).toEqual(["modbus"]);
    });

    it("returns an empty array for an undefined affordance", () => {
        expect(getAvailableProtocols(undefined, "properties")).toEqual([]);
    });
});

describe("getAvailableLanguages", () => {
    it("includes the supported languages", () => {
        const languages = getAvailableLanguages();
        expect(languages).toContain("javascript");
        expect(languages).toContain("python");
        expect(languages).toContain("java");
    });
});

describe("getAvailableLibraries", () => {
    it("returns the libraries for a known language", () => {
        const libraries = getAvailableLibraries("javascript");
        expect(libraries).toContain("fetch");
        expect(libraries).toContain("node-wot");
    });

    it("returns an empty array for an unknown language", () => {
        expect(getAvailableLibraries("cobol")).toEqual([]);
    });
});

describe("splitLibrariesByProtocolSupport", () => {
    it("splits libraries by whether they support the available protocols", () => {
        const { supportedLibraries, unsupportedLibraries } = splitLibrariesByProtocolSupport("javascript", ["http"]);
        expect(supportedLibraries).toContain("fetch");
        expect(supportedLibraries).toContain("node-wot");
        expect(supportedLibraries).toContain("webthing");
        expect(unsupportedLibraries).toContain("modbus-serial");
    });

    it("marks all libraries unsupported when no protocol matches", () => {
        const { supportedLibraries, unsupportedLibraries } = splitLibrariesByProtocolSupport("javascript", []);
        expect(supportedLibraries).toEqual([]);
        expect(unsupportedLibraries.length).toBeGreaterThan(0);
    });

    it("returns empty lists for an unknown language", () => {
        const result = splitLibrariesByProtocolSupport("cobol", ["http"]);
        expect(result).toEqual({ supportedLibraries: [], unsupportedLibraries: [] });
    });
});
