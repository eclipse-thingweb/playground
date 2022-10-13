/**
 * @file The `util.js` contains the core
 * functionality the `@thing-description-playground/web` offers. It takes
 * care of integrating other playground packages
 * and offers a few utility functions.
 */


/**
 * Fetch the TD from the given address and return the JSON object
 * @param {string} urlAddr url of the TD to fetch
 */
export function getTdUrl(urlAddr){
    return new Promise( resolve => {

        fetch(urlAddr)
        .then(res => res.json())
        .then(data => {
            resolve(data)
        }, err => {alert("JSON could not be fetched from: " + urlAddr + "\n Error: " + err)})

    })
}

/**
 * Fetch the File from the given address and return the content as string
 * @param {string} urlAddr url of the TD to fetch
 */
function getTextUrl(urlAddr){
    return new Promise( resolve => {

        fetch(urlAddr)
        .then(res => res.text())
        .then(data => {
            resolve(data)
        }, err => {alert("Text could not be fetched from: " + urlAddr + "\n Error: " + err)})
    })
}

/**
 * Generate html output from the example information
 * @param {*} urlAddrObject Name, address and type of every example TD
 */
export function populateExamples(urlAddrObject){

    const loadExample = document.getElementById("load_example");
    loadExample.innerHTML = '<option class="btn-info" value="select_none">Select None</option>';
    let examplesHtml = "";

    Object.keys(urlAddrObject).forEach( name => {
        const data = urlAddrObject[name]
        if (data.type === "valid") {
            examplesHtml+='<option class="btn-success" value=' + name + '>' + name + ' &check;</option>';
        }
		if (data.type === "warning") {
            examplesHtml+='<option class="btn-warning" value=' + name + '>' + name + ' !</option>';
        }
		if (data.type === "invalid"){
			examplesHtml+='<option class="btn-danger" value=' +name + '>' + name + ' &cross;</option>';
        }
    })

    loadExample.innerHTML += examplesHtml;
}

/**
 * Executes an assertion test and
 * passes the result to the user
 * as download
 * @param {object} manualAssertions The manual assertions input of the user
 * @param {string} docType "td" or "tm"
 */
export function performAssertionTest(manualAssertions, docType){

    document.getElementById("curtain").style.display = "block"
    document.getElementById("curtain-text").innerHTML = "Assertion test ongoing..."
    const assertionSchemas=[]
    const manualAssertionsJSON=[]
    const docToValidate=window.editor.getValue()

    if (docToValidate === "") {
        alert(`No ${docType.toUpperCase()} given`)
        document.getElementById("curtain").style.display = "none"
        return
    }

    const logging = input => {
        document.getElementById("curtain-text").innerHTML = input
    }

    const assertions = (docType === "td") ? Assertions.tdAssertions : Assertions.tmAssertions

    assertions([docToValidate], getTextUrl, logging, manualAssertions)
    .then( result => {
        // remove commas to avoid errors
        const cleanResults = []
        result.forEach( el => {
            cleanResults.push({
                ID: el.ID.replace(/,/g, ''),
                Status: el.Status.replace(/,/g, ''),
                Comment: el.Comment ? el.Comment.replace(/,/g, '') : "no Comment"
            })
        })

        const csv = Papa.unparse(cleanResults)

        offerFileDownload("assertionTest.csv", csv, "text/csv;charset=utf-8;")
        document.getElementById("curtain").style.display = "none"

    }, err => {
        alert("Assertion Error: " + err)
        document.getElementById("curtain").style.display = "none"
    })

}


/**
 *  Offers a given content for download as a file.
 * @param {string} fileName The title of the csv file
 * @param {string} content The content of the csv file
 * @param {string} type The content-type to output, e.g., text/csv;charset=utf-8;
 */
