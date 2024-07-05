/*
 *  Copyright (c) 2023 Contributors to the Eclipse Foundation
 *
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

/**
 * @file The `util.js` contains the core
 * functionality the `@thing-description-playground/web` offers. It takes
 * care of integrating other playground packages
 * and offers a few utility functions.
 */

import { editor } from 'monaco-editor'
import { convertTDJsonToYaml, convertTDYamlToJson, tdValidator, tmValidator, compress, decompress } from '../../../core/dist/web-bundle.min.js'
import tdToOpenAPI from '@thingweb/open-api-converter/dist/web-bundle.min.js'
import tdToAsyncAPI from '@thingweb/async-api-converter/dist/web-bundle.min.js'
import { addDefaults, removeDefaults } from '../../../defaults/dist/web-bundle.min.js'
import { AssetInterfacesDescription } from "@thingweb/aas-aid";
import { validateJsonLdBtn, tmConformanceBtn, sectionHeaders } from './validation'


let errorMessages = []
/**
 * Fetch the TD from the given address and return the JSON object
 * @param {string} urlAddr url of the TD to fetch
 */
export function getTdUrl(urlAddr) {
    return new Promise(resolve => {

        fetch(urlAddr)
            .then(res => res.json())
            .then(data => {
                resolve(data)
            }, err => { alert("JSON could not be fetched from: " + urlAddr + "\n Error: " + err) })

    })
}


/**
 *  Offers a given content for download as a file.
 * @param {string} fileName The title of the csv file
 * @param {string} content The content of the csv file
 * @param {string} type The content-type to output, e.g., text/csv;charset=utf-8;
 */
export function offerFileDownload(fileName, content, type) {

    const blob = new Blob([content], { type });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, fileName);
    } else {
        const link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", fileName)
            link.setAttribute("src", url.slice(5))
            link.style.visibility = "hidden";
            document.body.appendChild(link)
            link.click();
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }
    }

}

/**
 * Generates an TD instance from
 * the TD in the Editor
 * @param {"json"|"yaml"} fileType
 */
export function generateTD(fileType, editorInstance) {
    return new Promise((res, rej) => {
        const tdToValidate = editorInstance.getValue()

        if (tdToValidate === "") {
            rej("No TD given to generate TD instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            try {
                const content = fileType === "json"
                    ? JSON.stringify(JSON.parse(convertTDYamlToJson(tdToValidate)), undefined, 4)
                    : convertTDJsonToYaml(tdToValidate)

                editor.setModelLanguage(editorInstance.getModel(), fileType)
                editorInstance.setValue(content)
            } catch (err) {
                rej("TD generation problem: " + err)
            }
        }
    })
}

/**
 * Generates an OpenAPI instance from
 * the TD in the Editor
 * @param {"json"|"yaml"} fileType
 */
export function generateOAP(fileType, editorInstance) {
    return new Promise((res, rej) => {
        const tdToValidate = fileType === "json"
            ? editorInstance.getValue()
            : convertTDYamlToJson(editorInstance.getValue())

        if (tdToValidate === "") {
            rej("No TD given to generate OpenAPI instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            tdToOpenAPI(JSON.parse(tdToValidate)).then(openAPI => {
                const content = fileType === "json" ? JSON.stringify(openAPI[fileType], undefined, 4) : openAPI[fileType]
                editor.setModelLanguage(window.openApiEditor.getModel(), fileType)
                window.openApiEditor.getModel().setValue(content)
            }, err => { rej("OpenAPI generation problem: " + err) })
        }
    })
}

/**
 * Generates an AsyncAPI instance from
 * the TD in the Editor
 * @param {"json"|"yaml"} fileType
 */
export function generateAAP(fileType, editorInstance) {
    return new Promise((res, rej) => {
        const tdToValidate = fileType === "json"
            ? editorInstance.getValue()
            : convertTDYamlToJson(editorInstance.getValue())

        if (tdToValidate === "") {
            rej("No TD given to generate AsyncAPI instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            tdToAsyncAPI(JSON.parse(tdToValidate)).then(asyncAPI => {
                const content = fileType === "json" ? JSON.stringify(asyncAPI[fileType], undefined, 4) : asyncAPI[fileType]
                editor.setModelLanguage(window.asyncApiEditor.getModel(), fileType)
                window.asyncApiEditor.getModel().setValue(content)
            }, err => { rej("AsyncAPI generation problem: " + err) })
        }
    })
}

/**
 * Generates an AAS instance from a TD in the current editor
 * @param { String } fileType - JSON/YAML options
 * @param { Monaco Object } editorInstance - Monaco editor object
 */
