/* *******************************************************************************
 * Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/

/**
 * Fetch the TD from the given address and paste it into the editor
 * @param {*} urlAddr url of the TD to fetch
 */
export function getTdUrl(urlAddr){
    return new Promise( resolve => {
        fetch(urlAddr)
        .then(res => res.json())
        .then(data => {
            // console.log(data)
            resolve(data)
        }, err => {alert("JSON could not be fetched from: " + urlAddr + "\n Error: " + err)})
    })
}

/**
 * Generate html output from the example information
 * @param {*} urlAddrObject Name, address and type of every example TD
 */
export function populateExamples(urlAddrObject){

    let examplesHtml = "";

    Object.keys(urlAddrObject).forEach( name => {
        const data = urlAddrObject[name]
        if (data.type === "valid") {
            examplesHtml+='<option class="btn-success" value='+name+'>'+name +'</option>';
        }
		if (data.type === "warning") {
            examplesHtml+='<option class="btn-warning" value='+name+'>'+name +'</option>';
        }
		if (data.type === "invalid"){
			examplesHtml+='<option class="btn-danger" value='+name+'>'+name +'</option>';
        }
    })

    document.getElementById("load_example").innerHTML += examplesHtml;
}

/**
 * asdf
 * @param {*} e sadf
 */
// function performAssertionTest(e){

//     e.preventDefault()
//     $("#curtain").css("display","block")// drop curtian while  assertions test going on
//     $("#curtain-text").html("Assertion test is going to be loaded.")
//     const assertionSchemas=[]
//     const manualAssertionsJSON=[]
//     const tdToValidate=window.editor.getValue()


//     let tdSchema=[];
//     let draft=[];
//     const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|
//                                          i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|
//                                          no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|
//                                          ^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})
//                                          (?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?
//                                          ((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|
//                                          ^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len




//     $.getJSON('list.json', function (assertionList) {

//         const tAssertions=assertionList.length

//         for (let i = 0; i < tAssertions; i++) {
//             // send an AJAX request to each individual JSON file
//             // available on the server as returned by the discover endpoint
//             $("#curtain-text").html("Loading Assertion Schemas:"+(i*100/tAssertions).toString()+"%")
//             $.getJSON('AssertionTester/Assertions/'+assertionList[i], function (assertion) {

//                 assertionSchemas.push(assertion);

//             });
//         }
//         console.log(assertionSchemas)
//         $("#curtain-text").html("Loading JSON Schema Darft 06");
//         $.getJSON('json-schema-draft-06.json', function (json) {

//             draft=json;
//             $("#curtain-text").html("Loading TD Schema. ");
//             $.getJSON('td-schema.json', function (schemajson) {
//                 tdSchema=schemajson;
//                 let curCsvResults = []

//                 try {
//                     curCsvResults = assertionValidate(tdToValidate, assertionSchemas, manualAssertions, tdSchema, draft);

//                     // toOutput(JSON.parse(tdToValidate).id, outputLocation, curCsvResults)
//                     console.log(curCsvResults);
//                 } catch (error) {
//                     // this needs to go to output
//                     console.log({
//                         "ID": error,
//                         "Status": "fail",
//                         "Comment":"Invalid TD"
//                     });
//                     results.push({
//                         "ID": error,
//                         "Status": "fail",
//                         "Comment":"Invalid TD"
//                     });
//                     curCsvResults=results
//                 }
//                 // console.log(schemajson)

//                 $("#curtain-text").html("Creating outputfile.");
//                 assertionTestResult=curCsvResults;
//                  const assertionTestResultFormatted=[];
//                 const csvContent = "data:text/csv;charset=utf-8,";



//                 const headers = {
//                     ID: "ID",
//                     Status: "Status",
//                     Comment:"Comment"
//                 };


//                 assertionTestResult.forEach(item => {
//                     if(item.Comment){
//                     assertionTestResultFormatted.push({
//                         ID: item.ID.replace(/,/g, ''), // remove commas to avoid errors,
//                         Status: item.Status.replace(/,/g, ''),
//                         Comment: item.Comment.replace(/,/g, '')    })}
//                     else{
//                         assertionTestResultFormatted.push({
//                             ID: item.ID.replace(/,/g, ''), // remove commas to avoid errors,
//                             Status: item.Status.replace(/,/g, ''),
//                             Comment: "no Comment"})
//                         }

//                     });

//                 const fileTitle="assertionTest";

//                 exportCSVFile(headers, assertionTestResultFormatted, fileTitle);


//                 $("#curtain").css("display","none")// remove curtain

//         });

//     });
//     });
// }


/**
 * asdf
 */
