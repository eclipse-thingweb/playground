import { CodeGenerator, getHttpMethod, operationHasPayload } from "./helpers.js";

// ---------------------------------------------------------------------------
// net/http  –  Go standard library HTTP client
// ---------------------------------------------------------------------------

export const generateGoNetHttpCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const imports = hasPayload
        ? `"bytes"\n\t"encoding/json"\n\t"fmt"\n\t"io"\n\t"net/http"\n\t"time"`
        : `"fmt"\n\t"io"\n\t"net/http"\n\t"time"`;

    const payloadBlock = hasPayload
        ? `
\t// TODO: Replace with the actual value to send
\tpayload := map[string]interface{}{}
\tjsonData, err := json.Marshal(payload)
\tif err != nil {
\t\tpanic(err)
\t}

\treq, err := http.NewRequest("${method}", url, bytes.NewBuffer(jsonData))
\tif err != nil {
\t\tpanic(err)
\t}
\treq.Header.Set("Content-Type", "application/json")`
        : `
\treq, err := http.NewRequest("${method}", url, nil)
\tif err != nil {
\t\tpanic(err)
\t}`;

    return `// Auto-generated code using the net/http library
// Operation: ${operation} on "${affordanceKey}"

package main

import (
\t${imports}
)

func main() {
\turl := "${form.href}"
${payloadBlock}

\tclient := &http.Client{Timeout: 10 * time.Second}
\tresp, err := client.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tbody, _ := io.ReadAll(resp.Body)
\tfmt.Println("Status:", resp.Status)
\tfmt.Println("${affordanceKey}:", string(body))
}
`;
};