export function generateAAS(fileType, editorInstance) {
    const assetInterfaceDescription = new AssetInterfacesDescription()

    const tdToConvert = fileType === "json"
        ? editorInstance.getValue()
        : convertTDYamlToJson(editorInstance.getValue())

    const AASInstance = assetInterfaceDescription.transformTD2AID(tdToConvert)
    try {
        const content = JSON.stringify(JSON.parse(AASInstance), undefined, 4)

        editor.setModelLanguage(window.AASEditor.getModel(), 'json')
        window.AASEditor.getModel().setValue(content)
    } catch (err) {
        console.error(err);
    }
}

/**
 * applies adding unset default values
 * to the TD in the editor
 */
export function addDefaultsUtil(editorInstance) {
    const tdToExtend = editorInstance["_domElement"].dataset.modeId === "json"
        ? JSON.parse(editorInstance.getValue())
        : JSON.parse(convertTDYamlToJson(editorInstance.getValue()))
    addDefaults(tdToExtend)
    window.defaultsEditor.getModel().setValue(JSON.stringify(tdToExtend, undefined, 4))
    editor.setModelLanguage(window.defaultsEditor.getModel(), editorInstance["_domElement"].dataset.modeId)
    if (editorInstance["_domElement"].dataset.modeId === "yaml") {
        generateTD("yaml", window.defaultsEditor)
    }
}

/**
 * applies removing explicitly given
 * default values from the TD
 * in the editor
 */
export function removeDefaultsUtil(editorInstance) {
    const tdToReduce = editorInstance["_domElement"].dataset.modeId === "json"
        ? JSON.parse(editorInstance.getValue())
        : JSON.parse(convertTDYamlToJson(editorInstance.getValue()))
    removeDefaults(tdToReduce)
    window.defaultsEditor.getModel().setValue(JSON.stringify(tdToReduce, undefined, 4))
    editor.setModelLanguage(window.defaultsEditor.getModel(), editorInstance["_domElement"].dataset.modeId)
    if (editorInstance["_domElement"].dataset.modeId === "yaml") {
        generateTD("yaml", window.defaultsEditor)
    }
}

/**
 * Calls the Validator of the core package and updates the status of the console categories
 * @param {string} body Thing Description/Thing Model to validate
 * @param {string} docType "td" or "tm"
 * @param {*} source "manual" or "auto"
 * *Neutral circle icon gotten from: https://fontawesome.com/icons/circle?f=classic&s=solid
 * *Success circle icon gotten from: https://fontawesome.com/icons/circle-check?f=classic&s=solid
 * *Warning circle icon gotten from: https://fontawesome.com/icons/circle-exclamation?f=classic&s=solid
 * *Error circle icon gotten from: https://fontawesome.com/icons/circle-xmark?f=classic&s=solid
 */
export function validate(thingType, editorContent) {

    resetValidationStatus()

    const checkJsonLd = validateJsonLdBtn.checked
    const checkTmConformance = tmConformanceBtn.checked

    const validator = thingType === "td" ? tdValidator : tmValidator

    validator(editorContent, log, { checkDefaults: true, checkJsonLd, checkTmConformance })
        .then(result => {
            Object.keys(result.report).forEach(el => {
                const spotName = "spot-" + el
                document.getElementById(spotName).removeAttribute('open')
                const resultIcon = document.getElementById(spotName).children[0].children[0].children[0]

                if (result.report[el] === "passed") {
                    resultIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z")
                    resultIcon.classList.remove("neutral-circle-icon")
                    resultIcon.classList.add("success-circle-icon")
                }
                else if (result.report[el] === "warning") {
                    resultIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z")
                    resultIcon.classList.remove("neutral-circle-icon")
                    resultIcon.classList.add("warning-circle-icon")
                }
                else if (result.report[el] === "failed") {
                    resultIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z")
                    resultIcon.classList.remove("neutral-circle-icon")
                    resultIcon.classList.add("error-circle-icon")
                }
                else if (result.report[el] === null) {
                    // do nothing
                }
                else {
                    console.error("unknown report feedback value")
                }
            })

            Object.keys(result.details).forEach(el => {
                const detailsName = el + "-section"
                if (document.getElementById(detailsName)) {
                    document.getElementById(detailsName).removeAttribute('open')
                    const detailsIcon = document.getElementById(detailsName).children[0].children[0].children[0]

                    if (result.details[el] === "passed") {
                        detailsIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z")
                        detailsIcon.classList.remove("neutral-circle-icon")
                        detailsIcon.classList.add("success-circle-icon")
                    }
                    else if (result.details[el] === "warning" || result.details[el] === "not-impl") {
                        detailsIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z")
                        detailsIcon.classList.remove("neutral-circle-icon")
                        detailsIcon.classList.add("warning-circle-icon")
                    }
                    else if (result.details[el] === "failed") {
                        detailsIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z")
                        detailsIcon.classList.remove("neutral-circle-icon")
                        detailsIcon.classList.add("error-circle-icon")
                    }
                    else if (result.details[el] === null) {
                        // do nothing
                    }
                    else {
                        console.error("unknown report feedback value")
                    }
                }
            })

            Object.keys(result.detailComments).forEach(el => {
                const detailsName = el + "-section"

                if (document.querySelector(`#${detailsName} .description`)) {
                    const detailsDesc = document.querySelector(`#${detailsName} .description`)

                    detailsDesc.textContent = result.detailComments[el]
                }
            })

            populateCategory(errorMessages)
        })
}

