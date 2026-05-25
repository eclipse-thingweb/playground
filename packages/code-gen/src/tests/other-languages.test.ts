import { describe, it, expect } from "vitest";
import { generateReqwestCode } from "../generators/rust.js";
import { generateGoNetHttpCode } from "../generators/go.js";
import { generateCSharpHttpClientCode, generateWotNetCode } from "../generators/csharp.js";
import { generatePhpCurlCode } from "../generators/php.js";
import { generateRubyNetHttpCode } from "../generators/ruby.js";
import { generateDartWotCode, generateDartHttpCode } from "../generators/dart.js";
import { CodeGeneratorContext } from "../generators/helpers.js";
import { HTTP_TD, STREAMING_TD } from "./fixtures.js";

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

// ─── Rust ─────────────────────────────────────────────────────────────────────

describe("generateReqwestCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateReqwestCode(makeCtx({}));
        expect(code).toContain("use reqwest");
        expect(code).toContain("#[tokio::main]");
        expect(code).toContain(".get(url)");
        expect(code).toContain("temperature");
    });

    it("generates PUT request with payload for writeproperty", () => {
        const code = generateReqwestCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain(".put(url)");
        expect(code).toContain(".json(&payload)");
        expect(code).toContain("serde_json::json!({})");
    });

    it("generates POST request for invokeaction", () => {
        const code = generateReqwestCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain(".post(url)");
    });

    it("returns Result type", () => {
        const code = generateReqwestCode(makeCtx({}));
        expect(code).toContain("Result<(), Box<dyn std::error::Error>>");
    });
});

// ─── Go ───────────────────────────────────────────────────────────────────────

describe("generateGoNetHttpCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateGoNetHttpCode(makeCtx({}));
        expect(code).toContain("package main");
        expect(code).toContain('"net/http"');
        expect(code).toContain('"GET"');
        expect(code).toContain("temperature");
    });

    it("generates PUT request with payload for writeproperty", () => {
        const code = generateGoNetHttpCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('"PUT"');
        expect(code).toContain("json.Marshal");
        expect(code).toContain("bytes.NewBuffer");
        expect(code).toContain('"bytes"');
    });

    it("does not import bytes for GET requests", () => {
        const code = generateGoNetHttpCode(makeCtx({}));
        expect(code).not.toContain('"bytes"');
        expect(code).toContain("nil");
    });

    it("includes timeout on the client", () => {
        const code = generateGoNetHttpCode(makeCtx({}));
        expect(code).toContain("Timeout: 10 * time.Second");
    });

    it("reads and prints response body", () => {
        const code = generateGoNetHttpCode(makeCtx({}));
        expect(code).toContain("io.ReadAll");
        expect(code).toContain("resp.Status");
    });
});

// ─── C# ───────────────────────────────────────────────────────────────────────

describe("generateCSharpHttpClientCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateCSharpHttpClientCode(makeCtx({}));
        expect(code).toContain("System.Net.Http");
        expect(code).toContain("HttpMethod.Get");
        expect(code).toContain("temperature");
    });

    it("generates POST request with payload for invokeaction", () => {
        const code = generateCSharpHttpClientCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain("HttpMethod.Post");
        expect(code).toContain("StringContent");
    });

    it("generates DELETE method for cancelaction", () => {
        const form = { href: "https://example.com/actions/toggle", op: "cancelaction" as const };
        const code = generateCSharpHttpClientCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "cancelaction",
                form,
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain("HttpMethod.Delete");
    });

    it("includes proper class structure", () => {
        const code = generateCSharpHttpClientCode(makeCtx({}));
        expect(code).toContain("class Program");
        expect(code).toContain("static async Task Main()");
        expect(code).toContain("EnsureSuccessStatusCode");
    });
});

describe("generateWotNetCode", () => {
    it("generates ReadPropertyAsync call", () => {
        const code = generateWotNetCode(makeCtx({}));
        expect(code).toContain("WoT.Net");
        expect(code).toContain('ReadPropertyAsync<object>("temperature")');
    });

    it("generates WritePropertyAsync call", () => {
        const code = generateWotNetCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('WritePropertyAsync("temperature"');
    });

    it("generates ObservePropertyAsync call", () => {
        const code = generateWotNetCode(
            makeCtx({
                operation: "observeproperty",
                form: { href: "https://example.com/temp", op: "observeproperty" },
            })
        );
        expect(code).toContain('ObservePropertyAsync<object>("temperature"');
        expect(code).toContain("Dispose");
    });

    it("generates InvokeActionAsync call", () => {
        const code = generateWotNetCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain('InvokeActionAsync<object>("toggle"');
    });

    it("generates SubscribeEventAsync call", () => {
        const code = generateWotNetCode(
            makeCtx({
                affordanceType: "events",
                affordanceKey: "overheating",
                operation: "subscribeevent",
                form: HTTP_TD.events.overheating.forms[0],
                affordance: HTTP_TD.events.overheating,
            })
        );
        expect(code).toContain('SubscribeEventAsync<object>("overheating"');
    });
});

