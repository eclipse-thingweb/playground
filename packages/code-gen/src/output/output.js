import { Servient } from "@node-wot/core";
import { ModbusClientFactory } from "@node-wot/binding-modbus";

// Auto-generated code using node-wot
// Operation: readproperty on "limitSwitch1"

async function main() {
    const td = {
        "@context": [
            "https://www.w3.org/2022/wot/td/v1.1",
            {
                "modbus": "https://www.example.com/ns/modbustcp"
            }
        ],
        "@type": "Thing",
        "title": "ModbusPLC",
        "description": "TD for a ModbusPLC",
        "id": "uri:dev:ModbusTCPThing",
        "securityDefinitions": {
            "nosec_sc": {
                "scheme": "nosec"
            }
        },
        "security": "nosec_sc",
        "properties": {
            "limitSwitch1": {
                "title": "downLimitSwitch",
                "type": "boolean",
                "description": "Limit switch moving downwards",
                "forms": [
                    {
                        "href": "modbus+tcp://127.0.0.1:60000/1/1",
                        "op": [
                            "readproperty"
                        ],
                        "modbus:function": "readCoil"
                    },
                    {
                        "href": "modbus+tcp://127.0.0.1:60000/1/1",
                        "op": [
                            "writeproperty"
                        ],
                        "modbus:function": "writeCoil"
                    }
                ]
            }
        }
    }

    const servient = new Servient();
    servient.addClientFactory(new ModbusClientFactory());

    const wotHelper = await servient.start();
    const thing = await wotHelper.consume(td);

    const result = await thing.readProperty("limitSwitch1");
    const value = await result.value();
    console.log("limitSwitch1:", value);

    // await servient.shutdown();
}

main();