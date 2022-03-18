// Test utility to test index.js
const tdValidator = require("../../index").tdValidator
const fs = require("fs")

const failTD = fs.readFileSync("../tds/invalid/noHref.json", "utf-8")

tdValidator(failTD, console.log, {})
.then( result => {
	console.log("OKAY")
	console.log(result)
}, err => {
	console.log("ERROR")
	console.error(err)
})
