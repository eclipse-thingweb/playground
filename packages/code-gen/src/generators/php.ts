import { CodeGenerator, getHttpMethod, operationHasPayload } from "./helpers.js";

// ---------------------------------------------------------------------------
// cURL  –  PHP HTTP client
// ---------------------------------------------------------------------------

export const generatePhpCurlCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const payloadBlock = hasPayload
        ? `
// TODO: Replace with the actual value to send
$payload = json_encode([]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);`
        : "";

    return `<?php
// Auto-generated code using cURL
// Operation: ${operation} on "${affordanceKey}"

$url = "${form.href}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");
${payloadBlock}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $httpCode\\n";
echo "${affordanceKey}: $response\\n";
`;
};