function offerFileDownload(fileName, content, type) {

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
 * Generates an OpenAPI instance from
 * the TD in the Editor and passes it
 * to the user as a download
 * @param {"json"|"yaml"} fileType
 */
export function generateOAP(fileType){
    return new Promise( (res, rej) => {
        const tdToValidate=window.editor.getValue()

        if (tdToValidate === "") {
            rej("No TD given to generate OpenAPI instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            tdToOpenAPI(JSON.parse(tdToValidate)).then( openAPI => {
                // console.log(openAPI[fileType])
                const contentType = (fileType === "json" ? "application/json;" : "application/yaml;") + "charset=utf-8;"
                const content = fileType === "json" ? JSON.stringify(openAPI[fileType], undefined, 4) : openAPI[fileType]
                offerFileDownload("openapi." + fileType, content, contentType)
            }, err => {rej("OpenAPI generation problem: " + err)})
        }
    })
}

/**
 * Get the current TD
 * Call the td_to_asyncapi package
 * and return an AsyncAPI instance
 * @param {"json"|"yaml"} fileType
 */
export function generateAAP(fileType){
    return new Promise( (res, rej) => {
        const tdToValidate=window.editor.getValue()

        if (tdToValidate === "") {
            rej("No TD given to generate AsyncAPI instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            tdToAsyncAPI(JSON.parse(tdToValidate)).then( asyncAPI => {
                const contentType = (fileType === "json" ? "application/json;" : "application/yaml;") + "charset=utf-8;"
                const content = fileType === "json" ? JSON.stringify(asyncAPI[fileType], undefined, 4) : asyncAPI[fileType]
                offerFileDownload("asyncapi." + fileType, content, contentType)
            }, err => {rej("AsyncAPI generation problem: " + err)})
        }
    })
}

/**
 * applies adding unset default values
 * to the TD in the editor
 */
export function addDefaults() {
    const tdToExtend = JSON.parse(window.editor.getValue())
    tdDefaults.addDefaults(tdToExtend)
    window.editor.setValue(JSON.stringify(tdToExtend, undefined, 4))
}

/**
 * applies removing explicitly given
 * default values from the TD
 * in the editor
 */
export function removeDefaults() {
    const tdToReduce = JSON.parse(window.editor.getValue())
    tdDefaults.removeDefaults(tdToReduce)
    window.editor.setValue(JSON.stringify(tdToReduce, undefined, 4))
}

/**
 * Post the gist to the backend
 * @param {string} name The name of the gist to submit
 * @param {string} description The description of the gist to submit
 * @param {string} content The TD to submit as gist
 */
export function submitAsGist(name, description, content, url){
    return new Promise( (res, rej) => {

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({name, description, content})
        }).then( reply => {
            // check if gist creation was successful
            if(reply.status === 201) {
                reply.json().then( jsonReply => {
                    // to get other resources of the created gist use jsonReply.location and fetch it from GitHub directly
                    console.log(jsonReply.location)
                    res(jsonReply.htmlUrl)
                }, err => {rej("Request successful, but cannot json() reply: " + err)})
            }
            else {
                reply.json().then( jsonReply => {
                    rej("Problem reported by backend (Status:"+ reply.status + " " + reply.statusText + "): " + jsonReply.errors)
                }, err => {
                    rej("Cannot json() reply and problem reported by backend, status: " + reply.status + " " + reply.statusText)
                })
            }
        }, err => {
            rej("Problem fetching from backend: " + err)
        })
    })
}

/**
 * Toggles Validation Table view
 */
export function toggleValidationStatusTable(){
    if (document.getElementById("validation_table").style.display === "") {
        showValidationStatusTable()
    }
    else {
        hideValidationStatusTable()
    }
}

function showValidationStatusTable() {
    document.getElementById("validation_table").style.display = "table-row-group"
    document.getElementById("validation_table").style.opacity = 1
    document.getElementById("table_head_arrow").setAttribute("class", "or-up")
}

function hideValidationStatusTable() {
    document.getElementById("validation_table").style.opacity = 0
    document.getElementById("validation_table").addEventListener("transitionend", () => {
        document.getElementById("validation_table").style.display = ""
    }, true)
    document.getElementById("table_head_arrow").setAttribute("class", "or-down")
}

/**
 * Name, Address and type ("valid", "warning", "invalid") of all example TDs
 * @param {string} docType "td" or "tm"
 */
