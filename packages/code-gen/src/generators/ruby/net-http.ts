import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a Ruby code snippet using the net/http library
 * @returns The generated code as a string and the file extension
 */
export function generateRubyNetHttpCode(
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

    const code = buildRubySnippet(form, operation, affordanceKey);
    return { code, extension: "rb" };
}

function buildRubySnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toLowerCase();
    const rubyClassMethod = method.charAt(0).toUpperCase() + method.slice(1);

    const lines: string[] = [];

    lines.push(`require 'net/http'`);
    lines.push(`require 'json'`);
    lines.push(`require 'uri'`);
    lines.push(``);
    lines.push(`# Auto-generated Ruby code using Net::HTTP`);
    lines.push(`# Operation: ${operation} on "${affordanceKey}"`);
    lines.push(``);
    lines.push(`uri = URI.parse("${url}")`);
    lines.push(``);

    if (isWriteOperation(operation) || operation === "invokeaction") {
        lines.push(`# TODO: Set the value or input to write`);
        lines.push(`payload = {}`);
        lines.push(``);
        lines.push(`http = Net::HTTP.new(uri.host, uri.port)`);
        lines.push(`http.use_ssl = (uri.scheme == "https")`);
        lines.push(``);
        lines.push(`request = Net::HTTP::${rubyClassMethod}.new(uri.request_uri)`);
        lines.push(`request['Content-Type'] = 'application/json'`);
        lines.push(`request.body = payload.to_json`);
        lines.push(``);
        lines.push(`response = http.request(request)`);
        lines.push(`puts "Status: #{response.code}"`);
        lines.push(`puts "Response: #{response.body}"`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`# Long-polling loop for event subscription`);
        lines.push(`loop do`);
        lines.push(`  begin`);
        lines.push(`    response = Net::HTTP.get_response(uri)`);
        lines.push(`    puts "Event received: #{response.body}"`);
        lines.push(`  rescue => e`);
        lines.push(`    puts "Polling error: #{e.message}"`);
        lines.push(`    sleep(1) # Wait before retrying`);
        lines.push(`  end`);
        lines.push(`end`);
    } else {
        // Read operations
        lines.push(`http = Net::HTTP.new(uri.host, uri.port)`);
        lines.push(`http.use_ssl = (uri.scheme == "https")`);
        lines.push(``);
        lines.push(`request = Net::HTTP::${rubyClassMethod}.new(uri.request_uri)`);
        lines.push(``);
        lines.push(`response = http.request(request)`);
        lines.push(`puts "Status: #{response.code}"`);
        lines.push(`puts "Response: #{response.body}"`);
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
