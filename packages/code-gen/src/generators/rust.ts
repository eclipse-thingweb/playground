import { CodeGenerator, getHttpMethod, operationHasPayload } from "./helpers.js";

// ---------------------------------------------------------------------------
// reqwest  –  Rust async HTTP client
// ---------------------------------------------------------------------------

export const generateReqwestCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const payloadDef = hasPayload
        ? `\n    // TODO: Replace with the actual value to send\n    let payload = serde_json::json!({});\n`
        : "";

    const requestBuilder = hasPayload
        ? `reqwest::Client::new()\n        .${method.toLowerCase()}(url)\n        .header("Content-Type", "application/json")\n        .json(&payload)\n        .send()`
        : `reqwest::Client::new()\n        .${method.toLowerCase()}(url)\n        .send()`;

    return `use reqwest;
use serde_json;

// Auto-generated code using reqwest
// Operation: ${operation} on "${affordanceKey}"

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "${form.href}";
${payloadDef}
    let response = ${requestBuilder}
        .await?;

    println!("Status: {}", response.status());
    let body = response.text().await?;
    println!("${affordanceKey}: {}", body);

    Ok(())
}
`;
};
