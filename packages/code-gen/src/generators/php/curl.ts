import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a PHP code snippet using the cURL extension
 * @returns The generated code as a string and the file extension
 */
export function generatePhpCurlCode(
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

    const code = buildPhpSnippet(form, operation, affordanceKey);
    return { code, extension: "php" };
}

function buildPhpSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toUpperCase();

    const lines: string[] = [];

    lines.push(`<?php`);
    lines.push(`// Auto-generated PHP code using cURL`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(``);
    lines.push(`$url = "${url}";`);
    lines.push(``);

    if (isWriteOperation(operation) || operation === "invokeaction") {
        lines.push(`// TODO: Set the value or input to write`);
        lines.push(`$payload = json_encode([]);`);
        lines.push(``);
        lines.push(`$ch = curl_init($url);`);
        lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");`);
        lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);`);
        lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
        lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, array(`);
        lines.push(`    'Content-Type: application/json',`);
        lines.push(`    'Content-Length: ' . strlen($payload)`);
        lines.push(`));`);
        lines.push(``);
        lines.push(`$response = curl_exec($ch);`);
        lines.push(`$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);`);
        lines.push(`curl_close($ch);`);
        lines.push(``);
        lines.push(`echo "Status: $status\\n";`);
        lines.push(`echo "Response: $response\\n";`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`// Long-polling loop for event subscription`);
        lines.push(`while (true) {`);
        lines.push(`    $ch = curl_init($url);`);
        lines.push(`    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
        lines.push(`    `);
        lines.push(`    $response = curl_exec($ch);`);
        lines.push(`    $error = curl_error($ch);`);
        lines.push(`    curl_close($ch);`);
        lines.push(``);
        lines.push(`    if ($response !== false) {`);
        lines.push(`        echo "Event received: $response\\n";`);
        lines.push(`    } else {`);
        lines.push(`        echo "Polling error: $error\\n";`);
        lines.push(`        sleep(1); // Wait before retrying`);
        lines.push(`    }`);
        lines.push(`}`);
    } else {
        // Read operations
        lines.push(`$ch = curl_init($url);`);
        lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");`);
        lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
        lines.push(``);
        lines.push(`$response = curl_exec($ch);`);
        lines.push(`$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);`);
        lines.push(`curl_close($ch);`);
        lines.push(``);
        lines.push(`echo "Status: $status\\n";`);
        lines.push(`echo "Response: $response\\n";`);
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
