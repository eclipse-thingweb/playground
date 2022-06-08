/** ========================================================================
 *                           Includes and Globals
 *========================================================================**/
// JSON to CSV and vice versa libraries
const Json2CsvParser = require('json2csv').Parser
const csvjson = require('csvjson')
const { readFileSync, writeFileSync } = require('fs')
const path = require("path")
// const assert = require('node:assert').strict

const csvGenerator = new Json2CsvParser()
const mainPath = path.join("assertions-csv")
const assertionsPath = path.join("assertions-csv", "template.csv")
const implementedPath = path.join("assertions-csv", "manual-generation-inputs", "pre-implemented.csv")

/** ========================================================================
 *                           Read and Parse CSV
 *========================================================================**/

const assertionsTableCSV = readFileSync(assertionsPath, {encoding: "utf-8"})
const implementedPathCSV = readFileSync(implementedPath, {encoding: "utf-8"})

const csvParserOptions = {
    delimiter: ',', // optional
    quote: '"' // optional
}

const assertionsTable = csvjson.toObject(assertionsTableCSV, csvParserOptions)
const implementedTable = csvjson.toObject(implementedPathCSV, csvParserOptions)
// implementedTable.forEach(a => console.log(a))

/** ========================================================================
 *                   Determine and Remove Old Assertions
 *========================================================================**/

 const oldAssertionsTable = []
 let index = 0
 let iterations = implementedTable.length
 for(let iteration = 0; iteration < iterations; iteration++) {
    const isNotFound = assertionsTable.findIndex(assertion => {return implementedTable[index].ID === assertion.ID}) === -1
    if(isNotFound) {
       oldAssertionsTable.push({"ID": implementedTable[index].ID})
       implementedTable.splice(index, 1)
    } else {
        index++
    }
}

/** ========================================================================
 *                           Determine Manual CSV
 *========================================================================**/
const manualTable = []

/* ================== Add old manual assertions ================= */
const manualFlag = "not testable with Assertion Tester"
index = 0
iterations = implementedTable.length
for(let iteration = 0; iteration < iterations; iteration++) {
    if(implementedTable[index].Comment === manualFlag) {
        manualTable.push({"ID": implementedTable[index].ID, "Status": "null"})
        implementedTable.splice(index, 1)
    } else {
        implementedTable[index].Status = "null"
        implementedTable[index].Comment = null
        index++
    }
}
/* ================== Add new manual assertions ================= */
for(const assertion of assertionsTable) {
    const isNotFound = implementedTable.findIndex(implementedAssertion => {return implementedAssertion.ID === assertion.ID}) === -1
    if(isNotFound) {
        manualTable.push({"ID": assertion.ID, "Status": "null"})
    }
}


/** ========================================================================
 *                           Sanity Check
 *========================================================================**/

const assertionsSize = assertionsTable.length
const implementedSize = implementedTable.length
const manualSize = manualTable.length
const oldSize = oldAssertionsTable.length

// expectedSize = implementedSize + manualSize + oldSize

// assert.deepEqual(expectedSize, assertionsSize)

/** ========================================================================
 *                           Output CSVs
 *========================================================================**/
console.log("Generating implemented.csv")
writeFileSync(path.join(mainPath, "implemented.csv"), csvGenerator.parse(implementedTable))

console.log("Generating manual.csv")
writeFileSync(path.join(mainPath, "manual.csv"), csvGenerator.parse(manualTable))

console.log("Generating old.csv")
writeFileSync(path.join(mainPath, "old.csv"), csvGenerator.parse(oldAssertionsTable))

console.log("Generating report.json")
const report = {
    generationDate: new Date().toUTCString(),
    assertionsSize,
    implementedSize,
    manualSize,
    oldSize
}

writeFileSync(path.join(mainPath, "report.json"), JSON.stringify(report))