// ─── PHP ──────────────────────────────────────────────────────────────────────

describe("generatePhpCurlCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generatePhpCurlCode(makeCtx({}));
        expect(code).toContain("<?php");
        expect(code).toContain("curl_init");
        expect(code).toContain("CURLOPT_CUSTOMREQUEST");
        expect(code).toContain('"GET"');
    });

    it("generates POST request with payload for invokeaction", () => {
        const code = generatePhpCurlCode(
            makeCtx({
                affordanceType: "actions",
                affordanceKey: "toggle",
                operation: "invokeaction",
                form: HTTP_TD.actions.toggle.forms[0],
                affordance: HTTP_TD.actions.toggle,
            })
        );
        expect(code).toContain('"POST"');
        expect(code).toContain("CURLOPT_POSTFIELDS");
        expect(code).toContain("json_encode");
    });

    it("includes curl_close()", () => {
        const code = generatePhpCurlCode(makeCtx({}));
        expect(code).toContain("curl_close");
    });
});

// ─── Ruby ─────────────────────────────────────────────────────────────────────

describe("generateRubyNetHttpCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateRubyNetHttpCode(makeCtx({}));
        expect(code).toContain('require "net/http"');
        expect(code).toContain("Net::HTTP::Get");
        expect(code).toContain("temperature");
    });

    it("generates PUT request with payload for writeproperty", () => {
        const code = generateRubyNetHttpCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain("Net::HTTP::Put");
        expect(code).toContain("request.body = JSON.generate");
    });

    it("sets use_ssl = true for HTTPS", () => {
        const code = generateRubyNetHttpCode(makeCtx({}));
        expect(code).toContain("use_ssl = true");
    });

    it("sets use_ssl = false for HTTP", () => {
        const form = { href: "http://example.com/temp", op: "readproperty" as const };
        const code = generateRubyNetHttpCode(makeCtx({ form }));
        expect(code).toContain("use_ssl = false");
    });
});

// ─── Dart ─────────────────────────────────────────────────────────────────────

describe("generateDartWotCode", () => {
    it("generates readProperty call", () => {
        const code = generateDartWotCode(makeCtx({}));
        expect(code).toContain("dart_wot");
        expect(code).toContain('readProperty("temperature")');
    });

    it("generates writeProperty call", () => {
        const code = generateDartWotCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain('writeProperty("temperature"');
    });

    it("generates observeProperty call", () => {
        const code = generateDartWotCode(
            makeCtx({
                operation: "observeproperty",
                form: { href: "https://example.com/temp", op: "observeproperty" },
            })
        );
        expect(code).toContain('observeProperty("temperature"');
    });

    it("generates invokeAction call", () => {
        const code = generateDartWotCode(
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
        const code = generateDartWotCode(
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

    it("includes Servient and factory setup", () => {
        const code = generateDartWotCode(makeCtx({}));
        expect(code).toContain("Servient.create");
        expect(code).toContain("HttpClientFactory");
        expect(code).toContain("CoapClientFactory");
    });
});

describe("generateDartHttpCode", () => {
    it("generates GET request for readproperty", () => {
        const code = generateDartHttpCode(makeCtx({}));
        expect(code).toContain("package:http/http.dart");
        expect(code).toContain("http.get");
    });

    it("generates PUT request with payload for writeproperty", () => {
        const code = generateDartHttpCode(makeCtx({ operation: "writeproperty" }));
        expect(code).toContain("http.put");
        expect(code).toContain("jsonEncode");
    });

    it("includes URI parsing", () => {
        const code = generateDartHttpCode(makeCtx({}));
        expect(code).toContain("Uri.parse");
    });

    it("prints status code and body", () => {
        const code = generateDartHttpCode(makeCtx({}));
        expect(code).toContain("response.statusCode");
        expect(code).toContain("response.body");
    });
});