export function getExamplesList(docType){
    return (docType === 'td')
        ? {
            "SimpleTDWithDefaults": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/valid/simpleWithDefaults.json",
                "type": "valid"
            },
            "MultipleOpWithDefaults": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/valid/formOpArrayWithDefaults.json",
                "type": "valid"
            },
            "SimpleTD": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/valid/simple.json",
                "type": "warning"
            },
            "MultipleOp": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/valid/formOpArray.json",
                "type": "warning"
            },
            "EnumConstContradiction": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/warning/enumConst.json",
                "type": "warning"
            },
            "ArrayWithNoItems": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/warning/arrayNoItems.json",
                "type": "warning"
            },
            "InvalidOperation": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/invalid/invalidOp.json",
                "type": "invalid"
            },
            "EmptySecurityDefs": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tds/invalid/emptySecDef.json",
                "type": "invalid"
            }
        }
        : {
            "Placeholder": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/valid/placeholder.json",
                "type": "valid"
            },
            "Reference": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/valid/ref.json",
                "type": "valid"
            },
            "Extend": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/valid/extend.json",
                "type": "valid"
            },
            "Affordances": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/valid/affordances.json",
                "type": "valid"
            },
            "AbsentContext": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/invalid/absent_context.json",
                "type": "invalid"
            },
            "AbsentTM": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/invalid/absent_tm.json",
                "type": "invalid"
            },
            "NoCurlyBracket": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/invalid/no_curly_bracket.json",
                "type": "invalid"
            },
            "SingleCurlyBracket": {
                "addr": "./node_modules/@thing-description-playground/core/examples/tms/invalid/single_curly_bracket.json",
                "type": "invalid"
            }
        }
}

/**
 * Clear the editor, or paste TD -> according to user selection
 * @param {*} e selected example
 */
export function exampleSelectHandler(e, obj) {

    clearLog()
    e.preventDefault()

    if(document.getElementById("load_example").value === "select_none") {
        window.editor.setValue("")
    }
    else{
        const urlAddr=obj.urlAddrObject[document.getElementById("load_example").value].addr;
        getTdUrl(urlAddr).then( data => {
            window.editor.setValue(JSON.stringify(data,null,'\t'))
        })
    }
}


/**
 * Calls the validation function if intended
 * @param {string} source "auto" or "manual"
 * @param {boolean} autoValidate is autovalidation active?
 * @param {string} docType "td" or "tm"
 */
export function validate(source, autoValidate, docType="td") {
    if(source === "manual" || (source === "auto" && autoValidate)) {
        const text = window.editor.getValue();

        resetValidationStatus()

        realValidator(text, docType, source);
    }
}

/**
 * Calls the Validator of the core package
 * @param {string} body Thing Description/Thing Model to validate
 * @param {string} docType "td" or "tm"
 * @param {*} source "manual" or "auto"
 */
function realValidator(body, docType, source) {
    document.getElementById("btn_validate").setAttribute("disabled", "true")
    if (document.getElementById("box_reset_logging").checked) {
        document.getElementById("console").innerHTML = ""
    }

    if (source === "manual") {log("------- New Validation Started -------")}

    const checkJsonLd = document.getElementById("box_jsonld_validate").checked

    console.log(Validators.tdValidator)
    console.log(Validators.tmValidator)

    const validator = (docType === "td") ? Validators.tdValidator : Validators.tmValidator

    validator(body, log, {checkDefaults: true, checkJsonLd})
    .then( result => {
        let resultStatus = "success"

        Object.keys(result.report).forEach( el => {
            const spotName = "spot-" + el
            if (result.report[el] === "passed") {
                document.getElementById(spotName).style.visibility = "visible"
                document.getElementById(spotName).setAttribute("fill", "green")
                if(source === "manual") {log(el + " validation... OK")}
            }
            else if (result.report[el] === "warning") {
                document.getElementById(spotName).style.visibility = "visible"
                document.getElementById(spotName).setAttribute("fill", "orange")
                resultStatus = (resultStatus !== "danger") ? "warning" : "danger"
                if(source === "manual") {log(el + " optional validation... KO")}

            }
            else if (result.report[el] === "failed") {
                document.getElementById(spotName).style.visibility = "visible"
                document.getElementById(spotName).setAttribute("fill", "red")
                resultStatus = "danger"
                if(source === "manual") {log("X " + el + " validation... KO")}
            }
            else if (result.report[el] === null) {
                // do nothing
            }
            else {
                console.error("unknown report feedback value")
            }
        })

        if (source === "manual") {
            log("Details of the \"additional\" checks: ")
            Object.keys(result.details).forEach(el => {
                log("    " + el + " " + result.details[el] + " (" + result.detailComments[el] + ")")
            })
        }

        updateValidationStatusHead(resultStatus);
        document.getElementById("btn_validate").removeAttribute("disabled")
    })
}

