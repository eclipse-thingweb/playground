/** ========================================================================
 *                           Includes and Globals
 *========================================================================**/
// JSON to CSV and vice versa libraries
const Json2CsvParser = require('json2csv').Parser
const csvjson = require('csvjson')
const { readFileSync, writeFileSync } = require('fs')
const path = require("path")
// const assert = require('node:assert').strict

const csvGenerator = new Json2CsvParser({fields: ["ID", "Status", "Assertion", "Comment"]})
const mainPath = path.join("assertions-csv")
const assertionsPath = path.join("assertions-csv", "assertions.csv")
const preImplementedPath = path.join("assertions-csv", "manual-generation-inputs", "pre-implemented.csv")

/** ========================================================================
 *                           Read and Parse CSV
 *========================================================================**/

const assertionsTableCSV = readFileSync(assertionsPath, {encoding: "utf-8"})
const preImplementedPathCSV = readFileSync(preImplementedPath, {encoding: "utf-8"})

const csvParserOptions = {
    delimiter: ',', // optional
    quote: '"' // optional
}

const assertionsTable = csvjson.toObject(assertionsTableCSV, csvParserOptions)
const preImplementedTable = csvjson.toObject(preImplementedPathCSV, csvParserOptions)

/** ========================================================================
 *                   Determine and Remove Old Assertions
 *========================================================================**/

 const oldAssertionsTable = []
 let index = 0
 let iterations = preImplementedTable.length
 for(let iteration = 0; iteration < iterations; iteration++) {
    const isNotFound = assertionsTable.findIndex(assertion => {return preImplementedTable[index].ID === assertion.ID}) === -1
    if(isNotFound) {
       oldAssertionsTable.push({"ID": preImplementedTable[index].ID, "Assertion": preImplementedTable[index].Assertion})
       preImplementedTable.splice(index, 1)
    } else {
        index++
    }
}

/** ========================================================================
 *                           Determine Manual CSV
 *========================================================================**/
const manualTable = []
const needsReviewTable = []

/* ================== Add old manual assertions ================= */
const manualFlag = "not testable with Assertion Tester"
index = 0
iterations = preImplementedTable.length
for(let iteration = 0; iteration < iterations; iteration++) {
    if(preImplementedTable[index].Comment === manualFlag) {
        manualTable.push({"ID": preImplementedTable[index].ID, "Status": "null", "Assertion": preImplementedTable[index].Assertion})
        preImplementedTable.splice(index, 1)
    } else {
        preImplementedTable[index].Status = "null"
        preImplementedTable[index].Comment = null
        index++
    }
}
/* ================== Add new manual assertions ================= */
for(const assertion of assertionsTable) {
    const isNotFound = preImplementedTable.findIndex(implementedAssertion => {return implementedAssertion.ID === assertion.ID}) === -1
    const manualIsNotFound = manualTable.findIndex(manualAssertion => {return manualAssertion.ID === assertion.ID}) === -1
    if(isNotFound && manualIsNotFound) {
        manualTable.push({"ID": assertion.ID, "Status": "null", "Assertion": assertion.Assertion, "Comment": ""})
        needsReviewTable.push({"ID": assertion.ID, "Status": "null", "Assertion": assertion.Assertion, "Comment": ""})
    }
}


/** ========================================================================
 *                           Sanity Check
 *========================================================================**/

const assertionsSize = assertionsTable.length
const implementedSize = preImplementedTable.length
const manualSize = manualTable.length
const oldSize = oldAssertionsTable.length
const needsReviewSize = needsReviewTable.length

// expectedSize = implementedSize + manualSize + oldSize

// assert.deepEqual(expectedSize, assertionsSize)

/** ========================================================================
 *                           Output CSVs
 *========================================================================**/
console.log("Generating implemented.csv")
writeFileSync(path.join(mainPath, "implemented.csv"), csvGenerator.parse(preImplementedTable))

console.log("Generating manual.csv")
writeFileSync(path.join(mainPath, "manual.csv"), csvGenerator.parse(manualTable))

console.log("Generating needsReview.csv")
writeFileSync(path.join(mainPath, "needsReview.csv"), csvGenerator.parse(needsReviewTable))

console.log("Generating old.csv")
writeFileSync(path.join(mainPath, "old.csv"), csvGenerator.parse(oldAssertionsTable))

console.log("Generating report.json")
const report = {
    generationDate: new Date().toUTCString(),
    assertionsSize,
    implementedSize,
    manualSize,
    oldSize,
    needsReviewSize
}

writeFileSync(path.join(mainPath, "report.json"), JSON.stringify(report))