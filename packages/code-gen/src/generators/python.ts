import { Op } from "../types.js";
import { CodeGenerator, getHttpMethod, isStreamingOperation, operationHasPayload, parseModbusInfo } from "./helpers.js";

// ---------------------------------------------------------------------------
// requests  –  Python HTTP library
// ---------------------------------------------------------------------------

function pythonMethodCall(method: string): string {
    return method.toLowerCase();
}

export const generateRequestsCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const method = getHttpMethod(operation, form);
    const hasPayload = operationHasPayload(operation);
    const streaming = isStreamingOperation(operation);

    const payloadArg = hasPayload ? `, json=payload` : "";
    const payloadDef = hasPayload ? `\n# TODO: Replace with the actual value to send\npayload = {}\n` : "";
    const streamArg = streaming ? `, stream=True` : "";

    const responseHandling = streaming
        ? [
              ``,
              `# Streaming response – read lines as they arrive`,
              `for line in response.iter_lines():`,
              `    if line:`,
              `        print(f"${affordanceKey}: {line.decode()}")`,
          ].join("\n")
        : [`print(f"Status: {response.status_code}")`, `print(f"${affordanceKey}: {response.json()}")`].join("\n");

    return `import requests

# Auto-generated code using the requests library
# Operation: ${operation} on "${affordanceKey}"
${payloadDef}
url = "${form.href}"

response = requests.${pythonMethodCall(
        method
    )}(url, headers={"Content-Type": "application/json"}${payloadArg}${streamArg})
response.raise_for_status()

${responseHandling}
`;
};

// ---------------------------------------------------------------------------
// wotpy  –  Python WoT Scripting API
// ---------------------------------------------------------------------------

function getWotPyOperation(operation: Op, affordanceKey: string): string {
    switch (operation) {
        case "readproperty":
            return [
                `value = await thing.read_property("${affordanceKey}")`,
                `print(f"${affordanceKey}: {value}")`,
            ].join("\n    ");
        case "writeproperty":
            return [
                `# TODO: Replace with the actual value to write`,
                `value = {}`,
                `await thing.write_property("${affordanceKey}", value)`,
                `print("${affordanceKey} written successfully")`,
            ].join("\n    ");
        case "observeproperty":
            return [
                `def on_next(item):`,
                `        print(f"${affordanceKey} changed: {item.value}")`,
                ``,
                `    thing.properties["${affordanceKey}"].subscribe(on_next)`,
                `    print("Observing ${affordanceKey}...")`,
                `    # Keep the script running to receive updates`,
                `    await asyncio.sleep(3600)`,
            ].join("\n    ");
        case "invokeaction":
            return [
                `# TODO: Replace with the actual input if required`,
                `input_value = None`,
                `result = await thing.invoke_action("${affordanceKey}", input_value)`,
                `print(f"${affordanceKey} result: {result}")`,
            ].join("\n    ");
        case "subscribeevent":
            return [
                `def on_next(item):`,
                `        print(f"${affordanceKey} event: {item.data}")`,
                ``,
                `    thing.events["${affordanceKey}"].subscribe(on_next)`,
                `    print("Subscribed to ${affordanceKey}...")`,
                `    await asyncio.sleep(3600)`,
            ].join("\n    ");
        default:
            return `# TODO: Implement ${operation} for "${affordanceKey}"`;
    }
}

export const generateWotPyCode: CodeGenerator = (ctx) => {
    const { td, affordanceKey, operation } = ctx;
    const operationCode = getWotPyOperation(operation, affordanceKey);

    return `import asyncio
import json
from wotpy.wot.servient import Servient

# Auto-generated code using wotpy
# Operation: ${operation} on "${affordanceKey}"

td = json.loads('''${JSON.stringify(td, null, 4)}''')

async def main():
    servient = Servient()
    wot = await servient.start()
    thing = await wot.consume(td)

    ${operationCode}

    await servient.shutdown()

asyncio.run(main())
`;
};

// ---------------------------------------------------------------------------
// PyModbus  –  Python Modbus client
// ---------------------------------------------------------------------------

function getPyModbusCall(modbusFunction: string, address: number, quantity: number, unitId: number): string {
    switch (modbusFunction) {
        case "readCoil":
            return `client.read_coils(${address}, ${quantity}, slave=${unitId})`;
        case "readDiscreteInput":
            return `client.read_discrete_inputs(${address}, ${quantity}, slave=${unitId})`;
        case "readHoldingRegister":
        case "readHoldingRegisters":
            return `client.read_holding_registers(${address}, ${quantity}, slave=${unitId})`;
        case "readInputRegister":
        case "readInputRegisters":
            return `client.read_input_registers(${address}, ${quantity}, slave=${unitId})`;
        case "writeCoil":
        case "writeSingleCoil":
            return `client.write_coil(${address}, value, slave=${unitId})`;
        case "writeRegister":
        case "writeSingleRegister":
            return `client.write_register(${address}, value, slave=${unitId})`;
        case "writeMultipleCoils":
            return `client.write_coils(${address}, values, slave=${unitId})`;
        case "writeMultipleRegisters":
            return `client.write_registers(${address}, values, slave=${unitId})`;
        default:
            return `client.read_coils(${address}, ${quantity}, slave=${unitId})`;
    }
}

export const generatePyModbusCode: CodeGenerator = (ctx) => {
    const { affordanceKey, operation, form } = ctx;
    const info = parseModbusInfo(form);
    const isWrite = operationHasPayload(operation);
    const call = getPyModbusCall(info.modbusFunction, info.address, info.quantity, info.unitId);

    const valueLine = isWrite ? `\n# TODO: Replace with the actual value(s) to write\nvalue = True\n` : "";
    const resultAttr = isWrite ? "" : info.modbusFunction.includes("Register") ? ".registers" : ".bits";

    return `from pymodbus.client import ModbusTcpClient

# Auto-generated code using PyModbus
# Operation: ${operation} on "${affordanceKey}"

client = ModbusTcpClient("${info.host}", port=${info.port})
client.connect()
${valueLine}
result = ${call}
print(f"${affordanceKey}: {result${resultAttr}}")

client.close()
`;
};
