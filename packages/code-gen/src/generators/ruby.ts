import { CodeGenerator, getHttpMethod, operationHasPayload } from "./helpers.js";

// ---------------------------------------------------------------------------
// Net::HTTP  –  Ruby standard library HTTP client
// ---------------------------------------------------------------------------

export const generateRubyNetHttpCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const rubyHttpClass: Record<string, string> = {
        GET: "Net::HTTP::Get",
        POST: "Net::HTTP::Post",
        PUT: "Net::HTTP::Put",
        DELETE: "Net::HTTP::Delete",
        PATCH: "Net::HTTP::Patch",
    };
    const reqClass = rubyHttpClass[method] ?? `Net::HTTP::Get`;

    const payloadBlock = hasPayload
        ? `
# TODO: Replace with the actual value to send
request.content_type = "application/json"
request.body = JSON.generate({})`
        : "";

    const sslLine = form.href.startsWith("https") ? `http.use_ssl = true` : `http.use_ssl = false`;

    return `require "net/http"
require "uri"
require "json"

# Auto-generated code using Net::HTTP
# Operation: ${operation} on "${affordanceKey}"

uri = URI.parse("${form.href}")

http = Net::HTTP.new(uri.host, uri.port)
${sslLine}

request = ${reqClass}.new(uri.request_uri)
${payloadBlock}

response = http.request(request)

puts "Status: #{response.code}"
puts "${affordanceKey}: #{response.body}"
`;
};
