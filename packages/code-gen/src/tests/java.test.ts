import { describe, it, expect } from "vitest";
import {
    generateJavaHttpClientCode,
    generateWotServientCode,
    generateDigitalpetriModbusCode,
} from "../generators/java.js";
import { CodeGeneratorContext } from "../generators/helpers.js";
import { HTTP_TD, MODBUS_TD } from "./fixtures.js";

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

describe("generateJavaHttpClientCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateJavaHttpClientCode(makeCtx({}));
        expect(code).toContain("java.net.http.HttpClient");
        expect(code).toContain(".GET()");
        expect(code).toContain("temperature");
    });

    it("generates POST request with payload for invokeaction", () => {
        const code = generateJavaHttpClientCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain("POST");
        expect(code).toContain('String payload = "{}"');
    });

    it("generates DELETE request for cancelaction", () => {
        const form = { href: "https://example.com/actions/toggle", op: "cancelaction" as const };
        const code = generateJavaHttpClientCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "cancelaction",
                form,
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain(".DELETE()");
    });

    it("includes proper class structure", () => {
        const code = generateJavaHttpClientCode(makeCtx({}));
        expect(code).toContain("public class Main");
        expect(code).toContain("public static void main");
        expect(code).toContain("HttpClient.Version.HTTP_2");
    });
});

describe("generateWotServientCode", () => {
    it("generates readProperty call", () => {
        const code = generateWotServientCode(makeCtx({}));
        expect(code).toContain("DefaultWot");
        expect(code).toContain('readProperty("temperature")');
    });

    it("generates writeProperty call", () => {
        const code = generateWotServientCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('writeProperty("temperature"');
        expect(code).toContain("written successfully");
    });

    it("generates invokeAction call", () => {
        const code = generateWotServientCode(
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

    it("generates observeProperty subscription", () => {
        const code = generateWotServientCode(
            makeCtx({
                operation: "observeproperty",
                form: { href: "https://example.com/temp", op: "observeproperty" },
            })
        );
        expect(code).toContain('observeProperty("temperature")');
        expect(code).toContain("subscribe");
        expect(code).toContain("Thread.sleep");
    });

    it("generates subscribeEvent subscription", () => {
        const code = generateWotServientCode(
            makeCtx({
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "subscribeevent",
                form: HTTP_TD.events.overheating.forms[0],
                affordance: HTTP_TD.events.overheating,
            })
        );
        expect(code).toContain('subscribeEvent("overheating")');
    });

    it("includes TD JSON in the code", () => {
        const code = generateWotServientCode(makeCtx({}));
        expect(code).toContain("tdJson");
        expect(code).toContain("wot.consume");
    });
});

describe("generateDigitalpetriModbusCode", () => {
    it("generates ReadCoils request", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[0];
        const code = generateDigitalpetriModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("ModbusTcpMaster");
        expect(code).toContain("ReadCoilsRequest");
        expect(code).toContain("getCoilStatus");
    });

    it("generates ReadHoldingRegisters request", () => {
        const form = MODBUS_TD.properties.holdingRegister.forms[0];
        const code = generateDigitalpetriModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "holdingRegister",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.holdingRegister,
            })
        );
        expect(code).toContain("ReadHoldingRegistersRequest");
        expect(code).toContain("getRegisters");
    });

    it("generates WriteSingleCoil request for writeproperty", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[1];
        const code = generateDigitalpetriModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "writeproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("WriteSingleCoilRequest");
    });

    it("includes master.disconnect()", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[0];
        const code = generateDigitalpetriModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("master.disconnect()");
    });
});
