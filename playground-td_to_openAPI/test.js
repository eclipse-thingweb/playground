const fs = require("fs")
const toOAP = require("./index.js")

const td = {
    "@context": [
        "https://www.w3.org/2019/wot/td/v1",
        { "cov" : "http://www.example.org/coap-binding#" },
        { "@language" : "en" }
    ],
    "id":"urn:dev:home:coff:type123-SNR123456",
    "name": "MyCoffeeMaker",
    "@type": "Thing",
    "title": "MyCoffeeMaker-Home",
    "description": "Order your coffee remotely!",
    "securityDefinitions": {
        "basic_sc": {"scheme": "basic", "in":"header" },
        "psk_sc" : { "scheme":"psk" },
        "nosec_sc" : { "scheme":"nosec" }
    },
    "security": ["nosec_sc"],
    "properties": {
        "status" : {
            "type" : "string",
            "enum" : ["Standby", "Grinding", "Brewing", "Filling","Error"],
            "readOnly" : true,
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/status",
                "op" : "readproperty",
                "contentType" : "application/json"
                }]
        },
        "fillstates" : {
            "type" : "object",
            "properties" : {
                "water" : {
                    "type":"number",
                    "minimum": 0,
                    "maximum": 100
                    },
                "coffeebeans" : {
                    "type":"number",
                    "minimum": 0,
                    "maximum": 100
                    },
                "bin" : {
                    "type":"number",
                    "minimum": 0,
                    "maximum": 100
                    }
            },
            "readOnly" : true,
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/fillstates",
                "op" : "readproperty",
                "contentType" : "application/json"
                }]
        }
    },
    "actions": {
        "brewCoffee" : {
            "input" : {
                "type" : "string",
                "enum" : ["Espresso", "EspressoDoppio", "Coffee","HotWater"]
            },
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/brewcoffee",
                "op" : "invokeaction",
                "contentType" : "application/json"
                }],
            "safe" : false,
            "idempotent" : false
        },
        "stopBrewing" : {
            "forms" : [{
                "href" : "coap://mycoffeemaker.example.com/stopbrewing",
                "cov:methodName" : "GET",
                "op" : "invokeaction",
                "contentType" : "application/json"
                }],
            "safe" : false,
            "idempotent" : false
        },
        "switchOff" : {
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/switchoff",
                "op" : "invokeaction",
                "contentType" : "application/json"
                }],
            "safe" : false,
            "idempotent" : false
        }
    },
    "events": {
        "waterEmpty" : {
            "description" : "The water fillstate is below a certain level!",
            "data" : {
                "type":"number",
                "minimum": 0,
                "maximum": 100
                },
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/waterempty",
                "op" : "subscribeevent",
                "contentType" : "application/json",
                "subprotocol": "longpoll"
            }]
        },
        "coffeeEmpty" : {
            "description" : "The coffee bean fillstate is below a certain amount!",
            "data" : {
                "type":"number",
                "minimum": 0,
                "maximum": 100
                },
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/coffeeempty",
                "op" : "subscribeevent",
                "contentType" : "application/json",
                "subprotocol": "longpoll"
            }]
        },
        "binFull" : {
            "description" : "The bin  fillstate is above a certain level!",
            "data" : {
                "type":"number",
                "minimum": 0,
                "maximum": 100
                },
            "forms" : [{
                "href" : "http://mycoffeemaker.example.com/binfull",
                "op" : "subscribeevent",
                "contentType" : "application/json",
                "subprotocol": "longpoll"
            }]
        }
    }
}

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

toOAP(td).then( apiSpec => {
    const filename = td.title === undefined ? "untitled" : td.title
    fs.writeFileSync("./out/1.json", JSON.stringify(apiSpec.json, undefined, 2))
    fs.writeFileSync("./out/1.yaml", apiSpec.yaml)

    console.log(JSON.stringify(apiSpec.json, undefined, 4))
    console.log("VALID")
}, err => {
    console.error(err)
})