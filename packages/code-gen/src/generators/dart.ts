import { Op } from "../types.js";
import { CodeGenerator, getHttpMethod, operationHasPayload } from "./helpers.js";

// ---------------------------------------------------------------------------
// dart_wot  –  Dart WoT client library
// ---------------------------------------------------------------------------

function getDartWotOperation(operation: Op, affordanceKey: string): string {
    switch (operation) {
        case "readproperty":
            return [
                `final output = await thing.readProperty("${affordanceKey}");`,
                `final value = await output.value();`,
                `print("${affordanceKey}: $value");`,
            ].join("\n    ");
        case "writeproperty":
            return [
                `// TODO: Replace with the actual value to write`,
                `final value = {};`,
                `await thing.writeProperty("${affordanceKey}", value);`,
                `print("${affordanceKey} written successfully");`,
            ].join("\n    ");
        case "observeproperty":
            return [
                `final subscription = await thing.observeProperty("${affordanceKey}",`,
                `    (data) async {`,
                `        final value = await data.value();`,
                `        print("${affordanceKey} changed: $value");`,
                `    },`,
                `);`,
                `print("Observing ${affordanceKey}...");`,
            ].join("\n    ");
        case "invokeaction":
            return [
                `// TODO: Replace with the actual input if required`,
                `final input = null;`,
                `final output = await thing.invokeAction("${affordanceKey}", input);`,
                `if (output != null) {`,
                `    final result = await output.value();`,
                `    print("${affordanceKey} result: $result");`,
                `} else {`,
                `    print("${affordanceKey} invoked successfully");`,
                `}`,
            ].join("\n    ");
        case "subscribeevent":
            return [
                `final subscription = await thing.subscribeEvent("${affordanceKey}",`,
                `    (data) async {`,
                `        final value = await data.value();`,
                `        print("${affordanceKey} event: $value");`,
                `    },`,
                `);`,
                `print("Subscribed to ${affordanceKey}...");`,
            ].join("\n    ");
        default:
            return `// TODO: Implement ${operation} for "${affordanceKey}"`;
    }
}

export const generateDartWotCode: CodeGenerator = (ctx) => {
    const { td, affordanceKey, operation } = ctx;

    return `import "dart:convert";
import "package:dart_wot/dart_wot.dart";

// Auto-generated code using dart_wot
// Operation: ${operation} on "${affordanceKey}"

Future<void> main() async {
    final servient = Servient.create(clientFactories: [
        HttpClientFactory(),
        CoapClientFactory(),
    ]);
    final wot = await servient.start();

    final tdJson = jsonDecode('''${JSON.stringify(td, null, 4)}''');
    final thing = await wot.consume(tdJson);

    ${getDartWotOperation(operation, affordanceKey)}
}
`;
};

// ---------------------------------------------------------------------------
// http  –  Dart http package
// ---------------------------------------------------------------------------

export const generateDartHttpCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const payloadBlock = hasPayload
        ? `
    // TODO: Replace with the actual value to send
    final payload = jsonEncode({});
`
        : "";

    const methodCall = hasPayload
        ? `final response = await http.${method.toLowerCase()}(\n        url,\n        headers: {"Content-Type": "application/json"},\n        body: payload,\n    );`
        : `final response = await http.${method.toLowerCase()}(\n        url,\n        headers: {"Content-Type": "application/json"},\n    );`;

    return `import "dart:convert";
import "package:http/http.dart" as http;

// Auto-generated code using the http package
// Operation: ${operation} on "${affordanceKey}"

Future<void> main() async {
    final url = Uri.parse("${form.href}");
${payloadBlock}
    ${methodCall}

    print("Status: \${response.statusCode}");
    print("${affordanceKey}: \${response.body}");
}
`;
};
