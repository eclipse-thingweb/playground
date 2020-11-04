const fs = require("fs")
const addDefaults = require("../index.js")
const td = require("./td.json")


addDefaults(td).then( extendedTd => {
    fs.writeFileSync("./examples/openapi.json", JSON.stringify(extendedTd, undefined, 4))

    console.log("updated example")
}, err => {
    console.error(err)
})
