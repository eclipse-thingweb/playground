// Test utility to test index.js
const tdValidator = require("../../index").tdValidator

const simpleTD = JSON.stringify({
    "id": "urn:version",
    "@context":"https://www.w3.org/2022/wot/td/v1.1",
    "title": "MyLampThing",
    "description": "Valid TD demonstrating how to use version with additional fields",
    "securityDefinitions": {
        "basic_sc": {
            "scheme": "basic",
            "in": "header"
        }
    },
    "security": ["basic_sc"],
    "properties": {
        "status": {
            "type": "string",
            "forms": [
                {
                    "href": "https://mylamp.example.com/status"
                }
            ]
        }
    },
    "actions": {
        "toggle": {
            "forms": [
                {
                    "href": "https://mylamp.example.com/toggle"
                }
            ]
        }
    },
    "events": {
        "overheating": {
            "data":{"type": "string"},
            "forms": [
                {
                    "href": "https://mylamp.example.com/oh",
                    "subprotocol": "longpoll"
                }
            ]
        }
    },
    "version": {
        "instance": "1.2.1",
        "xyz:firmware": "0.9.1",
        "xyz:hardware": "1.0"
    }
})

tdValidator(simpleTD, console.log, {})
.then( result => {
	console.log("OKAY")
	console.log(result)
}, err => {
	console.log("ERROR")
	console.error(err)
})
