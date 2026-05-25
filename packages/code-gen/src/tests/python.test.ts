import { describe, it, expect } from "vitest";
import { generateRequestsCode, generateWotPyCode, generatePyModbusCode } from "../generators/python.js";
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

describe("generateRequestsCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateRequestsCode(makeCtx({}));
        expect(code).toContain("import requests");
        expect(code).toContain("requests.get");
        expect(code).toContain("response.json()");
    });

    it("generates PUT request with payload for writeproperty", () => {
        const code = generateRequestsCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain("requests.put");
        expect(code).toContain("json=payload");
        expect(code).toContain("payload = {}");
    });

    it("generates streaming response for observeproperty", () => {
        const form = STREAMING_TD.properties.liveData.forms[0];
        const code = generateRequestsCode(
            makeCtx({
                td: STREAMING_TD,
                affordanceKey: "liveData",
                operation: "observeproperty",
                form,
                affordance: STREAMING_TD.properties.liveData,
            })
        );
        expect(code).toContain("stream=True");
        expect(code).toContain("iter_lines");
    });

    it("calls raise_for_status()", () => {
        const code = generateRequestsCode(makeCtx({}));
        expect(code).toContain("raise_for_status()");
    });
});

describe("generateWotPyCode", () => {
    it("generates read_property call for readproperty", () => {
        const code = generateWotPyCode(makeCtx({}));
        expect(code).toContain("from wotpy");
        expect(code).toContain('read_property("temperature")');
        expect(code).toContain("asyncio.run(main())");
    });

    it("generates write_property call for writeproperty", () => {
        const code = generateWotPyCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('write_property("temperature"');
        expect(code).toContain("written successfully");
    });

    it("generates observe subscription for observeproperty", () => {
        const form = STREAMING_TD.properties.liveData.forms[0];
        const code = generateWotPyCode(
            makeCtx({
                td: STREAMING_TD,
                affordanceKey: "liveData",
                operation: "observeproperty",
                form,
                affordance: STREAMING_TD.properties.liveData,
            })
        );
        expect(code).toContain(".subscribe(on_next)");
        expect(code).toContain("Observing liveData");
    });

    it("generates invoke_action call for invokeaction", () => {
        const code = generateWotPyCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain('invoke_action("toggle"');
    });

    it("generates subscribeevent handler", () => {
        const code = generateWotPyCode(
            makeCtx({
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "subscribeevent",
                form: HTTP_TD.events.overheating.forms[0],
                affordance: HTTP_TD.events.overheating,
            })
        );
        expect(code).toContain("Subscribed to overheating");
        expect(code).toContain(".subscribe(on_next)");
    });

    it("includes servient shutdown", () => {
        const code = generateWotPyCode(makeCtx({}));
        expect(code).toContain("servient.shutdown()");
    });
});

describe("generatePyModbusCode", () => {
    it("generates read_coils call", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[0];
        const code = generatePyModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("ModbusTcpClient");
        expect(code).toContain("read_coils");
        expect(code).toContain("slave=1");
        expect(code).toContain(".bits");
    });

    it("generates read_holding_registers call with .registers attribute", () => {
        const form = MODBUS_TD.properties.holdingRegister.forms[0];
        const code = generatePyModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "holdingRegister",
                operation: "readproperty",
                form,
                affordance: MODBUS_TD.properties.holdingRegister,
            })
        );
        expect(code).toContain("read_holding_registers");
        expect(code).toContain(".registers");
    });

    it("generates write call for writeproperty", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[1];
        const code = generatePyModbusCode(
            makeCtx({
                td: MODBUS_TD,
                affordanceKey: "coilStatus",
                operation: "writeproperty",
                form,
                affordance: MODBUS_TD.properties.coilStatus,
            })
        );
        expect(code).toContain("write_coil");
        expect(code).toContain("value = True");
    });

    it("includes client.close()", () => {
        const form = MODBUS_TD.properties.coilStatus.forms[0];
        const code = generatePyModbusCode(
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
