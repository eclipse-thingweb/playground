import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a Rust code snippet using the reqwest library
 * @returns The generated code as a string and the file extension
 */
export function generateRustReqwestCode(
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

    const code = buildRustSnippet(form, operation, affordanceKey);
    return { code, extension: "rs" };
}

function buildRustSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toLowerCase();

    const lines: string[] = [];

    lines.push(`// Auto-generated code using the reqwest library`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(`// Add dependencies to Cargo.toml: reqwest = { version = "0.11", features = ["json"] }, tokio = { version = "1", features = ["full"] }, serde_json = "1.0"`);
    lines.push(``);
    lines.push(`use std::error::Error;`);
    lines.push(`use tokio;`);
    lines.push(`use reqwest::Client;`);
    lines.push(``);
    lines.push(`#[tokio::main]`);
    lines.push(`async fn main() -> Result<(), Box<dyn Error>> {`);
    lines.push(`    let client = Client::new();`);
    lines.push(`    let url = "${url}";`);
    lines.push(``);

    if (isWriteOperation(operation) || operation === "invokeaction") {
        lines.push(`    // TODO: Set the value or input to write`);
        lines.push(`    let payload = serde_json::json!({});`);
        lines.push(``);
        lines.push(`    let response = client.${method}(url)`);
        lines.push(`        .json(&payload)`);
        lines.push(`        .send()`);
        lines.push(`        .await?;`);
        lines.push(``);
        lines.push(`    println!("Status: {}", response.status());`);
        lines.push(`    let response_text = response.text().await?;`);
        lines.push(`    println!("Response: {}", response_text);`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`    // Long-polling loop for event subscription`);
        lines.push(`    loop {`);
        lines.push(`        let result = client.get(url).send().await;`);
        lines.push(`        match result {`);
        lines.push(`            Ok(response) => {`);
        lines.push(`                if let Ok(text) = response.text().await {`);
        lines.push(`                    println!("Event received: {}", text);`);
        lines.push(`                }`);
        lines.push(`            }`);
        lines.push(`            Err(e) => {`);
        lines.push(`                eprintln!("Polling error: {}", e);`);
        lines.push(`                tokio::time::sleep(std::time::Duration::from_secs(1)).await; // Wait before retrying`);
        lines.push(`            }`);
        lines.push(`        }`);
        lines.push(`    }`);
    } else {
        // Read operations
        lines.push(`    let response = client.${method}(url)`);
        lines.push(`        .send()`);
        lines.push(`        .await?;`);
        lines.push(``);
        lines.push(`    println!("Status: {}", response.status());`);
        lines.push(`    let response_text = response.text().await?;`);
        lines.push(`    println!("Response: {}", response_text);`);
    }

    lines.push(``);
    lines.push(`    Ok(())`);
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
