/**
 * @file Calls the core validation with an hardcoded TD string as input
 * 		 to check whether the validation throws an error and allow manual
 * 		 checking of the result
 */const tdValidator = require("../index")

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

test("normal report generation", () => {
	expect.assertions(1)

	return tdValidator(simpleTD, ()=>{}, {})
	.then( result => {
		const refResult = {
			report: {
				json: 'passed',
				schema: 'passed',
				defaults: 'warning',
				jsonld: 'passed',
				additional: 'passed'
			},
			details: {
				enumConst: 'passed',
				propItems: 'passed',
				security: 'passed',
				propUniqueness: 'passed',
				multiLangConsistency: 'passed',
				linksRelTypeCount: 'passed',
				readWriteOnly: 'passed'
			},
			detailComments: {
				enumConst: expect.any(String),
				propItems: expect.any(String),
				security: expect.any(String),
				propUniqueness: expect.any(String),
				multiLangConsistency: expect.any(String),
				linksRelTypeCount: expect.any(String),
				readWriteOnly: expect.any(String)
			}
		}
		expect(result).toEqual(refResult)
	}, err => {
		console.error(err)
	})
})
