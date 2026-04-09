import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a Go code snippet using the net/http library
 * @returns The generated code as a string and the file extension
 */
export function generateGoNetHttpCode(
    td: TD,
    affordanceType: AffordanceType,
    affordanceKey: string,
    operation: Op
): { code: string; extension: string } {
    const affordance = td[affordanceType][affordanceKey];
    const form = affordance.forms.find((f) => {
        const hasOp = Array.isArray(f.op) ? f.op.includes(operation) : f.op === operation;
        const isHttp = f.href.startsWith("http://") || f.href.startsWith("https://");
        return hasOp && isHttp;
    });

    if (!form) {
        throw new Error(`No form found for operation "${operation}" on ${affordanceType}/${affordanceKey}`);
    }

    const code = buildGoSnippet(form, operation, affordanceKey);
    return { code, extension: "go" };
}

function buildGoSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toUpperCase();

    const lines: string[] = [];

    lines.push(`// Auto-generated code using the net/http library`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(`package main`);
    lines.push(``);
    lines.push(`import (`);
    lines.push(`\t"bytes"`);
    lines.push(`\t"encoding/json"`);
    lines.push(`\t"fmt"`);
    lines.push(`\t"io"`);
    lines.push(`\t"net/http"`);
    lines.push(`\t"time"`);
    lines.push(`)`);
    lines.push(``);
    lines.push(`func main() {`);
    lines.push(`\turl := "${url}"`);
    lines.push(``);

    if (isWriteOperation(operation) || operation === "invokeaction") {
        lines.push(`\t// TODO: Set the value or input to write`);
        lines.push(`\tpayload := map[string]interface{}{}`);
        lines.push(`\tjsonPayload, err := json.Marshal(payload)`);
        lines.push(`\tif err != nil {`);
        lines.push(`\t\tpanic(err)`);
        lines.push(`\t}`);
        lines.push(``);
        lines.push(`\treq, err := http.NewRequest("${method}", url, bytes.NewBuffer(jsonPayload))`);
        lines.push(`\tif err != nil {`);
        lines.push(`\t\tpanic(err)`);
        lines.push(`\t}`);
        lines.push(`\treq.Header.Set("Content-Type", "application/json")`);
        lines.push(``);
        lines.push(`\tclient := &http.Client{Timeout: 10 * time.Second}`);
        lines.push(`\tresp, err := client.Do(req)`);
        lines.push(`\tif err != nil {`);
        lines.push(`\t\tpanic(err)`);
        lines.push(`\t}`);
        lines.push(`\tdefer resp.Body.Close()`);
        lines.push(``);
        lines.push(`\tbody, _ := io.ReadAll(resp.Body)`);
        lines.push(`\tfmt.Println("Status:", resp.Status)`);
        lines.push(`\tfmt.Println("Response:", string(body))`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`\t// Long-polling loop for event subscription`);
        lines.push(`\tfor {`);
        lines.push(`\t\tresp, err := http.Get(url)`);
        lines.push(`\t\tif err != nil {`);
        lines.push(`\t\t\tfmt.Println("Polling error:", err)`);
        lines.push(`\t\t\ttime.Sleep(1 * time.Second)`);
        lines.push(`\t\t\tcontinue`);
        lines.push(`\t\t}`);
        lines.push(``);
        lines.push(`\t\tbody, _ := io.ReadAll(resp.Body)`);
        lines.push(`\t\tresp.Body.Close()`);
        lines.push(`\t\tfmt.Println("Event received:", string(body))`);
        lines.push(`\t}`);
    } else {
        // Read operations
        lines.push(`\treq, err := http.NewRequest("${method}", url, nil)`);
        lines.push(`\tif err != nil {`);
        lines.push(`\t\tpanic(err)`);
        lines.push(`\t}`);
        lines.push(``);
        lines.push(`\tclient := &http.Client{Timeout: 10 * time.Second}`);
        lines.push(`\tresp, err := client.Do(req)`);
        lines.push(`\tif err != nil {`);
        lines.push(`\t\tpanic(err)`);
        lines.push(`\t}`);
        lines.push(`\tdefer resp.Body.Close()`);
        lines.push(``);
        lines.push(`\tbody, _ := io.ReadAll(resp.Body)`);
        lines.push(`\tfmt.Println("Status:", resp.Status)`);
        lines.push(`\tfmt.Println("Response:", string(body))`);
    }

    lines.push(`}`);

    return lines.join("\n");
}

function getDefaultMethod(operation: Op): string {
    switch (operation) {
        case "readproperty":
        case "readallproperties":
        case "readmultiproperties":
            return "GET";
        case "writeproperty":
        case "writeallproperties":
        case "writemultiproperties":
            return "PUT";
        case "invokeaction":
            return "POST";
        case "subscribeevent":
        case "subscribeallevents":
            return "GET";
        default:
            return "GET";
    }
}

function isWriteOperation(op: Op): boolean {
    return op === "writeproperty" || op === "writeallproperties" || op === "writemultiproperties";
}

function isSubscribeOperation(op: Op): boolean {
    return op === "subscribeevent" || op === "subscribeallevents" || op === "observeproperty" || op === "observeallproperties";
}
