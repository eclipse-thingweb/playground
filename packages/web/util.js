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
 export function generateTD(fileType){
    return new Promise( (res, rej) => {
        const tdToValidate = window.tdEditor.getValue()

        if (tdToValidate === "") {
            rej("No TD given to generate TD instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            try {
                const content = fileType === "json"
                        ? JSON.stringify(JSON.parse(Validators.convertTDYamlToJson(tdToValidate)), undefined, 4)
                        : Validators.convertTDJsonToYaml(tdToValidate)

                monaco.editor.setModelLanguage(window.tdEditor.getModel(), fileType)
                window.tdEditor.getModel().setValue(content)
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
export function generateOAP(fileType){
    return new Promise( (res, rej) => {
        const tdToValidate = window.editorFormat === "json"
             ? window.tdEditor.getValue()
             : Validators.convertTDYamlToJson(window.tdEditor.getValue())

        if (tdToValidate === "") {
            rej("No TD given to generate OpenAPI instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            tdToOpenAPI(JSON.parse(tdToValidate)).then( openAPI => {
                const content = fileType === "json" ? JSON.stringify(openAPI[fileType], undefined, 4) : openAPI[fileType]
                monaco.editor.setModelLanguage(window.openApiEditor.getModel(), fileType)
                window.openApiEditor.getModel().setValue(content)
            }, err => {rej("OpenAPI generation problem: " + err)})
        }
    })
}

/**
 * Generates an AsyncAPI instance from
 * the TD in the Editor
 * @param {"json"|"yaml"} fileType
 */
export function generateAAP(fileType){
    return new Promise( (res, rej) => {
        const tdToValidate = window.editorFormat === "json"
             ? window.tdEditor.getValue()
             : Validators.convertTDYamlToJson(window.tdEditor.getValue())

        if (tdToValidate === "") {
            rej("No TD given to generate AsyncAPI instance")
        }
        else if (fileType !== "json" && fileType !== "yaml") {
            rej("Wrong content type required: " + fileType)
        }
        else {
            tdToAsyncAPI(JSON.parse(tdToValidate)).then( asyncAPI => {
                const content = fileType === "json" ? JSON.stringify(asyncAPI[fileType], undefined, 4) : asyncAPI[fileType]
                monaco.editor.setModelLanguage(window.asyncApiEditor.getModel(), fileType)
                window.asyncApiEditor.getModel().setValue(content)
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
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/valid/simpleWithDefaults.json",
                "type": "valid"
            },
            "MultipleOpWithDefaults": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/valid/formOpArrayWithDefaults.json",
                "type": "valid"
            },
            "SimpleTD": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/valid/simple.json",
                "type": "warning"
            },
            "MultipleOp": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/valid/formOpArray.json",
                "type": "warning"
            },
            "EnumConstContradiction": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/warning/enumConst.json",
                "type": "warning"
            },
            "ArrayWithNoItems": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/warning/arrayNoItems.json",
                "type": "warning"
            },
            "InvalidOperation": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/invalid/invalidOp.json",
                "type": "invalid"
            },
            "EmptySecurityDefs": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tds/invalid/emptySecDef.json",
                "type": "invalid"
            }
        }
        : {
            "Placeholder": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/valid/placeholder.json",
                "type": "valid"
            },
            "Reference": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/valid/ref.json",
                "type": "valid"
            },
            "Extend": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/valid/extend.json",
                "type": "valid"
            },
            "Affordances": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/valid/affordances.json",
                "type": "valid"
            },
            "AbsentContext": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/invalid/absent_context.json",
                "type": "invalid"
            },
            "AbsentTM": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/invalid/absent_tm.json",
                "type": "invalid"
            },
            "NoCurlyBracket": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/invalid/no_curly_bracket.json",
                "type": "invalid"
            },
            "SingleCurlyBracket": {
                "addr": "../../node_modules/@thing-description-playground/core/examples/tms/invalid/single_curly_bracket.json",
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
            if (window.editor === window.tdEditor) {
                if (window.editorFormat === 'json') {
                    window.editor.setValue(JSON.stringify(data,null,'\t'))
                } else {
                    window.editor.setValue(Validators.convertTDJsonToYaml(JSON.stringify(data)))
                }
            } else {
                window.editor.setValue(JSON.stringify(data,null,'\t'))
            }
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

/**
 * Save current TD/TM as a compressed string in URL fragment.
 * @param {string} docType "td" or "tm"
 * @param {string} format "json" or "yaml"
 */
export async function save(docType, format) {
    const value = window.editor.getValue();

    if (!value) {
        alert(`No ${docType.toUpperCase()} provided`);
        return;
    }

    const data = docType + format + value;
    const compressed = Validators.compress(data);
    window.location.hash = compressed;
    await navigator.clipboard.writeText(window.location.href);
    alert('The sharable URL is copied to your clipboard, if not - simply copy the address bar.');
}

/**
 * Given a URL fragment construct current value of an editor.
 */
export function getEditorValue(fragment) {
    const data = Validators.decompress(fragment);
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
 * @param {ITextModel} textModel The text model of Monaco Edtior
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