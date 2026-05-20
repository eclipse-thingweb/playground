import { Op, AFFORDANCE_TYPES } from "../types.js";
import {
    CodeGenerator,
    CodeGeneratorContext,
    getHttpMethod,
    getNodeWotBindings,
    isStreamingOperation,
    operationHasPayload,
    parseModbusInfo,
} from "./helpers.js";

// ---------------------------------------------------------------------------
// node-wot  –  WoT Scripting API with protocol-specific binding imports
// ---------------------------------------------------------------------------

function getNodeWotOperation(operation: Op, affordanceKey: string): string {
    switch (operation) {
        case "readproperty":
            return [
                `const result = await thing.readProperty("${affordanceKey}");`,
                `const value = await result.value();`,
                `console.log("${affordanceKey}:", value);`,
            ].join("\n    ");
        case "writeproperty":
            return [
                `// TODO: Replace with the actual value to write`,
                `const value = {};`,
                `await thing.writeProperty("${affordanceKey}", value);`,
                `console.log("${affordanceKey} written successfully");`,
            ].join("\n    ");
        case "observeproperty":
            return [
                `await thing.observeProperty("${affordanceKey}", async (data) => {`,
                `    const value = await data.value();`,
                `    console.log("${affordanceKey} changed:", value);`,
                `});`,
                `console.log("Observing ${affordanceKey}... Press Ctrl+C to stop.");`,
            ].join("\n    ");
        case "invokeaction":
            return [
                `// TODO: Replace with the actual input if required`,
                `const input = undefined;`,
                `const result = await thing.invokeAction("${affordanceKey}", input);`,
                `if (result) {`,
                `    const output = await result.value();`,
                `    console.log("${affordanceKey} result:", output);`,
                `} else {`,
                `    console.log("${affordanceKey} invoked successfully");`,
                `}`,
            ].join("\n    ");
        case "subscribeevent":
            return [
                `await thing.subscribeEvent("${affordanceKey}", async (data) => {`,
                `    const value = await data.value();`,
                `    console.log("${affordanceKey} event:", value);`,
                `});`,
                `console.log("Subscribed to ${affordanceKey}... Press Ctrl+C to stop.");`,
            ].join("\n    ");
        case "unsubscribeevent":
            return `await thing.unsubscribeEvent("${affordanceKey}");`;
        case "unobserveproperty":
            return `// Unobserve is handled by disposing the subscription returned by observeProperty`;
        default:
            return `// TODO: Implement ${operation} for "${affordanceKey}"`;
    }
}

export const generateNodeWotCode: CodeGenerator = (ctx) => {
    const { td, affordanceKey, operation } = ctx;

    // Collect forms from all affordances to determine required protocol bindings
    const allForms = AFFORDANCE_TYPES.flatMap((type) => (td[type] ? Object.values(td[type]) : [])).flatMap(
        (affordance) => affordance.forms
    );
    const bindings = getNodeWotBindings(allForms);

    const imports = [
        `import { Servient } from "@node-wot/core";`,
        ...bindings.map((b) => `import { ${b.factoryName} } from "${b.packageName}";`),
    ].join("\n");

    const factories = bindings.map((b) => `    servient.addClientFactory(new ${b.factoryName}());`).join("\n");

    const operationCode = getNodeWotOperation(operation, affordanceKey);

    return `${imports}

// Auto-generated code using node-wot
// Operation: ${operation} on "${affordanceKey}"

async function main() {
    const td = ${JSON.stringify(td, null, 4).replace(/\n/g, "\n    ")};

    const servient = new Servient();
${factories}

    const wotHelper = await servient.start();
    const thing = await wotHelper.consume(td);

    ${operationCode}
}

main();
`;
};

// ---------------------------------------------------------------------------
// fetch  –  Browser / Node.js Fetch API for HTTP(S)
// ---------------------------------------------------------------------------

