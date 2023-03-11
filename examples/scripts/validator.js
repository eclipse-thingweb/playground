// Test utility to test index.js
const tdValidator = require("../../packages/core/index").tdValidator
const fs = require("fs")

// Function to get current filenames in directory

const fileNames = fs.readdirSync("../td/1-simple-default")

fileNames.forEach(file => {
	const data = fs.readFileSync("../td/1-simple-default/"+file)
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




/** First way **/
/*
console.log("\nCurrent directory filenames:")
filenames.forEach(file => {
	let i  = 0
	console.log(file, ": ")
	const subFiles = fs.readdirSync("../td/"+file)
	console.log(subFiles)
	subFiles.forEach(subFile => {
		console.log("Sub file", ++i,": ",subFile)
		const data = fs.readFileSync("../td/"+file+"/"+subFile)
		const simpleTD = data.toString()
		tdValidator(simpleTD, ()=>{}, {checkDefaults: false, checkJsonLd: false})
		.then( result => {
			console.log("File: ", file, "Sub file: ",subFile)
			console.log("OKAY")
			console.log(result)
            console.log("________________")
		}, err => {
			console.log("ERROR")
			console.error(err)
		})
	})
	console.log("______________________")
})*/

/** second version with for loop **/
/*
for(let i = 0; i < filenames.length; i++){
	console.log(filenames[i])

	const subFiles = fs.readdirSync("../td/"+filenames[i])

	for(let j = 0; j < subFiles.length; j++){
		console.log(subFiles[j])
		const data = fs.readFileSync("../td/"+filenames[i]+"/"+subFiles[j])
		const simpleTD = data.toString()
		tdValidator(simpleTD, ()=>{}, {checkDefaults: false, checkJsonLd: false})
		.then( result => {
			console.log("File: ", filenames[i], "Sub file: ",subFiles[j])
			console.log("OKAY")
			console.log(result)
            console.log("________________")
		}, err => {
			console.log("ERROR")
			console.error(err)
		})
	}
}
*/