function submitAsGist(){
    const name = prompt("Please enter the Name of TD:");
    const data={
            "description": "Directly from playground",
                "public": true,
                "files": {
                [name]: {
                "content": window.editor.getValue()
                        }
                }
            };

    const url='https://api.github.com/gists';

    // ///please fill in the token after getting the code from github for example:
    // //"Authorization" : `Token #`
    // //To
    // //"Authorization" : `Token 60222272d2d5c5a82d2df4a857c528cf4620f175`

    const headers = {
            "Authorization" : `Token 5671aca3addfdf7ee2d595d6f38daeb15dd6ecc9 `
        }

        // TODO: remove jquery
    // $.ajax({
    //     type: "POST",
    //     url,
    //     headers,
    //     success,
    //     data:JSON.stringify(data),
    //     error(XMLHttpRequest, textStatus, errorThrown) {
    //             alert(errorThrown);
    //     }
    // });

    function success(dt) {
        const file=dt.files[name].raw_url;
        window.open(file, '_blank');
        // console.log(file);
    }
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
 */
export function getExamplesList(){
            const examples={
                "SimpleTD": {
                    "addr": "./node_modules/playground-core/examples/valid/simple.json",
                    "type": "valid"
                },
                "MultipleOp":{
                    "addr":"./node_modules/playground-core/examples/valid/formOpArray.json",
                    "type":"valid"
                },
                "EnumConstContradiction":{
                    "addr":"./node_modules/playground-core/examples/warning/enumConst.json",
                    "type":"warning"
                },
                "ArrayWithNoItems":{
                    "addr":"./node_modules/playground-core/examples/warning/arrayNoItems.json",
                    "type":"warning"
                },
                "InvalidOperation":{
                    "addr":"./node_modules/playground-core/examples/invalid/invalidOp.json",
                    "type":"invalid"
                 },
                "EmptySecurityDefs":{
                    "addr":"./node_modules/playground-core/examples/invalid/emptySecDef.json",
                    "type":"invalid"
                }
            };

    return examples;
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
 * takes character number and gives out the line number
 * @param {*} characterNo asdf
 * @param {*} str asdf
 */
function getLineNumber(characterNo,str)
{
    const charsPerLine=[];
    const str2lines=str.split("\n");


    // calculate number of characters in each line
    $.each(str2lines,function(index,value){
        const strVal = String(value);
        charsPerLine.push(strVal.length);
        characterNo++;
    });

    // find the line containing that characterNo
    let count=0;
    let lineNo=0;
    while(characterNo>count)
    {
        count+=charsPerLine[lineNo];
        lineNo++;
    }
    return lineNo;
}

/**
 * asdf TODO: needed? (assertions?)
 * @param {} bytes asdf
 */
// function isUtf8(bytes)
// {
//     let i = 0;
//     while(i < bytes.length)
//     {
//         if(     (// ASCII
//                     bytes[i] === 0x09 ||
//                     bytes[i] === 0x0A ||
//                     bytes[i] === 0x0D ||
//                     (0x20 <= bytes[i] && bytes[i] <= 0x7E)
//                 )
//           ) {
//               i += 1;
//               continue;
//           }

//         if(     (// non-overlong 2-byte
//                     (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
//                     (0x80 <= bytes[i+1] && bytes[i+1] <= 0xBF)
//                 )
//           ) {
//               i += 2;
//               continue;
//           }

//         if(     (// excluding overlongs
//                     bytes[i] === 0xE0 &&
//                     (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
//                     (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
//                 ) ||
//                 (// straight 3-byte
//                  ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
//                   bytes[i] === 0xEE ||
//                   bytes[i] === 0xEF) &&
//                  (0x80 <= bytes[i + 1] && bytes[i+1] <= 0xBF) &&
//                  (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
//                 ) ||
//                 (// excluding surrogates
//                  bytes[i] === 0xED &&
//                  (0x80 <= bytes[i+1] && bytes[i+1] <= 0x9F) &&
//                  (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
//                 )
//           ) {
//               i += 3;
//               continue;
//           }

//         if(     (// planes 1-3
//                     bytes[i] === 0xF0 &&
//                     (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
//                     (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
//                     (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
//                 ) ||
//                 (// planes 4-15
//                  (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
//                  (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
//                  (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
//                  (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
//                 ) ||
//                 (// plane 16
//                  bytes[i] === 0xF4 &&
//                  (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
//                  (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
//                  (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
//                 )
//           ) {
//               i += 4;
//               continue;
//           }
//         return true;
//     }
//     return true;
// }

/**
 * asdf TODO: needed? (assertions?)
 * @param {*} objArray asdf
 */
// function convertToCSV(objArray) {
//     const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
//     let str = '';

//     for (let i = 0; i < array.length; i++) {
//         let line = '';
//         for (const index in array[i]) {
//             if (Object.prototype.hasOwnProperty.call(array[i], index)) {
//                 if (line !== '') line += ','

//                 line += array[i][index];
//             }
//         }
//         str += line + '\r\n';
//     }
//     return str;
// }

/**
 * asdf TODO: needed? (assertions?)
 * @param {*} headers sda
 * @param {*} items sdf
 * @param {*} fileTitle sdf
 */
// function exportCSVFile(headers, items, fileTitle) {
//     if (headers) {
//         items.unshift(headers);
//     }

//     // Convert Object to JSON
//     const jsonObject = JSON.stringify(items);

//     const csv = this.convertToCSV(jsonObject);

//     const exportedFilename = fileTitle + '.csv' || 'export.csv';

//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     if (navigator.msSaveBlob) { // IE 10+
//         navigator.msSaveBlob(blob, exportedFilename);
//     } else {
//         const link = document.createElement("a");
//         if (link.download !== undefined) { // feature detection
//             // Browsers that support HTML5 download attribute
//             const url = URL.createObjectURL(blob);
//             link.setAttribute("href", url);
//             link.setAttribute("download", exportedFilename);
//             link.style.visibility = 'hidden';
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//         }
//     }
// }

/**
 * Calls the validation function if intended
 * @param {Event} e Event that triggered the function call
 * @param {string} source "auto" or "manual"
 * @param {boolean} autoValidate is autovalidation active?
 */
export function validate(e,source, autoValidate) {
//    console.log(typeof e.type)
    if(typeof e.type !== "undefined") {
        const text = window.editor.getValue();
        source=e.data.source;

        resetValidationStatus()

          //  source=e.data.source;
        realValidator(text, source);
    }
    else {
        if (!(source === "auto" && autoValidate === false)) {
                const text = window.editor.getValue();

                resetValidationStatus()

                //  source=e.data.source;
                realValidator(text, source);
        }}
}

/* ----------------- Private Helpers ----------------------- */
/**
 * Calls the Validator of the playground-core package
 * @param {string} td Thing Description to validate
 * @param {*} source "manual" or "auto"
 */
function realValidator(td, source) {
    document.getElementById("btn_validate").setAttribute("disabled", "true")
    if (document.getElementById("box_reset_logging").checked) {
        document.getElementById("console").innerHTML = ""
    }

    if (source === "manual") {log("------- New Validation Started -------")}

    const tdSchemaProm = getTdUrl("./node_modules/playground-core/td-schema.json")
    const tdFullSchemaProm = getTdUrl("./node_modules/playground-core/td-schema-full.json")

    Promise.all([tdSchemaProm, tdFullSchemaProm]).then( values => {

        const checkJsonLd = document.getElementById("box_jsonld_validate").checked

            tdValidator(td, JSON.stringify(values[0]), JSON.stringify(values[1]), log, {checkDefaults: true, checkJsonLd})
            .then( result => {
                let resultStatus = "success"
            log(JSON.stringify(result));
            // console.log(result);
            ["json","schema", "defaults", "jsonld", "add"].forEach( el => {
                console.log(el,result.report[el])
                const spotName = "spot-" + el
                if (result.report[el] === "passed") {
                    document.getElementById(spotName).style.visibility = "visible"
                    document.getElementById(spotName).setAttribute("fill", "green")
                    if(source === "manual") {log(el + "validation... OK")}
                }
                else if (result.report[el] === "warning") {
                    document.getElementById(spotName).style.visibility = "visible"
                    document.getElementById(spotName).setAttribute("fill", "orange")
                    resultStatus = (resultStatus !== "danger") ? "warning" : "danger"
                    if(source === "manual") {log(el + "optional validation... KO")}

                }
                else if (result.report[el] === "failed") {
                    document.getElementById(spotName).style.visibility = "visible"
                    document.getElementById(spotName).setAttribute("fill", "red")
                    resultStatus = "danger"
                    if(source === "manual") {log("X" + el + "validation... KO")}
                }
                else if (result.report[el] === null) {
                    // do nothing
                }
                else {
                    console.error("unknown report feedback value")
                }
            })
            updateValidationStatusHead(resultStatus);
            document.getElementById("btn_validate").removeAttribute("disabled")
            })
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
    reset('spot-add')
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
/* ------------------------------------------------------ */

/**
 * Delete the content of the logging container and reset the validation lights
 */
export function clearLog() {

    document.getElementById("console").innerHTML = "Reset! Waiting for validation... " + "&#13;&#10;"

    resetValidationStatus()

    document.getElementById("validation_table_head").setAttribute("class", "btn-info")

    hideValidationStatusTable()
}
