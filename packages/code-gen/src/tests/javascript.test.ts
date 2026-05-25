import { describe, it, expect } from "vitest";
import {
    generateFetchCode,
    generateNodeWotCode,
    generateWebthingCode,
    generateModbusSerialCode,
} from "../generators/javascript.js";
import { CodeGeneratorContext } from "../generators/helpers.js";
import { HTTP_TD, MODBUS_TD, STREAMING_TD } from "./fixtures.js";

function makeCtx(overrides: Partial<CodeGeneratorContext>): CodeGeneratorContext {
    return {
        td: HTTP_TD,
        affordanceType: "properties",
        affordanceKey: "temperature",
        operation: "readproperty",
        form: HTTP_TD.properties.temperature.forms[0],
        affordance: HTTP_TD.properties.temperature,
        ...overrides,
    };
}

describe("generateFetchCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateFetchCode(makeCtx({}));
        expect(code).toContain('method: "GET"');
        expect(code).toContain("response.json()");
        expect(code).not.toContain("payload");
    });

    it("generates PUT request with payload for writeproperty", () => {
        const code = generateFetchCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('method: "PUT"');
        expect(code).toContain("const payload = {};");
        expect(code).toContain("JSON.stringify(payload)");
    });

    it("generates streaming response for observeproperty", () => {
        const form = STREAMING_TD.properties.liveData.forms[0];
        const code = generateFetchCode(
            makeCtx({
                td: STREAMING_TD,
                affordanceKey: "liveData",
                operation: "observeproperty",
                form,
                affordance: STREAMING_TD.properties.liveData,
            })
        );
        expect(code).toContain("reader");
        expect(code).toContain("TextDecoder");
        expect(code).not.toContain("response.json()");
    });

    it("includes the correct URL from the form", () => {
        const code = generateFetchCode(makeCtx({}));
        expect(code).toContain("https://example.com/properties/temperature");
    });

    it("includes error handling", () => {
        const code = generateFetchCode(makeCtx({}));
        expect(code).toContain("response.ok");
        expect(code).toContain("Request failed");
    });
});

describe("generateNodeWotCode", () => {
    it("includes Servient and binding imports", () => {
        const code = generateNodeWotCode(makeCtx({}));
        expect(code).toContain('import { Servient } from "@node-wot/core"');
        expect(code).toContain("HttpClientFactory");
    });

    it("generates readProperty call", () => {
        const code = generateNodeWotCode(makeCtx({}));
        expect(code).toContain('readProperty("temperature")');
        expect(code).toContain("value");
    });

    it("generates writeProperty call", () => {
        const code = generateNodeWotCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('writeProperty("temperature"');
        expect(code).toContain("written successfully");
    });

    it("generates observeProperty call", () => {
        const code = generateNodeWotCode(
            makeCtx({
                td: STREAMING_TD,
                affordanceKey: "liveData",
                operation: "observeproperty",
                form: STREAMING_TD.properties.liveData.forms[0],
                affordance: STREAMING_TD.properties.liveData,
            })
        );
        expect(code).toContain('observeProperty("liveData"');
        expect(code).toContain("Observing liveData");
    });

    it("generates invokeAction call", () => {
        const code = generateNodeWotCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain('invokeAction("toggle"');
    });

    it("generates subscribeEvent call", () => {
        const code = generateNodeWotCode(
            makeCtx({
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "subscribeevent",
                form: HTTP_TD.events.overheating.forms[0],
                affordance: HTTP_TD.events.overheating,
            })
        );
        expect(code).toContain('subscribeEvent("overheating"');
    });

    it("generates unsubscribeEvent call", () => {
        const code = generateNodeWotCode(
            makeCtx({
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "unsubscribeevent",
                form: HTTP_TD.events.overheating.forms[0],
                affordance: HTTP_TD.events.overheating,
            })
        );
        expect(code).toContain('unsubscribeEvent("overheating")');
    });

    it("includes TD as JSON in the generated code", () => {
        const code = generateNodeWotCode(makeCtx({}));
        expect(code).toContain("const td =");
    });

    it("embeds servient.start() and consume()", () => {
        const code = generateNodeWotCode(makeCtx({}));
        expect(code).toContain("servient.start()");
        expect(code).toContain("wotHelper.consume(td)");
    });
});

describe("generateWebthingCode", () => {
    it("generates WebSocket code for streaming operations", () => {
        const form = { href: "http://example.com/liveData", op: "observeproperty" as const };
        const code = generateWebthingCode(
            makeCtx({
                td: STREAMING_TD,
                affordanceKey: "liveData",
                operation: "observeproperty",
                form,
                affordance: STREAMING_TD.properties.liveData,
            })
        );
        expect(code).toContain("WebSocket");
        expect(code).toContain("ws://");
    });

    it("falls back to fetch for non-streaming operations", () => {
        const code = generateWebthingCode(makeCtx({}));
        expect(code).toContain("fetch");
        expect(code).not.toContain("WebSocket");
    });
});

describe("generateModbusSerialCode", () => {
    it("generates readCoils call", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[0];
        const code = generateModbusSerialCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("readCoils");
        expect(code).toContain("192.168.1.1");
        expect(code).toContain("port: 502");
        expect(code).toContain("setID(1)");
        expect(code).toContain(".data");
    });

    it("generates writeCoil call for writeproperty", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[1];
        const code = generateModbusSerialCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "writeproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("writeCoil");
        expect(code).toContain("const value = true;");
        expect(code).not.toContain(".data");
    });

    it("generates readHoldingRegisters call", () => {
        const form = MODBUS_TD.properties.holdingRegister.forms[0];
        const code = generateModbusSerialCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "holdingRegister",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.holdingRegister,
            })
        );
        expect(code).toContain("readHoldingRegisters");
    });

    it("includes client.close()", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[0];
        const code = generateModbusSerialCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("client.close()");
    });
});
