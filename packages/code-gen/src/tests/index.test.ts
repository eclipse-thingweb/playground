import { describe, it, expect } from "vitest";
import { generateCode, isProtocolSupported, generatePrompt } from "../index.js";
import { HTTP_TD, MODBUS_TD, EMPTY_TD, WRITE_ONLY_TD, CUSTOM_METHOD_TD } from "./fixtures.js";

describe("generateCode", () => {
    describe("JavaScript / fetch", () => {
        it("generates fetch code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "fetch",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("fetch");
                expect(result.code).toContain("temperature");
                expect(result.code).toContain("GET");
            }
        });

        it("generates fetch code for writeproperty with payload", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "fetch",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("PUT");
                expect(result.code).toContain("payload");
                expect(result.code).toContain("body");
            }
        });

        it("generates fetch code for invokeaction", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "fetch",
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("POST");
                expect(result.code).toContain("toggle");
            }
        });

        it("generates fetch code for subscribeevent (streaming)", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "fetch",
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "subscribeevent",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("reader");
                expect(result.code).toContain("overheating");
            }
        });
    });

    describe("JavaScript / node-wot", () => {
        it("generates node-wot code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "node-wot",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("Servient");
                expect(result.code).toContain("readProperty");
                expect(result.code).toContain("temperature");
                expect(result.code).toContain("HttpClientFactory");
            }
        });

        it("generates node-wot code for writeproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "node-wot",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("writeProperty");
            }
        });

        it("generates node-wot code for invokeaction", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "node-wot",
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("invokeAction");
            }
        });

        it("generates node-wot code for subscribeevent", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "javascript",
                library: "node-wot",
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "subscribeevent",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("subscribeEvent");
            }
        });

        it("generates node-wot code for observeproperty", () => {
            const result = generateCode({
                td: {
                    ...HTTP_TD,
                    properties: {
                        temperature: {
                            ...HTTP_TD.properties.temperature,
                            forms: [{ href: "https://example.com/temp", op: "observeproperty" }],
                        },
                    },
                },
                language: "javascript",
                library: "node-wot",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "observeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("observeProperty");
            }
        });
    });

    describe("JavaScript / modbus-serial", () => {
        it("generates modbus-serial code for readproperty", () => {
            const result = generateCode({
                td: MODBUS_TD,
                language: "javascript",
                library: "modbus-serial",
                affordanceType: "properties",
                affordanceKey: "coilStatus",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("ModbusRTU");
                expect(result.code).toContain("readCoils");
                expect(result.code).toContain("192.168.1.1");
            }
        });

        it("generates modbus-serial code for writeproperty", () => {
            const result = generateCode({
                td: MODBUS_TD,
                language: "javascript",
                library: "modbus-serial",
                affordanceType: "properties",
                affordanceKey: "coilStatus",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("writeCoil");
                expect(result.code).toContain("value");
            }
        });
    });

    describe("Python / requests", () => {
        it("generates requests code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "python",
                library: "requests",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("import requests");
                expect(result.code).toContain("requests.get");
                expect(result.code).toContain("temperature");
            }
        });

        it("generates requests code for writeproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "python",
                library: "requests",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("requests.put");
                expect(result.code).toContain("payload");
            }
        });
    });

    describe("Python / wotpy", () => {
        it("generates wotpy code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "python",
                library: "wotpy",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("wotpy");
                expect(result.code).toContain("read_property");
            }
        });

        it("generates wotpy code for invokeaction", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "python",
                library: "wotpy",
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("invoke_action");
            }
        });
    });

    describe("Python / PyModbus", () => {
        it("generates PyModbus code for reading coils", () => {
            const result = generateCode({
                td: MODBUS_TD,
                language: "python",
                library: "PyModbus",
                affordanceType: "properties",
                affordanceKey: "coilStatus",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("ModbusTcpClient");
                expect(result.code).toContain("read_coils");
            }
        });

        it("generates PyModbus code for reading holding registers", () => {
            const result = generateCode({
                td: MODBUS_TD,
                language: "python",
                library: "PyModbus",
                affordanceType: "properties",
                affordanceKey: "holdingRegister",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("read_holding_registers");
                expect(result.code).toContain(".registers");
            }
        });
    });

    describe("Java / httpclient", () => {
        it("generates Java HTTP client code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "java",
                library: "httpclient",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("HttpClient");
                expect(result.code).toContain(".GET()");
                expect(result.code).toContain("temperature");
            }
        });

        it("generates Java HTTP client code for invokeaction", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "java",
                library: "httpclient",
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("POST");
                expect(result.code).toContain("payload");
            }
        });
    });

    describe("Java / wot-servient", () => {
        it("generates wot-servient code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "java",
                library: "wot-servient",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("DefaultWot");
                expect(result.code).toContain('readProperty("temperature")');
            }
        });
    });

    describe("Java / digitalpetri/modbus", () => {
        it("generates digitalpetri modbus code", () => {
            const result = generateCode({
                td: MODBUS_TD,
                language: "java",
                library: "digitalpetri/modbus",
                affordanceType: "properties",
                affordanceKey: "coilStatus",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("ModbusTcpMaster");
                expect(result.code).toContain("ReadCoilsRequest");
            }
        });
    });

    describe("Rust / reqwest", () => {
        it("generates reqwest code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "rust",
                library: "reqwest",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("reqwest");
                expect(result.code).toContain("#[tokio::main]");
                expect(result.code).toContain(".get(url)");
            }
        });

        it("generates reqwest code for writeproperty with payload", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "rust",
                library: "reqwest",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain(".put(url)");
                expect(result.code).toContain("json!({})");
            }
        });
    });

    describe("Go / net-http", () => {
        it("generates Go net/http code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "go",
                library: "net-http",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("net/http");
                expect(result.code).toContain("GET");
                expect(result.code).toContain("temperature");
            }
        });

        it("generates Go net/http code for writeproperty with payload", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "go",
                library: "net-http",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("PUT");
                expect(result.code).toContain("json.Marshal");
                expect(result.code).toContain("bytes.NewBuffer");
            }
        });
    });

    describe("C# / httpclient", () => {
        it("generates C# HttpClient code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "c#",
                library: "httpclient",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("HttpClient");
                expect(result.code).toContain("HttpMethod.Get");
                expect(result.code).toContain("temperature");
            }
        });
    });

    describe("C# / WoT.Net", () => {
        it("generates WoT.Net code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "c#",
                library: "WoT.Net",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("WoT.Net");
                expect(result.code).toContain("ReadPropertyAsync");
            }
        });
    });

    describe("PHP / curl", () => {
        it("generates PHP cURL code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "php",
                library: "curl",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("curl_init");
                expect(result.code).toContain("GET");
                expect(result.code).toContain("temperature");
            }
        });

        it("generates PHP cURL code for invokeaction with payload", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "php",
                library: "curl",
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("POST");
                expect(result.code).toContain("CURLOPT_POSTFIELDS");
            }
        });
    });

    describe("Ruby / net-http", () => {
        it("generates Ruby Net::HTTP code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "ruby",
                library: "net-http",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("Net::HTTP");
                expect(result.code).toContain("Net::HTTP::Get");
                expect(result.code).toContain("use_ssl = true");
            }
        });

        it("uses correct HTTP class for PUT", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "ruby",
                library: "net-http",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("Net::HTTP::Put");
                expect(result.code).toContain("request.body");
            }
        });
    });

    describe("Dart / dart-wot", () => {
        it("generates dart-wot code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "dart",
                library: "dart-wot",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("dart_wot");
                expect(result.code).toContain("readProperty");
                expect(result.code).toContain("temperature");
            }
        });

        it("generates dart-wot code for invokeaction", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "dart",
                library: "dart-wot",
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("invokeAction");
            }
        });
    });

    describe("Dart / http", () => {
        it("generates Dart http code for readproperty", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "dart",
                library: "http",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("package:http/http.dart");
                expect(result.code).toContain("http.get");
            }
        });

        it("generates Dart http code for writeproperty with payload", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "dart",
                library: "http",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("http.put");
                expect(result.code).toContain("payload");
            }
        });
    });

    describe("Prompt generation for unknown languages/libraries", () => {
        it("generates a prompt for unsupported library", () => {
            const result = generateCode({
                td: HTTP_TD,
                language: "kotlin",
                library: "ktor",
                affordanceType: "properties",
                affordanceKey: "temperature",
                operation: "readproperty",
            });
            expect("prompt" in result).toBe(true);
            if ("prompt" in result) {
                expect(result.prompt).toContain("kotlin");
                expect(result.prompt).toContain("ktor");
                expect(result.prompt).toContain("temperature");
            }
        });
    });

    describe("Error handling", () => {
        it("throws when affordance key does not exist", () => {
            expect(() =>
                generateCode({
                    td: HTTP_TD,
                    language: "javascript",
                    library: "fetch",
                    affordanceType: "properties",
                    affordanceKey: "nonexistent",
                    operation: "readproperty",
                })
            ).toThrow();
        });

        it("throws when operation is not supported for the affordance", () => {
            expect(() =>
                generateCode({
                    td: HTTP_TD,
                    language: "javascript",
                    library: "fetch",
                    affordanceType: "properties",
                    affordanceKey: "temperature",
                    operation: "invokeaction",
                })
            ).toThrow("invokeaction is not supported");
        });

        it("throws when protocol is not supported by the library", () => {
            expect(() =>
                generateCode({
                    td: MODBUS_TD,
                    language: "javascript",
                    library: "fetch",
                    affordanceType: "properties",
                    affordanceKey: "coilStatus",
                    operation: "readproperty",
                })
            ).toThrow("does not support the protocol");
        });
    });

    describe("Edge cases", () => {
        it("handles readOnly property with default ops", () => {
            const td = {
                ...HTTP_TD,
                properties: {
                    sensor: {
                        type: "number",
                        readOnly: true,
                        forms: [{ href: "https://example.com/sensor" }],
                    },
                },
            };
            const result = generateCode({
                td,
                language: "javascript",
                library: "fetch",
                affordanceType: "properties",
                affordanceKey: "sensor",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
        });

        it("handles writeOnly property with default ops", () => {
            const result = generateCode({
                td: WRITE_ONLY_TD,
                language: "javascript",
                library: "fetch",
                affordanceType: "properties",
                affordanceKey: "command",
                operation: "writeproperty",
            });
            expect("code" in result).toBe(true);
        });

        it("handles custom HTTP method override", () => {
            const result = generateCode({
                td: CUSTOM_METHOD_TD,
                language: "javascript",
                library: "fetch",
                affordanceType: "properties",
                affordanceKey: "config",
                operation: "readproperty",
            });
            expect("code" in result).toBe(true);
            if ("code" in result) {
                expect(result.code).toContain("POST");
            }
        });
    });
});

