// Test utility to test index.js
const tdValidator = require("../../index").tdValidator
const fs = require('fs')

// Function to get current filenames in directory

const fileNames = fs.readdirSync("../../../../examples/td/1-simple-default/")

fileNames.forEach(file => {
	const data = fs.readFileSync("../../../../examples/td/1-simple-default/"+file)
	const TD = data.toString()
	tdValidator(TD, ()=>{}, {checkDefaults: false, checkJsonLd: false})
	.then( result => {
		console.log("File: ", file)
		console.log("OKAY")
		console.log(result)
		console.log("________________")
	}, err => {
		console.log("ERROR")
		console.error(err)
	})
})
















// // Test utility to test index.js
// const tdValidator = require("../../index").tdValidator
// const fs = require("fs")
// const commander = require('commander')

// const data = fs.readFileSync("../../../../examples/td/1-simple-default/basic-td.td.jsonld")
// const simpleTD = data.toString()

// /*
//  * No logging and no additional checks
//  */

// tdValidator(simpleTD, ()=>{}, {checkDefaults: false, checkJsonLd: false})
// .then( result => {
// 	console.log("OKAY")
// 	console.log(result)
// }, err => {
// 	console.log("ERROR")
// 	console.error(err)
// })