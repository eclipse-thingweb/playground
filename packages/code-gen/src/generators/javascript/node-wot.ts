import { AffordanceType, Op, TD } from "../../types.js";

/**
 * Generates a JavaScript code snippet using the node-wot library
 * @returns The generated code as a string and the file extension
 */
export function generateNodeWotCode(
    td: TD,
    affordanceType: AffordanceType,
    affordanceKey: string,
    operation: Op
): { code: string; extension: string } {
    const affordance = td[affordanceType][affordanceKey];
    const form = affordance.forms.find((f) => {
        return Array.isArray(f.op) ? f.op.includes(operation) : f.op === operation;
    });

    if (!form) {
        throw new Error(`No form found for operation "${operation}" on ${affordanceType}/${affordanceKey}`);
    }

    const code = buildNodeWotSnippet(td, affordanceKey, operation);
    return { code, extension: "js" };
}

function buildNodeWotSnippet(td: TD, affordanceKey: string, operation: Op): string {
    const lines: string[] = [];
    const indent = "    ";

    // Imports
    lines.push(`import { Servient } from "@node-wot/core";`);
    lines.push(`import { HttpClientFactory } from "@node-wot/binding-http";`);
    lines.push(``);
    lines.push(`// Auto-generated code using node-wot`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(``);

    // Wrap in async main
    lines.push(`async function main() {`);

    // TD inline (indented)
    const tdLines = JSON.stringify(td, null, 4).split("\n");
    lines.push(`${indent}const td = ${tdLines[0]}`);
    for (let i = 1; i < tdLines.length; i++) {
        lines.push(`${indent}${tdLines[i]}`);
    }
    lines.push(``);

    // Servient setup
    lines.push(`${indent}const servient = new Servient();`);
    lines.push(`${indent}servient.addClientFactory(new HttpClientFactory());`);
    lines.push(``);
    lines.push(`${indent}const wotHelper = await servient.start();`);
    lines.push(`${indent}const thing = await wotHelper.consume(td);`);
    lines.push(``);

    // Operation-specific code
    switch (operation) {
        case "readproperty":
            lines.push(`${indent}const result = await thing.readProperty("${affordanceKey}");`);
            lines.push(`${indent}const value = await result.value();`);
            lines.push(`${indent}console.log("${affordanceKey}:", value);`);
            break;

        case "writeproperty":
            lines.push(`${indent}// TODO: Set the value to write`);
            lines.push(`${indent}const value = null;`);
            lines.push(`${indent}await thing.writeProperty("${affordanceKey}", value);`);
            lines.push(`${indent}console.log("Property written successfully");`);
            break;

        case "observeproperty":
            lines.push(`${indent}await thing.observeProperty("${affordanceKey}", async (data) => {`);
            lines.push(`${indent}    const value = await data.value();`);
            lines.push(`${indent}    console.log("${affordanceKey} changed:", value);`);
            lines.push(`${indent}});`);
            lines.push(``);
            lines.push(`${indent}console.log("Observing property '${affordanceKey}'...");`);
            break;

        case "invokeaction":
            lines.push(`${indent}// TODO: Set the action input parameters`);
            lines.push(`${indent}const params = undefined;`);
            lines.push(`${indent}const result = await thing.invokeAction("${affordanceKey}", params);`);
            lines.push(`${indent}if (result) {`);
            lines.push(`${indent}    const output = await result.value();`);
            lines.push(`${indent}    console.log("Action result:", output);`);
            lines.push(`${indent}} else {`);
            lines.push(`${indent}    console.log("Action invoked successfully");`);
            lines.push(`${indent}}`);
            break;

        case "subscribeevent":
            lines.push(`${indent}await thing.subscribeEvent("${affordanceKey}", async (data) => {`);
            lines.push(`${indent}    const value = await data.value();`);
            lines.push(`${indent}    console.log("Event '${affordanceKey}':", value);`);
            lines.push(`${indent}});`);
            lines.push(``);
            lines.push(`${indent}console.log("Subscribed to event '${affordanceKey}'...");`);
            break;

        case "unsubscribeevent":
            lines.push(`${indent}await thing.unsubscribeEvent("${affordanceKey}");`);
            lines.push(`${indent}console.log("Unsubscribed from event '${affordanceKey}'");`);
            break;

        case "readallproperties":
            lines.push(`${indent}const result = await thing.readAllProperties();`);
            lines.push(`${indent}const values = await result.value();`);
            lines.push(`${indent}console.log("All properties:", values);`);
            break;

        case "writeallproperties":
            lines.push(`${indent}// TODO: Set the values to write`);
            lines.push(`${indent}const values = {};`);
            lines.push(`${indent}await thing.writeAllProperties(values);`);
            lines.push(`${indent}console.log("All properties written successfully");`);
            break;

        default:
            lines.push(`${indent}// Operation "${operation}" — manual implementation required`);
            lines.push(`${indent}console.log("Operation '${operation}' is not directly mapped.");`);
            break;
    }

    lines.push(``);
    lines.push(`${indent}// await servient.shutdown();`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`main();`);

    return lines.join("\n");
}
