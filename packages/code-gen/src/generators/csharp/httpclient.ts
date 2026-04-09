import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a C# code snippet using the System.Net.Http.HttpClient library
 * @returns The generated code as a string and the file extension
 */
export function generateCSharpHttpClientCode(
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

    const code = buildCSharpSnippet(form, operation, affordanceKey);
    return { code, extension: "cs" };
}

function buildCSharpSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toUpperCase();

    const lines: string[] = [];

    lines.push(`// Auto-generated code using System.Net.Http.HttpClient`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(`using System;`);
    lines.push(`using System.Net.Http;`);
    lines.push(`using System.Text;`);
    lines.push(`using System.Threading.Tasks;`);
    lines.push(``);
    lines.push(`class Program`);
    lines.push(`{`);
    lines.push(`    static async Task Main(string[] args)`);
    lines.push(`    {`);
    lines.push(`        using var client = new HttpClient();`);
    lines.push(`        string url = "${url}";`);
    lines.push(``);

    if (isWriteOperation(operation) || operation === "invokeaction") {
        lines.push(`        // TODO: Set the value or input to write`);
        lines.push(`        string payload = "{}";`);
        lines.push(`        var content = new StringContent(payload, Encoding.UTF8, "application/json");`);
        lines.push(``);
        lines.push(`        var request = new HttpRequestMessage(new HttpMethod("${method}"), url) { Content = content };`);
        lines.push(`        var response = await client.SendAsync(request);`);
        lines.push(``);
        lines.push(`        Console.WriteLine($"Status: {(int)response.StatusCode}");`);
        lines.push(`        string responseText = await response.Content.ReadAsStringAsync();`);
        lines.push(`        Console.WriteLine($"Response: {responseText}");`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`        // Long-polling loop for event subscription`);
        lines.push(`        while (true)`);
        lines.push(`        {`);
        lines.push(`            try`);
        lines.push(`            {`);
        lines.push(`                var response = await client.GetAsync(url);`);
        lines.push(`                string text = await response.Content.ReadAsStringAsync();`);
        lines.push(`                Console.WriteLine($"Event received: {text}");`);
        lines.push(`            }`);
        lines.push(`            catch (Exception ex)`);
        lines.push(`            {`);
        lines.push(`                Console.WriteLine($"Polling error: {ex.Message}");`);
        lines.push(`                await Task.Delay(1000); // Wait before retrying`);
        lines.push(`            }`);
        lines.push(`        }`);
    } else {
        // Read operations
        lines.push(`        var request = new HttpRequestMessage(new HttpMethod("${method}"), url);`);
        lines.push(`        var response = await client.SendAsync(request);`);
        lines.push(``);
        lines.push(`        Console.WriteLine($"Status: {(int)response.StatusCode}");`);
        lines.push(`        string responseText = await response.Content.ReadAsStringAsync();`);
        lines.push(`        Console.WriteLine($"Response: {responseText}");`);
    }

    lines.push(`    }`);
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
