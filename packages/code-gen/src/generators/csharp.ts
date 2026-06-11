import { Op } from "../types.js";
import { CodeGenerator, getHttpMethod, operationHasPayload } from "./helpers.js";

// ---------------------------------------------------------------------------
// System.Net.Http.HttpClient  –  C# built-in HTTP client
// ---------------------------------------------------------------------------

export const generateCSharpHttpClientCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const httpMethodClass: Record<string, string> = {
        GET: "HttpMethod.Get",
        POST: "HttpMethod.Post",
        PUT: "HttpMethod.Put",
        DELETE: "HttpMethod.Delete",
        PATCH: "HttpMethod.Patch",
    };
    const methodExpr = httpMethodClass[method] ?? `new HttpMethod("${method}")`;

    const payloadDecl = hasPayload
        ? `
            // TODO: Replace with the actual value to send
            var payload = "{}";
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");`
        : "";

    return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

// Auto-generated code using System.Net.Http.HttpClient
// Operation: ${operation} on "${affordanceKey}"

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();

        var url = "${form.href}";
        var request = new HttpRequestMessage(${methodExpr}, url);
${payloadDecl}

        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Status: {(int)response.StatusCode}");
        Console.WriteLine($"${affordanceKey}: {body}");
    }
}
`;
};

// ---------------------------------------------------------------------------
// WoT.Net  –  .NET WoT client library
// ---------------------------------------------------------------------------

function getWotNetOperation(operation: Op, affordanceKey: string): string {
    switch (operation) {
        case "readproperty":
            return [
                `var value = await thing.ReadPropertyAsync<object>("${affordanceKey}");`,
                `Console.WriteLine($"${affordanceKey}: {value}");`,
            ].join("\n            ");
        case "writeproperty":
            return [
                `// TODO: Replace with the actual value to write`,
                `object value = new { };`,
                `await thing.WritePropertyAsync("${affordanceKey}", value);`,
                `Console.WriteLine("${affordanceKey} written successfully");`,
            ].join("\n            ");
        case "observeproperty":
            return [
                `var subscription = await thing.ObservePropertyAsync<object>("${affordanceKey}",`,
                `    value => Console.WriteLine($"${affordanceKey} changed: {value}"));`,
                `Console.WriteLine("Observing ${affordanceKey}... Press Enter to stop.");`,
                `Console.ReadLine();`,
                `subscription.Dispose();`,
            ].join("\n            ");
        case "invokeaction":
            return [
                `// TODO: Replace with the actual input if required`,
                `object? input = null;`,
                `var result = await thing.InvokeActionAsync<object>("${affordanceKey}", input);`,
                `Console.WriteLine($"${affordanceKey} result: {result}");`,
            ].join("\n            ");
        case "subscribeevent":
            return [
                `var subscription = await thing.SubscribeEventAsync<object>("${affordanceKey}",`,
                `    data => Console.WriteLine($"${affordanceKey} event: {data}"));`,
                `Console.WriteLine("Subscribed to ${affordanceKey}... Press Enter to stop.");`,
                `Console.ReadLine();`,
                `subscription.Dispose();`,
            ].join("\n            ");
        default:
            return `// TODO: Implement ${operation} for "${affordanceKey}"`;
    }
}

export const generateWotNetCode: CodeGenerator = (ctx) => {
    const { td, affordanceKey, operation } = ctx;

    return `using System;
using System.Threading.Tasks;
using WoT.Net;

// Auto-generated code using WoT.Net
// Operation: ${operation} on "${affordanceKey}"

class Program
{
    static async Task Main()
    {
        try
        {
            var servient = new Servient();
            var wot = await servient.StartAsync();

            var tdJson = @"${JSON.stringify(td).replace(/"/g, '""')}";
            var thing = await wot.ConsumeAsync(tdJson);

            ${getWotNetOperation(operation, affordanceKey)}
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex);
        }
    }
}
`;
};
