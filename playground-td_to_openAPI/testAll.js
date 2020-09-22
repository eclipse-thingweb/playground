const fs = require("fs")
const toOAP = require("./index.js")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

const directory = "../playground-core/examples/tds/valid/"
const filenames = fs.readdirSync(directory)
const all = filenames.length
let valid = 0
let fail = 0

filenames.forEach( filename => {
    const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"))

    toOAP(td).then( apiSpec => {
        fs.writeFileSync("./out/" + filename.slice(0, -5) + "_openapi.json", JSON.stringify(apiSpec.json, undefined, 2))
        // console.log(JSON.stringify(apiSpec, undefined, 4))
        // console.log("VALID")
        valid++;
        console.log("valid: " + valid + "/" + (fail + valid) + " (total: " + all + ")")
    }, err => {
        fail++;
        console.error("Problem in " + filename)
        console.error(err.message)
    })
})
