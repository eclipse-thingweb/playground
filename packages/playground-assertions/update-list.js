// Update list.json
const fs = require("fs")

fs.readdir("./assertions", (err, assertionNames) => {

	if (err) {throw new Error("could not read assertion file names")}

	const nameAr = []

	assertionNames.forEach( el => {
		nameAr.push(el)
	})

	fs.writeFile("./list.json", JSON.stringify(nameAr),  "utf8", () => {
		console.log("Updated list.json")
	})
})

