// Test utility to test index.js
const tdValidator = require("./index")
const fs = require("fs")

const simpleTD = JSON.stringify({
	"id": "urn:simple",
	"@context": "https://www.w3.org/2019/wot/td/v1",
	"title": "MyLampThing",
	"description": "Valid TD copied from the spec's first example",
	"securityDefinitions": {
		"basic_sc": {
			"scheme": "basic",
			"in": "header"
		}
	},
	"security": [
		"basic_sc"
	],
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
			"data": {
				"type": "string"
			},
			"forms": [
				{
					"href": "https://mylamp.example.com/oh",
					"subprotocol": "longpoll"
				}
			]
		}
	}
})
const tdSchema = fs.readFileSync("./td-schema.json","utf-8")
const tdSchemaFull = fs.readFileSync("./td-schema-full.json", "utf-8")

tdValidator(simpleTD, tdSchema, tdSchemaFull)
.then( result => {
	console.log("OKAY")
	console.log(result)
}, err => {
	console.log("ERROR")
	console.error(err)
})