/**
 * Prints a message in a container
 * @param {string} message
 */
function log(message) {
    document.getElementById("console").innerHTML += message + '&#13;&#10;'
}

/**
 * Hides an element with visibility = "hidden"
 * @param {string} id Id of the element to hide
 */
function reset(id) {
    document.getElementById(id).style.visibility = "hidden"
}

/**
 * Resets all spot lights
 */
function resetValidationStatus(){
    reset('spot-json')
    reset('spot-schema')
    reset('spot-defaults')
    reset('spot-jsonld')
    reset('spot-additional')
}

/**
 * Shows/Hides the validation table and sets the header color
 * @param {string} validationStatus "success", "warning" or "danger"
 */
function updateValidationStatusHead(validationStatus)
{
    if (validationStatus === "danger") {
        showValidationStatusTable()
    }
    else {
        hideValidationStatusTable()
    }

    document.getElementById("validation_table_head").setAttribute("class", "btn-" + validationStatus)
}

/**
 * Delete the content of the logging container and reset the validation lights
 */
export function clearLog() {

    document.getElementById("console").innerHTML = "Reset! Waiting for validation... " + "&#13;&#10;"

    resetValidationStatus()

    document.getElementById("validation_table_head").setAttribute("class", "btn-info")

    hideValidationStatusTable()
}

// Monaco Location Pointer


/**
 * Finds the location/path of the text in JSON from its Monaco Editor location
 * @param {string} text
 * @param {object} editor
 */
export function findJSONLocationOfMonacoText(text, textModel) {
    const matches = textModel.findMatches(text, false, false, false, null, false)

    let i = 1
    matches.forEach(match => {
        searchParent(textModel, getEndPositionOfMatch(match))
        console.log({
            path,
            range: match.range
        })
        path = ''
        i++
    })
}

let path = ''
let parentKey = ''

const QUOTE = '"'
const LEFT_BRACKET = "{"
const RIGHT_BRACKET = "}"
const SEMICOLON = ":"
const LEFT_SQUARE_BRACKET = "["
const RIGHT_SQUARE_BRACKET = "]"
const COMMA = ","

/*
{
    "a": "hello",
    "b": {
        "c": "hello",
        "x": [{"x": "s"}],
        "d": [{"x": [], "y": []}, "a", ["a", {"x": "x"}], {"t": "a", "w": "hello"}]
    },
    "c": {}
}
*/

function searchParent(textModel, position) {
    const stack = []
    let recordingParent = false
    let isValue = true
    let inArray = false
    let countingComma = true
    let commaCount = 0

    for (let i = position.lineNumber; i > 0; i--) {
        const currentColumnIndex = (i === position.lineNumber ? position.column : textModel.getLineLength(i)) - 1
        const lineContent = textModel.getLineContent(i)
        for (let j = currentColumnIndex; j >= 0; j--) {
            const currentChar = lineContent[j]

            if (recordingParent) {
                if (currentChar === QUOTE) {
                    if(stack[stack.length - 1] === QUOTE) {
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
                // decide whether it is time record parent key or not
                if (currentChar === SEMICOLON) {
                    recordingParent = isValue

                    if (stack.length > 0) {
                        const top = stack[stack.length - 1]

                        if (top === LEFT_SQUARE_BRACKET) {
                            inArray = true
                            console.log(`it is a value. index: ${commaCount}`)
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
                            countingComma = true
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
                        countingComma = true
                    }  else {
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
 * @param {string} text
 * @param {string} jsonPath
 * @param {object} editor

 */
export function findMonacoLocationOfJSONText(text, jsonPath, editor) {

}