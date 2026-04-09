import { AffordanceType, Form, Op, TD } from "../../types.js";

/**
 * Generates a JavaScript code snippet using the modbus-serial library
 * @returns The generated code as a string and the file extension
 */
export function generateModbusSerialCode(
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

    const code = buildModbusSnippet(form, operation, affordanceKey);
    return { code, extension: "js" };
}

function buildModbusSnippet(form: Form, operation: Op, affordanceKey: string): string {
    const href = form.href;

    // Parse host and port from href (e.g., "modbus+tcp://192.168.1.100:502")
    let host = "127.0.0.1";
    let port = 502;
    try {
        const url = new URL(href);
        host = url.hostname;
        port = parseInt(url.port) || 502;
    } catch {
        // Use defaults if href is not a valid URL
    }

    const unitID = form["modv:unitID"] ?? 1;
    const address = form["modv:address"] ?? 0;
    const modbusFunction = form["modv:function"];
    const quantity = form["modv:quantity"] ?? 1;

    const lines: string[] = [];
    const indent = "    ";

    // Import
    lines.push(`import ModbusRTU from "modbus-serial";`);
    lines.push(``);
    lines.push(`// Auto-generated code using modbus-serial`);
    lines.push(`// Operation: ${operation} on "${affordanceKey}"`);
    lines.push(``);
    lines.push(`async function main() {`);

    // Client setup
    lines.push(`${indent}const client = new ModbusRTU();`);
    lines.push(``);
    lines.push(`${indent}// Connect to the Modbus device`);
    lines.push(`${indent}await client.connectTCP("${host}", { port: ${port} });`);
    lines.push(`${indent}client.setID(${unitID});`);
    lines.push(``);

    // Operation-specific code
    if (modbusFunction) {
        // Use the explicit modbus function from the form
        lines.push(
            ...buildModbusFunctionCall(modbusFunction, address, quantity, affordanceKey).map((l) => `${indent}${l}`)
        );
    } else {
        // Infer from the WoT operation type
        lines.push(...inferModbusCall(operation, address, quantity, affordanceKey).map((l) => `${indent}${l}`));
    }

    lines.push(``);
    lines.push(`${indent}client.close();`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`main();`);

    return lines.join("\n");
}

function buildModbusFunctionCall(
    modbusFunction: string,
    address: number,
    quantity: number,
    affordanceKey: string
): string[] {
    const lines: string[] = [];

    switch (modbusFunction) {
        case "readCoils":
            lines.push(`const result = await client.readCoils(${address}, ${quantity});`);
            lines.push(`console.log("${affordanceKey} (coils):", result.data);`);
            break;

        case "readDiscreteInputs":
            lines.push(`const result = await client.readDiscreteInputs(${address}, ${quantity});`);
            lines.push(`console.log("${affordanceKey} (discrete inputs):", result.data);`);
            break;

        case "readHoldingRegisters":
            lines.push(`const result = await client.readHoldingRegisters(${address}, ${quantity});`);
            lines.push(`console.log("${affordanceKey} (holding registers):", result.data);`);
            break;

        case "readInputRegisters":
            lines.push(`const result = await client.readInputRegisters(${address}, ${quantity});`);
            lines.push(`console.log("${affordanceKey} (input registers):", result.data);`);
            break;

        case "writeSingleCoil":
            lines.push(`// TODO: Set the value to write (true/false)`);
            lines.push(`const value = true;`);
            lines.push(`await client.writeCoil(${address}, value);`);
            lines.push(`console.log("Coil written successfully");`);
            break;

        case "writeSingleRegister":
            lines.push(`// TODO: Set the register value to write`);
            lines.push(`const value = 0;`);
            lines.push(`await client.writeRegister(${address}, value);`);
            lines.push(`console.log("Register written successfully");`);
            break;

        case "writeMultipleCoils":
            lines.push(`// TODO: Set the coil values to write`);
            lines.push(`const values = [true, false];`);
            lines.push(`await client.writeCoils(${address}, values);`);
            lines.push(`console.log("Multiple coils written successfully");`);
            break;

        case "writeMultipleRegisters":
            lines.push(`// TODO: Set the register values to write`);
            lines.push(`const values = [0, 0];`);
            lines.push(`await client.writeRegisters(${address}, values);`);
            lines.push(`console.log("Multiple registers written successfully");`);
            break;

        default:
            lines.push(`// Unknown Modbus function: ${modbusFunction}`);
            lines.push(`// Manual implementation required`);
            break;
    }

    return lines;
}

function inferModbusCall(operation: Op, address: number, quantity: number, affordanceKey: string): string[] {
    const lines: string[] = [];

    switch (operation) {
        case "readproperty":
            lines.push(`const result = await client.readHoldingRegisters(${address}, ${quantity});`);
            lines.push(`console.log("${affordanceKey}:", result.data);`);
            break;

        case "writeproperty":
            lines.push(`// TODO: Set the register value to write`);
            lines.push(`const value = 0;`);
            lines.push(`await client.writeRegister(${address}, value);`);
            lines.push(`console.log("Property written successfully");`);
            break;

        case "invokeaction":
            lines.push(`// TODO: Set the coil value for the action`);
            lines.push(`const value = true;`);
            lines.push(`await client.writeCoil(${address}, value);`);
            lines.push(`console.log("Action invoked successfully");`);
            break;

        default:
            lines.push(`// Operation "${operation}" is not directly mappable to a Modbus function`);
            lines.push(`// Manual implementation required`);
            break;
    }

    return lines;
}
