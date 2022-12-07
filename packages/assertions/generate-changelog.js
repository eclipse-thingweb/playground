/* eslint-disable max-classes-per-file */
/** ===================================================================================================
 * ?                                ABOUT
 * @author         :  Fady Salama
 * @email          :  fadytawfik11@gmail.com
 * @repo           :  https://github.com/thingweb/thingweb-playground
 * @createdOn      :  02.11.2022
 * @description    :  A script that takes 2 assertion.csv files and generates a difference as changelog
 *===================================================================================================== **/


/** ========================================================================
 *                           Includes and Globals
 *======================================================================== **/
// JSON to CSV and vice versa libraries
const Json2CsvParser = require('json2csv').Parser
const csvjson = require('csvjson')
const {
    readFileSync,
    writeFileSync,
    existsSync,
    fstat
} = require('fs')
const path = require("path")

const CHANGE_TYPES = ["added", "removed", "renamed", "line-change", "description"]

let oldCsvTable; let newCsvTable; let oldCsvPath; let newCsvPath

class Change {
    constructor(assertionID, changeType, additionalParam) {
        this.assertionID = assertionID
        this.changeType = changeType
        this.additionalParam = additionalParam
    }

    toString() {
        switch (this.changeType) {
            case "added":
                return `- \`${this.assertionID}\` was added`
            case "removed":
                return `- \`${this.assertionID}\` was removed`
            case "renamed":
                return `- \`${this.additionalParam}\` was renamed to \`${this.assertionID}\``
            case "line-change":
                return `- \`${this.assertionID}\` was moved from Line` +
                `${this.additionalParam.oldline+1} to ${this.additionalParam.newline+1}`
            case "description":
                return `- \`${this.assertionID}\` -> \`"${this.additionalParam}"\``
        }
    }
}

class Changelog {
    constructor() {
        this.log = {}
        this.logString = ""
    }

    addLog(assertionID, changeType, additionalParam) {
        if(!this.log[changeType]) this.log[changeType] = []
        this.log[changeType].push(new Change(assertionID, changeType, additionalParam))
    }

    getLogMarkDownString() {
        this.logString =
`
# CSV Changelog - ${new Date().toLocaleDateString("en-GB")}

[Old CSV Path](${oldCsvPath})  
[New CSV Path](${newCsvPath})
`
        for(const changeType of CHANGE_TYPES) {
            if(this.log[changeType]) {
                this.logString +=
`

## ${changeType.toUpperCase()}

`
                for(const change of this.log[changeType]) {
                    this.logString += `${change.toString()}\n`
                }
            }
        }
        return this.logString
    }

    printLogToConsole() {
        console.log(this.getLogMarkDownString())
    }

    containsCriticalChange() {
        return false
    }
}

const changeLogs = new Changelog()


/** ========================================================================
 *                           Command line Interface
 *========================================================================**/
const helpMessage =
    `
Usage: node generate-changelog.js <old CSV path> <new CSV path> [output path]

Output path is optional. If not specified, the Markdown will be printed to the terminal instead.

node generate-changelog.js [-h|--help] displays this message.
`

const myArgs = process.argv.slice(2)

