import { Servient } from "@node-wot/core";
import { HttpClientFactory } from "@node-wot/binding-http";

// Auto-generated code using node-wot
// Operation: readproperty on "status"

async function main() {
    const td = {
        "@context": "https://www.w3.org/2022/wot/td/v1.1",
        id: "urn:uuid:9cd44eef-0b3f-4566-94b0-1358af3d86bd",
        "@type": "Thing",
        title: "MyLampThing",
        description: "TD for a Lamp Thing",
        securityDefinitions: {
            basic_sc: {
                scheme: "basic",
                in: "header",
            },
        },
        security: ["basic_sc"],
        properties: {
            status: {
                type: "string",
                forms: [
                    {
                        op: "readproperty",
                        href: "https://mylamp.example.com/status",
                        "htv:methodName": "GET",
                    },
                    {
                        op: "writeproperty",
                        href: "https://mylamp.example.com/status",
                        "htv:methodName": "PUT",
                    },
                ],
            },
        },
        actions: {
            toggle: {
                forms: [
                    {
                        op: "invokeaction",
                        href: "https://mylamp.example.com/toggle",
                        "htv:methodName": "POST",
                    },
                ],
            },
        },
        events: {
            overheating: {
                data: {
                    type: "string",
                },
                forms: [
                    {
                        op: "subscribeevent",
                        href: "https://mylamp.example.com/oh",
                        subprotocol: "longpoll",
                    },
                ],
            },
        },
    };

    const servient = new Servient();
    servient.addClientFactory(new HttpClientFactory());

    const wotHelper = await servient.start();
    const thing = await wotHelper.consume(td);

    const result = await thing.readProperty("status");
    const value = await result.value();
    console.log("status:", value);

    // await servient.shutdown();
}

main();
