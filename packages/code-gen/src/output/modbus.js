import ModbusRTU from "modbus-serial";

// Auto-generated code using modbus-serial
// Operation: subscribeevent on "overheating"

async function main() {
    const client = new ModbusRTU();

    // Connect to the Modbus device
    await client.connectTCP("mylamp.example.com", { port: 502 });
    client.setID(1);

    // Operation "subscribeevent" is not directly mappable to a Modbus function
    // Manual implementation required

    client.close();
}

main();