if (myArgs.length <= 1 || myArgs.length > 3) { console.log(helpMessage); return -1 }
else {
    oldCsvPath = myArgs[0].trim()
    newCsvPath = myArgs[1].trim()
    outputPath = myArgs[2].trim()

    /* Normalizing paths */
    oldCsvPath = oldCsvPath.split(path.win32.sep)
    if (oldCsvPath.length === 1) { oldCsvPath = oldCsvPath[0].split(path.posix.sep) }
    oldCsvPath = path.join(...oldCsvPath)

    newCsvPath = newCsvPath.split(path.win32.sep)
    if (newCsvPath.length === 1) { newCsvPath = newCsvPath[0].split(path.posix.sep) }
    newCsvPath = path.join(...newCsvPath)

    outputPath = outputPath.split(path.win32.sep)
    if (outputPath.length === 1) { outputPath = outputPath[0].split(path.posix.sep) }
    outputPath = path.join(...outputPath)

    /* Check paths exist*/
    if (!existsSync(oldCsvPath)) throw new Error("Given path for 'oldCsvPath' does not exist")
    if (!existsSync(newCsvPath)) throw new Error("Given path for 'newCsvPath' does not exist")

    /* Check paths are csvs*/
    if (path.extname(oldCsvPath) !== ".csv")
        throw new Error("The path 'oldCsvPath' does not point to a csv file. Make sure that the file has the extension name '.csv'")

    if (path.extname(newCsvPath) !== ".csv")
        throw new Error("The path 'newCsvPath' does not point to a csv file. Make sure that the file has the extension name '.csv'")

    if (path.extname(outputPath) !== ".md")
     outputPath += ".md"

    /** ========================================================================
     *                           Read and Parse CSV
     *========================================================================**/

    const oldCsv = readFileSync(oldCsvPath, {
        encoding: "utf-8"
    })
    const newCsv = readFileSync(newCsvPath, {
        encoding: "utf-8"
    })

    const csvParserOptions = {
        delimiter: ',', // optional
        quote: '"' // optional
    }

    oldCsvTable = csvjson.toObject(oldCsv, csvParserOptions)
    newCsvTable = csvjson.toObject(newCsv, csvParserOptions)

    for(const newAssertion of newCsvTable) {inspectNewAssertion(newAssertion)}
    for(const oldAssertion of oldCsvTable) {inspectOldAssertion(oldAssertion)}

    if(outputPath) {
        writeFileSync(outputPath, changeLogs.getLogMarkDownString())
    } else {
        changeLogs.printLogToConsole()
    }
}

function inspectOldAssertion(oldAssertion) {
    const newAssertionIndex = newCsvTable.findIndex(assertion => {
        return oldAssertion.ID === assertion.ID
    })

    const notFound = (newAssertionIndex === -1)
    if (notFound) changeLogs.addLog(oldAssertion.ID, "removed")
}


function inspectNewAssertion(newAssertion) {
    const oldAssertionIndex = oldCsvTable.findIndex(assertion => {
        return newAssertion.ID === assertion.ID
    })

    const notFound = (oldAssertionIndex === -1)
    if (notFound) {
        const sameDescriptionIndex = oldCsvTable.findIndex(assertion => {
            return newAssertion.Description === assertion.Description
        })

        const sameDescriptionFound = (sameDescriptionIndex !== -1)

        // ! Checking on same description is not reliable for now because of different assertions with same descriptions.
        // ! Code can be used once that issue is solved
        if(false) {
            const sameDescriptionAssertion = oldCsvTable[sameDescriptionIndex]
            changeLogs.addLog(newAssertion.ID, "renamed", sameDescriptionAssertion)
        } else {
            changeLogs.addLog(newAssertion.ID, "added")
        }
    } else {
        // Check if assertion was moved to a new line
        const newAssertionIndex = newCsvTable.findIndex(assertion => {
            return newAssertion.ID === assertion.ID
        })

        if(newAssertionIndex !== oldAssertionIndex)
            changeLogs.addLog(newAssertion.ID, "line-change", {oldline: oldAssertionIndex, newline: newAssertionIndex})

        // Check description changes
        if(newAssertion.Description !== oldCsvTable[oldAssertionIndex].Description){
            // Descriptions are not strictly equal, but maybe the change is only in punctuation
            // Remove punctuation then check again
            const newDes =  newAssertion.Description.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ").trim()
            const oldDesc =  newAssertion.Description.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ").trim()

            // todo  Should we hint at the punctuation changes? Should we fix oldCVS punctuation?
            if(newDes !== oldDesc) {
                changeLogs.addLog(newAssertion.ID, "description", newAssertion.Description)
            }
        }
    }
}