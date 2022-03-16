// Test utility to test index.js
const tdValidator = require("../../index").tdValidator
const fs = require("fs")

const tdArray = []
tdArray.push(fs.readFileSync("../tds/valid/simple.json", "utf-8"), fs.readFileSync("../tds/valid/simple.json", "utf-8"))

tdArray.forEach( (element, index) => {
	tdValidator(element, console.log, {})
	.then( result => {
		console.log("OKAY TD Nr.: " + index)
		console.log("Report:")
		Object.keys(result.report).forEach( el => {
			console.log(el, ": ", result.report[el])
		})
		console.log("Details of the \"additional\" checks: ")
		Object.keys(result.details).forEach(el => {
			console.log("    " + el + " " + result.details[el] + " (" + result.detailComments[el] + ")")
		})

	}, err => {
		console.log("ERROR " + index)
		console.error(err)
	})
})
