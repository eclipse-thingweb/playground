/* *******************************************************************************
 * Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/

// Test utility to test index.js
const tdAsserter = require("./index")
const myTest = require("./index").test
const fs = require("fs")

let simpleTD = JSON.stringify({
	"id": "urn:simple",
	"@context": "https://www.w3.org/2019/wot/td/v1",
	"title": "MyLampThing",
	"description": "Valid TD copied from the specs first example",
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
simpleTD = Buffer.from(simpleTD, 'utf8')
// fs.writeFileSync("./simpleTD.json",simpleTD,"utf8")
// simpleTD = fs.readFileSync("./simpleTD.json")
// const tdSchema = fs.readFileSync("td-schema.json","utf-8")
// const tdSchemaFull = fs.readFileSync("td-schema-full.json", "utf-8")
function fileLoad(loc) {
	return new Promise( (res, rej) => {
		fs.readFile(loc, "utf8", (err, data) => {
			if (err) {rej(err)}
			else {res(data)}
		})
	})
}

tdAsserter([simpleTD], fileLoad)
.then( result => {
	console.log("OKAY")
	console.log(result.length)
}, err => {
	console.log("ERROR")
	console.error(err)
})

