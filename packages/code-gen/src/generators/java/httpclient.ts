import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a Java code snippet using the java.net.http.HttpClient library
 * @returns The generated code as a string and the file extension
 */
export function generateJavaHttpClientCode(
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

    const code = buildJavaSnippet(form, operation, affordanceKey);
    return { code, extension: "java" };
}

function buildJavaSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const url = form.href;
    const method = (form["htv:methodName"] ?? getDefaultMethod(operation)).toUpperCase();

    const lines: string[] = [];

    lines.push(`import java.net.URI;`);
    lines.push(`import java.net.http.HttpClient;`);
    lines.push(`import java.net.http.HttpRequest;`);
    lines.push(`import java.net.http.HttpResponse;`);
    lines.push(`import java.time.Duration;`);
    lines.push(``);
    lines.push(`// Auto-generated code using the java.net.http.HttpClient library`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(`public class Main {`);
    lines.push(`    public static void main(String[] args) {`);
    lines.push(`        try {`);
    lines.push(`            HttpClient client = HttpClient.newBuilder()`);
    lines.push(`                .version(HttpClient.Version.HTTP_2)`);
    lines.push(`                .connectTimeout(Duration.ofSeconds(10))`);
    lines.push(`                .build();`);
    lines.push(``);
    lines.push(`            String url = "${url}";`);
    lines.push(``);

    if (isWriteOperation(operation) || operation === "invokeaction") {
        lines.push(`            // TODO: Set the value or input to write`);
        lines.push(`            String payload = "{}";`);
        lines.push(``);
        lines.push(`            HttpRequest request = HttpRequest.newBuilder()`);
        lines.push(`                .uri(URI.create(url))`);
        lines.push(`                .header("Content-Type", "application/json")`);
        lines.push(`                .method("${method}", HttpRequest.BodyPublishers.ofString(payload))`);
        lines.push(`                .build();`);
        lines.push(``);
        lines.push(`            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`);
        lines.push(`            System.out.println("Status: " + response.statusCode());`);
        lines.push(`            System.out.println("Response: " + response.body());`);
    } else if (isSubscribeOperation(operation)) {
        lines.push(`            // Long-polling loop for event subscription`);
        lines.push(`            while (true) {`);
        lines.push(`                try {`);
        lines.push(`                    HttpRequest request = HttpRequest.newBuilder()`);
        lines.push(`                        .uri(URI.create(url))`);
        lines.push(`                        .GET()`);
        lines.push(`                        .build();`);
        lines.push(``);
        lines.push(`                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`);
        lines.push(`                    System.out.println("Event received: " + response.body());`);
        lines.push(`                } catch (Exception e) {`);
        lines.push(`                    System.err.println("Polling error: " + e.getMessage());`);
        lines.push(`                    Thread.sleep(1000); // Wait before retrying`);
        lines.push(`                }`);
        lines.push(`            }`);
    } else {
        // Read operations
        lines.push(`            HttpRequest request = HttpRequest.newBuilder()`);
        lines.push(`                .uri(URI.create(url))`);
        lines.push(`                .method("${method}", HttpRequest.BodyPublishers.noBody())`);
        lines.push(`                .build();`);
        lines.push(``);
        lines.push(`            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`);
        lines.push(`            System.out.println("Status: " + response.statusCode());`);
        lines.push(`            System.out.println("Response: " + response.body());`);
    }

    lines.push(`        } catch (Exception e) {`);
    lines.push(`            e.printStackTrace();`);
    lines.push(`        }`);
    lines.push(`    }`);
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
