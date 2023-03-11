// Test utility to test index.js
const tdValidator = require("../../index").tdValidator
const fs = require("fs")

const data = fs.readFileSync("../../../../examples/td/1-simple-default/basic-td.td.jsonld")
const simpleTD = data.toString()

console.log(simpleTD)

/*
 * No logging and no additional checks
 */

tdValidator(simpleTD, ()=>{}, {checkDefaults: false, checkJsonLd: false})
.then( result => {
	console.log("OKAY")
	console.log(result)
}, err => {
	console.log("ERROR")
	console.error(err)
})