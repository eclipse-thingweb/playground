// Test utility to test index.js
const tdValidator = require("../../index").tdValidator
const fs = require("fs")

const simpleTD = fs.readFileSync("../tds/valid/simple.json")

/**
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
