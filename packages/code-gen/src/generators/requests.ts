import { AffordanceType, Form, Op, TD } from "../types.js";

/**
 * Generates a Python code snippet using the requests library
 * @returns The generated code as a string and the file extension
 */
export function generateRequestsCode(
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

    const code = buildRequestsSnippet(form, operation, affordanceKey);
    return { code, extension: "py" };
}

function buildRequestsSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toLowerCase();

    const lines: string[] = [];

    // Import
    lines.push(`import requests`);
    lines.push(``);
    lines.push(`# Auto-generated code using the requests library`);
    lines.push(`# Operation: ${operation} on "${affordanceKey}"`);
    lines.push(``);

    lines.push(`url = "${url}"`);
    lines.push(``);

    if (isWriteOperation(operation)) {
        lines.push(`# TODO: Set the value to write`);
        lines.push(`payload = {}`);
        lines.push(``);
        lines.push(`response = requests.${method}(url, json=payload)`);
        lines.push(`print(f"Status: {response.status_code}")`);
        lines.push(`print(f"Response: {response.json()}")`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`# Long-polling loop for event subscription`);
        lines.push(`import time`);
        lines.push(``);
        lines.push(`while True:`);
        lines.push(`    try:`);
        lines.push(`        response = requests.get(url)`);
        lines.push(`        data = response.json()`);
        lines.push(`        print(f"Event received: {data}")`);
        lines.push(`    except Exception as e:`);
        lines.push(`        print(f"Polling error: {e}")`);
        lines.push(`        # Wait before retrying`);
        lines.push(`        time.sleep(1)`);
    } else if (operation === "invokeaction") {
        lines.push(`# TODO: Set the action input parameters`);
        lines.push(`payload = {}`);
        lines.push(``);
        lines.push(`response = requests.${method}(url, json=payload)`);
        lines.push(`print(f"Status: {response.status_code}")`);
        lines.push(`print(f"Response: {response.json()}")`);
    } else {
        // Read operations
        lines.push(`response = requests.${method}(url)`);
        lines.push(`print(f"Status: {response.status_code}")`);
        lines.push(`print(f"Response: {response.json()}")`);
    }

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
