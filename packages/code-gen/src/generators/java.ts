import { Op } from "../types.js";
import { CodeGenerator, getHttpMethod, operationHasPayload, parseModbusInfo } from "./helpers.js";

// ---------------------------------------------------------------------------
// java.net.http.HttpClient  –  Java built-in HTTP client (Java 11+)
// ---------------------------------------------------------------------------

export const generateJavaHttpClientCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);

    const payloadDecl = hasPayload
        ? `\n            // TODO: Replace with the actual value to send\n            String payload = "{}";`
        : "";

    const bodyPublisher = hasPayload
        ? `HttpRequest.BodyPublishers.ofString(payload)`
        : `HttpRequest.BodyPublishers.noBody()`;

    const methodCall =
        method === "GET" ? `.GET()` : method === "DELETE" ? `.DELETE()` : `.method("${method}", ${bodyPublisher})`;

    return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

// Auto-generated code using the java.net.http.HttpClient library
// Operation: ${operation} on "${affordanceKey}"

public class Main {
    public static void main(String[] args) {
        try {
            HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

            String url = "${form.href}";
${payloadDecl}

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                ${methodCall}
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("Status: " + response.statusCode());
            System.out.println("${affordanceKey}: " + response.body());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;
};

// ---------------------------------------------------------------------------
// wot-servient  –  Eclipse Thingweb Java WoT implementation
// ---------------------------------------------------------------------------

function getWotServientOperation(operation: Op, affordanceKey: string): string {
    switch (operation) {
        case "readproperty":
            return [
                `Object value = thing.readProperty("${affordanceKey}").get();`,
                `System.out.println("${affordanceKey}: " + value);`,
            ].join("\n            ");
        case "writeproperty":
            return [
                `// TODO: Replace with the actual value to write`,
                `Object value = new Object();`,
                `thing.writeProperty("${affordanceKey}", value).get();`,
                `System.out.println("${affordanceKey} written successfully");`,
            ].join("\n            ");
        case "observeproperty":
            return [
                `thing.observeProperty("${affordanceKey}").subscribe(`,
                `    next -> System.out.println("${affordanceKey} changed: " + next),`,
                `    error -> System.err.println("Error: " + error)`,
                `);`,
                `System.out.println("Observing ${affordanceKey}...");`,
                `Thread.sleep(Long.MAX_VALUE); // Keep running`,
            ].join("\n            ");
        case "invokeaction":
            return [
                `// TODO: Replace with the actual input if required`,
                `Object input = null;`,
                `Object result = thing.invokeAction("${affordanceKey}", input).get();`,
                `System.out.println("${affordanceKey} result: " + result);`,
            ].join("\n            ");
        case "subscribeevent":
            return [
                `thing.subscribeEvent("${affordanceKey}").subscribe(`,
                `    next -> System.out.println("${affordanceKey} event: " + next),`,
                `    error -> System.err.println("Error: " + error)`,
                `);`,
                `System.out.println("Subscribed to ${affordanceKey}...");`,
                `Thread.sleep(Long.MAX_VALUE); // Keep running`,
            ].join("\n            ");
        default:
            return `// TODO: Implement ${operation} for "${affordanceKey}"`;
    }
}

export const generateWotServientCode: CodeGenerator = (ctx) => {
    const { td, affordanceKey, operation } = ctx;

    return `import city.sane.wot.DefaultWot;
import city.sane.wot.Wot;
import city.sane.wot.thing.ConsumedThing;

// Auto-generated code using wot-servient
// Operation: ${operation} on "${affordanceKey}"

public class Main {
    public static void main(String[] args) {
        try {
            Wot wot = DefaultWot.clientOnly();

            String tdJson = ${JSON.stringify(JSON.stringify(td))};

            ConsumedThing thing = wot.consume(tdJson).get();

            ${getWotServientOperation(operation, affordanceKey)}

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;
};

// ---------------------------------------------------------------------------
// digitalpetri/modbus  –  Java Modbus TCP client
// ---------------------------------------------------------------------------

function getDigitalpetriCall(modbusFunction: string, address: number, quantity: number): string {
    switch (modbusFunction) {
        case "readCoil":
            return [
                `ReadCoilsResponse response = master.sendRequest(`,
                `    new ReadCoilsRequest(${address}, ${quantity}), unitId).get();`,
                `System.out.println("${modbusFunction}: " + response.getCoilStatus());`,
            ].join("\n            ");
        case "readDiscreteInput":
            return [
                `ReadDiscreteInputsResponse response = master.sendRequest(`,
                `    new ReadDiscreteInputsRequest(${address}, ${quantity}), unitId).get();`,
                `System.out.println("${modbusFunction}: " + response.getInputStatus());`,
            ].join("\n            ");
        case "readHoldingRegister":
        case "readHoldingRegisters":
            return [
                `ReadHoldingRegistersResponse response = master.sendRequest(`,
                `    new ReadHoldingRegistersRequest(${address}, ${quantity}), unitId).get();`,
                `System.out.println("${modbusFunction}: " + response.getRegisters());`,
            ].join("\n            ");
        case "readInputRegister":
        case "readInputRegisters":
            return [
                `ReadInputRegistersResponse response = master.sendRequest(`,
                `    new ReadInputRegistersRequest(${address}, ${quantity}), unitId).get();`,
                `System.out.println("${modbusFunction}: " + response.getRegisters());`,
            ].join("\n            ");
        case "writeCoil":
        case "writeSingleCoil":
            return [
                `// TODO: Replace with the actual value to write`,
                `boolean value = true;`,
                `WriteSingleCoilResponse response = master.sendRequest(`,
                `    new WriteSingleCoilRequest(${address}, value), unitId).get();`,
            ].join("\n            ");
        case "writeRegister":
        case "writeSingleRegister":
            return [
                `// TODO: Replace with the actual value to write`,
                `int value = 0;`,
                `WriteSingleRegisterResponse response = master.sendRequest(`,
                `    new WriteSingleRegisterRequest(${address}, value), unitId).get();`,
            ].join("\n            ");
        default:
            return [
                `ReadCoilsResponse response = master.sendRequest(`,
                `    new ReadCoilsRequest(${address}, ${quantity}), unitId).get();`,
                `System.out.println("${modbusFunction}: " + response.getCoilStatus());`,
            ].join("\n            ");
    }
}

export const generateDigitalpetriModbusCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const info = parseModbusInfo(form);
    const call = getDigitalpetriCall(info.modbusFunction, info.address, info.quantity);

    return `import com.digitalpetri.modbus.master.ModbusTcpMaster;
import com.digitalpetri.modbus.master.ModbusTcpMasterConfig;
import com.digitalpetri.modbus.requests.*;
import com.digitalpetri.modbus.responses.*;

// Auto-generated code using digitalpetri/modbus
// Operation: ${operation} on "${affordanceKey}"

public class Main {
    public static void main(String[] args) {
        try {
            ModbusTcpMasterConfig config = new ModbusTcpMasterConfig.Builder("${info.host}")
                .setPort(${info.port})
                .build();
            ModbusTcpMaster master = new ModbusTcpMaster(config);
            master.connect();

            int unitId = ${info.unitId};

            ${call}

            master.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;
};
