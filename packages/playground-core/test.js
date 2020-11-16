/**
 * @file Calls the core validation with an hardcoded TD string as input
 * 		 to check whether the validation throws an error and allow manual
 * 		 checking of the result
 */

const tdValidator = require("./index")

const simpleTD = `{
	"id": "urn:simple",
	"@context": "https://www.w3.org/2019/wot/td/v1",
	"title": "MyLampThing",
	"description": "Valid TD copied from the spec's first example",
	"securityDefinitions": {
		"basic_sc": {
			"scheme": "basic",
			"in": "header"
		},
		"basic_scd": {
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
		},
		"toggled": {
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
}`


tdValidator(simpleTD, console.log, {})
.then( result => {
	console.log("OKAY")
	console.log(result)
}, err => {
	console.log("ERROR")
	console.error(err)
})