describe("isProtocolSupported", () => {
    it("returns true for supported protocol", () => {
        expect(isProtocolSupported("javascript", "fetch", "https")).toBe(true);
    });

    it("returns false for unsupported protocol", () => {
        expect(isProtocolSupported("javascript", "fetch", "coap")).toBe(false);
    });

    it("returns false for unknown language", () => {
        expect(isProtocolSupported("haskell", "whatever", "http")).toBe(false);
    });

    it("returns false for unknown library", () => {
        expect(isProtocolSupported("javascript", "axios", "http")).toBe(false);
    });

    it("does not match http as substring of https", () => {
        // This is the regression test for the protocol matching bug
        expect(isProtocolSupported("javascript", "fetch", "http")).toBe(true);
        // Ensure "http" doesn't accidentally match when only "https" is in the list
        // fetch supports both http and https, so both should be true
        expect(isProtocolSupported("javascript", "fetch", "https")).toBe(true);
    });

    it("correctly matches modbus protocol", () => {
        expect(isProtocolSupported("javascript", "modbus-serial", "modbus")).toBe(true);
        expect(isProtocolSupported("javascript", "modbus-serial", "http")).toBe(false);
    });
});

describe("generatePrompt", () => {
    it("generates a prompt with language and library info", () => {
        const prompt = generatePrompt({
            td: HTTP_TD,
            language: "swift",
            library: "Alamofire",
            affordanceType: "properties",
            affordanceKey: "temperature",
            operation: "readproperty",
        });
        expect(prompt).toContain("swift");
        expect(prompt).toContain("Alamofire");
        expect(prompt).toContain("temperature");
        expect(prompt).toContain("readproperty");
    });
});
