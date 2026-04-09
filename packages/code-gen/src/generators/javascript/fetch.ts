import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a JavaScript code snippet using the Fetch API
 * @returns The generated code as a string and the file extension
 */
export function generateFetchCode(
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

    const code = buildFetchSnippet(form, operation, affordanceKey);
    return { code, extension: "js" };
}

function buildFetchSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = form["htv:methodName"] ?? getDefaultMethod(operation);

    const lines: string[] = [];
    const indent = "    ";
    lines.push(`// Auto-generated code using the Fetch API`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(``);
    lines.push(`async function main() {`);

    if (isWriteOperation(operation)) {
        lines.push(`${indent}const url = "${url}";`);
        lines.push(``);
        lines.push(`${indent}// TODO: Set the value to write`);
        lines.push(`${indent}const payload = {};`);
        lines.push(``);
        lines.push(`${indent}const response = await fetch(url, {`);
        lines.push(`${indent}    method: "${method}",`);
        lines.push(`${indent}    headers: { "Content-Type": "application/json" },`);
        lines.push(`${indent}    body: JSON.stringify(payload),`);
        lines.push(`${indent}});`);
        lines.push(``);
        lines.push(`${indent}console.log("Status:", response.status);`);
        lines.push(`${indent}const data = await response.json();`);
        lines.push(`${indent}console.log("Response:", data);`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`${indent}const url = "${url}";`);
        lines.push(``);
        lines.push(`${indent}// Long-polling loop for event subscription`);
        lines.push(`${indent}while (true) {`);
        lines.push(`${indent}    try {`);
        lines.push(`${indent}        const response = await fetch(url);`);
        lines.push(`${indent}        const data = await response.json();`);
        lines.push(`${indent}        console.log("Event received:", data);`);
        lines.push(`${indent}    } catch (error) {`);
        lines.push(`${indent}        console.error("Polling error:", error);`);
        lines.push(`${indent}        // Wait before retrying`);
        lines.push(`${indent}        await new Promise((resolve) => setTimeout(resolve, 1000));`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
    } else {
        // Read / invoke operations
        lines.push(`${indent}const url = "${url}";`);
        lines.push(``);

        if (operation === "invokeaction") {
            lines.push(`${indent}// TODO: Set the action input parameters`);
            lines.push(`${indent}const payload = {};`);
            lines.push(``);
            lines.push(`${indent}const response = await fetch(url, {`);
            lines.push(`${indent}    method: "${method}",`);
            lines.push(`${indent}    headers: { "Content-Type": "application/json" },`);
            lines.push(`${indent}    body: JSON.stringify(payload),`);
            lines.push(`${indent}});`);
        } else {
            lines.push(`${indent}const response = await fetch(url, {`);
            lines.push(`${indent}    method: "${method}",`);
            lines.push(`${indent}});`);
        }

        lines.push(``);
        lines.push(`${indent}const data = await response.json();`);
        lines.push(`${indent}console.log("Response:", data);`);
    }

    lines.push(`}`);
    lines.push(``);
    lines.push(`main();`);

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
    return (
        op === "subscribeevent" ||
        op === "subscribeallevents" ||
        op === "observeproperty" ||
        op === "observeallproperties"
    );
}
