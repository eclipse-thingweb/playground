// Test utility to test index.js
const tdValidator = require("../../index").tdValidator
const fs = require("fs")

const data = fs.readFileSync("../tds/valid/simple.json")
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