export const generateFetchCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);
    const streaming = isStreamingOperation(operation);

    const fetchOptions = [`method: "${method}"`, `headers: { "Content-Type": "application/json" }`];
    if (hasPayload) {
        fetchOptions.push(`body: JSON.stringify(payload)`);
    }

    const payloadLine = hasPayload ? `\n// TODO: Replace with the actual value to send\nconst payload = {};\n` : "";

    const responseHandling = streaming
        ? [
              ``,
              `// Streaming response – read chunks as they arrive`,
              `const reader = response.body.getReader();`,
              `const decoder = new TextDecoder();`,
              `while (true) {`,
              `    const { done, value } = await reader.read();`,
              `    if (done) break;`,
              `    console.log("${affordanceKey}:", decoder.decode(value));`,
              `}`,
          ].join("\n")
        : [`const data = await response.json();`, `console.log("${affordanceKey}:", data);`].join("\n");

    return `// Auto-generated code using the Fetch API
// Operation: ${operation} on "${affordanceKey}"
${payloadLine}
const url = "${form.href}";

const response = await fetch(url, {
    ${fetchOptions.join(",\n    ")},
});

if (!response.ok) {
    throw new Error(\`Request failed: \${response.status} \${response.statusText}\`);
}

${responseHandling}
`;
};

// ---------------------------------------------------------------------------
// webthing  –  Mozilla WebThings REST / WebSocket client
// ---------------------------------------------------------------------------

export const generateWebthingCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;

    if (isStreamingOperation(operation)) {
        const wsUrl = form.href.replace(/^http/, "ws");
        return `// Auto-generated code using WebSocket (webthing)
// Operation: ${operation} on "${affordanceKey}"

const WebSocket = require("ws");

const ws = new WebSocket("${wsUrl}");

ws.on("open", () => {
    console.log("Connected – observing ${affordanceKey}");
});

ws.on("message", (data) => {
    console.log("${affordanceKey}:", JSON.parse(data));
});

ws.on("close", () => {
    console.log("Connection closed");
});
`;
    }

    // Non-streaming operations use HTTP via fetch
    return generateFetchCode(ctx);
};

// ---------------------------------------------------------------------------
// modbus-serial  –  Node.js Modbus RTU / TCP client
// ---------------------------------------------------------------------------

function getModbusSerialCall(modbusFunction: string, address: number, quantity: number): string {
    switch (modbusFunction) {
        case "readCoil":
            return `await client.readCoils(${address}, ${quantity})`;
        case "readDiscreteInput":
            return `await client.readDiscreteInputs(${address}, ${quantity})`;
        case "readHoldingRegister":
        case "readHoldingRegisters":
            return `await client.readHoldingRegisters(${address}, ${quantity})`;
        case "readInputRegister":
        case "readInputRegisters":
            return `await client.readInputRegisters(${address}, ${quantity})`;
        case "writeCoil":
        case "writeSingleCoil":
            return `await client.writeCoil(${address}, value)`;
        case "writeRegister":
        case "writeSingleRegister":
            return `await client.writeRegister(${address}, value)`;
        case "writeMultipleCoils":
            return `await client.writeCoils(${address}, values)`;
        case "writeMultipleRegisters":
            return `await client.writeRegisters(${address}, values)`;
        default:
            return `await client.readCoils(${address}, ${quantity})`;
    }
}

export const generateModbusSerialCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const info = parseModbusInfo(form);
    const isWrite = operationHasPayload(operation);
    const call = getModbusSerialCall(info.modbusFunction, info.address, info.quantity);

    const valueLine = isWrite
        ? `\n    // TODO: Replace with the actual value(s) to write\n    const value = true;\n`
        : "";

    return `const ModbusRTU = require("modbus-serial");

// Auto-generated code using modbus-serial
// Operation: ${operation} on "${affordanceKey}"

async function main() {
    const client = new ModbusRTU();
    await client.connectTCP("${info.host}", { port: ${info.port} });
    client.setID(${info.unitId});
${valueLine}
    const result = ${call};
    console.log("${affordanceKey}:", result${isWrite ? "" : ".data"});

    client.close();
}

main();
`;
};