/**
 * Resets the status of the validation headers, as well as the error message list
 */
export function resetValidationStatus() {
    while (errorMessages.length > 0) {
        errorMessages.pop()
    }

    sectionHeaders.forEach(header => {
        const headerIcon = header.children[0].children[0]

        if(!headerIcon.classList.contains("neutral-circle-icon")){
            headerIcon.children[0].setAttribute("d", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z")
            headerIcon.classList.remove("success-circle-icon", "warning-circle-icon", "error-circle-icon")
            headerIcon.classList.add("neutral-circle-icon")
        }
    })

    document.querySelectorAll("#spot-json, #spot-schema, #spot-defaults, #spot-jsonld, #spot-additional").forEach(category => {
        category.open = false
        category.classList.add("disabled")
        const categoryContainer = category.querySelector("ul.section-content")
        while (categoryContainer.children.length > 0) {
            categoryContainer.children[0].remove()
        }
    })
}

/**
 * Logs the error messages provided by the Validator
 * @param { String } message - text sent from the validator
 */
function log(message) {
    errorMessages.push(message)
}

//TODO: This function should only be used for the moment being as it should be changed or adapted when the corresponding changes to the Validator have been finalized
/**
 * Populates the error messages on the categories where the validation has failed or has a warning
 * @param { Array } messagesList - Array of error messages
 */
function populateCategory(messagesList) {
    // console.log(messagesList);
    document.querySelectorAll("#spot-json, #spot-schema, #spot-defaults, #spot-jsonld, #spot-additional").forEach(category => {
        const categoryContainer = category.querySelector("ul.section-content")
        category.classList.remove("disabled")

        const categoryIcon = category.children[0].children[0].children[0]
        
        if (categoryIcon.classList.contains("error-circle-icon") || categoryIcon.classList.contains("warning-circle-icon")) {
            const noticePrompt = document.createElement("p")
            noticePrompt.textContent = "*This feature is still in the testing phase, and it may not refer to the correct source of the error*"
            noticePrompt.classList.add("notice-prompt")
            categoryContainer.append(noticePrompt)
            messagesList.forEach(message => {
                const listElement = document.createElement("li")
                listElement.textContent = message
                categoryContainer.append(listElement)
            })
        }
        else if (categoryIcon.classList.contains("success-circle-icon")) {
            const successMessage = document.createElement("li")
            successMessage.textContent = "Validated Successfully"
            categoryContainer.append(successMessage)
        }
        else {
            const nullMessage = document.createElement("li")
            nullMessage.textContent = "A previous validation has failed or it is only available for Thing Descriptions"
            categoryContainer.append(nullMessage)
        }
    })
}

/**
 * Save current TD/TM as a compressed string in URL fragment.
 * @param {string} docType "td" or "tm"
 * @param {string} format "json" or "yaml"
 */
export async function save(formatType, thingType, editorContent) {

    const value = JSON.stringify(editorContent)
    if (!value) {
        alert(`No ${thingType.toUpperCase()} provided`);
        return;
    }

    const data = thingType + formatType + value
    const compressed = compress(data)
    return `${window.location.href}#${compressed}`
}

/**
 * Save current TD/TM as a compressed string in URL fragment to be opened with ediTDor.
 * @param {string} docType "td" or "tm"
 * @param {string} format "json" or "yaml"
 */
export async function openEditdor(formatType, thingType, editorInstance) {

    const value = formatType === "yaml" ? convertTDYamlToJson(editorInstance.getValue()) : editorInstance.getValue()
    if (!value) {
        alert(`No ${thingType.toUpperCase()} provided`)
        return;
    }
    const data = thingType + formatType + value
    const compressed = compress(data)
    const URL = `https://eclipse.github.io/editdor/?td=${compressed}`
    window.open(URL, '_blank')
}

/**
 * Given a URL fragment construct current value of an editor.
 */
export function getEditorValue(fragment) {
    const data = decompress(fragment)
    return data || '';
}

// Monaco Location Pointer

/**
 * Finds the location/path of the text in JSON from its Monaco Editor location
 * @param {string} The text/keyword which is searched on the editor
 * @param {ITextModel} The text model of Monaco editor
 */
export function findJSONLocationOfMonacoText(text, textModel) {
    const matches = textModel.findMatches(text, false, false, false, null, false)
    const results = []

    matches.forEach(match => {
        const path = searchPath(textModel, getEndPositionOfMatch(match))
        results.push({ match, path })
    })

    return results
}

const QUOTE = '"'
const LEFT_BRACKET = "{"
const RIGHT_BRACKET = "}"
const SEMICOLON = ":"
const LEFT_SQUARE_BRACKET = "["
const RIGHT_SQUARE_BRACKET = "]"
const COMMA = ","

/**
 * Looks for specific characters on the model to figure out the path of the position/search text
 * @param {ITextModel} textModel The text model of Monaco Editor
 * @param {IPosition} position The position on Monaco editor which consists of column and line number
 * @returns A string that is the path of the searched text. Search is done with the text's position on the editor
 */
function searchPath(textModel, position) {
    let path = '/'
    let parentKey = ''
    const stack = []
    let recordingParent = false
    let isValue = true
    let commaCount = 0

    for (let i = position.lineNumber; i > 0; i--) {
        const currentColumnIndex = (i === position.lineNumber ? position.column : textModel.getLineLength(i)) - 1
        const lineContent = textModel.getLineContent(i)
        for (let j = currentColumnIndex; j >= 0; j--) {
            const currentChar = lineContent[j]

            if (recordingParent) {
                if (currentChar === QUOTE) {
                    if (stack[stack.length - 1] === QUOTE) {
                        stack.pop()
                        path = "/" + parentKey + path
                        parentKey = ""
                        recordingParent = false
                    } else {
                        stack.push(currentChar)
                        continue
                    }
                }

                if (stack[stack.length - 1] === QUOTE) {
                    parentKey = currentChar + parentKey
                    continue
                }
            } else {
                if (currentChar === SEMICOLON) {
                    recordingParent = isValue

                    if (stack.length > 0) {
                        const top = stack[stack.length - 1]

                        if (top === LEFT_SQUARE_BRACKET) {
                            parentKey = "/" + commaCount.toString()
                            stack.pop()
                            recordingParent = true
                        }

                        if (top === LEFT_BRACKET) {
                            stack.pop()
                            recordingParent = true
                        }
                    }
                }

                if (currentChar === LEFT_SQUARE_BRACKET) {
                    isValue = false
                    if (stack.length > 0) {
                        if (stack[stack.length - 1] === RIGHT_SQUARE_BRACKET) {
                            stack.pop()
                        }

                        if (stack[stack.length - 1] === LEFT_BRACKET) {
                            stack.pop()
                            stack.push(currentChar)
                        }
                    } else {
                        commaCount = 0
                        stack.push(currentChar)
                    }
                }

                if (currentChar === LEFT_BRACKET) {
                    isValue = false
                    if (stack.length > 0 && stack[stack.length - 1] === RIGHT_BRACKET) {
                        stack.pop()
                    } else {
                        commaCount = 0
                        stack.push(currentChar)
                    }
                }

                if (currentChar === COMMA) {
                    isValue = false
                    if (stack.length <= 1) {
                        commaCount++
                    }
                }

                if (currentChar === RIGHT_SQUARE_BRACKET) {
                    isValue = false
                    stack.push(currentChar)
                }

                if (currentChar === RIGHT_BRACKET) {
                    isValue = false
                    stack.push(currentChar)
                }
            }
        }
    }

    return path
}

/**
 * Gets the end position of a match
 * @param {FindMatch} match
 * @returns The object contains the end column and line number of a match
 */
function getEndPositionOfMatch(match) {
    return {
        column: match.range.endColumn,
        lineNumber: match.range.endLineNumber
    }
}

/**
 * Finds the location of the text in Monaco Editor from its JSON location/path
 * @param {string} jsonPath The JSON path of the searched text
 * @param {string} text The text that is being searched
 * @param {ITextModel} textModel The text model of Monaco editor
 * @returns The location of the text on Monaco editor by describing its column and line number range
 */
export function findMonacoLocationOfJSONText(jsonPath, text, textModel) {
    const results = findJSONLocationOfMonacoText(text, textModel)
    let monacoLocation = {}

    if (results) {
        results.forEach(result => {
            if (jsonPath.localeCompare(result.path) === 0) {
                monacoLocation = result.match.range
                return
            }
        })
    }

    return monacoLocation
}
