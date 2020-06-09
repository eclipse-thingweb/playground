 // const tdValidator = require('playground-core')
// import {tdValidator} from "./node_modules/playground-core/dist/web-bundle.js"
/**
 * Fetch the TD from the given address and paste it into the editor
 * @param {*} urlAddr url of the TD to fetch
 */
export function getTdUrl(urlAddr){
    return new Promise( resolve => {
        fetch(urlAddr)
        .then(res => res.json())
        .then(data => {
            console.log(data)
            resolve(data)
        }, err => {alert("JSON could not be fetched from: " + urlAddr + "\n Error: " + err)})
    })
    // $.getJSON(urlAddr,function(data){
    //  window.editor.setValue(JSON.stringify(data,null,'\t'));
    // }).error(function(){alert("The JSON could not be fetched from the address:\n"+urlAddr)});
}
// module.exports.getTdUrl = getTdUrl

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
// module.exports.populateExamples = populateExamples

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
//     const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len




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
 * asdf TODO: remove jQuery
 * @param {*} e asdf
 */
export function textAreaManipulation(e) {
    if(e.keyCode === 9) { // tab was pressed
        // get caret position/selection
        const start = this.selectionStart;
        const end = this.selectionEnd;

        const $this = $(this);
        const value = $this.val();

        // set textarea value to: text before caret + tab + text after caret
        $this.val(value.substring(0, start)
                    + "\t"
                    + value.substring(end));

        // put caret at right position again (add one for the tab)
        this.selectionStart = this.selectionEnd = start + 1;

        // prevent the focus lose
        e.preventDefault();
    }
}
// module.exports.textAreaManipulation = textAreaManipulation

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
    // TODO: fade in/out with 200ms duration should be added
    const tableStyle = document.getElementById("validation_table").style.display
    document.getElementById("validation_table").style.display = (tableStyle === "none") ? "initial" : "none"
//    $("#validation_table").fadeToggle("fast");
    if(document.getElementById("table_head_arrow").getAttribute("class") === "up") {
        document.getElementById("table_head_arrow").setAttribute("class", "down")
    }
    else{
        document.getElementById("table_head_arrow").setAttribute("class", "up")
    }
}
// module.exports.toggleValidationStatusTable = toggleValidationStatusTable

/**
 * Name, Address and type ("valid", "warning", "invalid") of all example TDs
 */
export function getExamplesList(){
            const examples={
                "SimpleTD": {
                    "addr": "./node_modules/playground-core/Examples/Valid/simple.json",
                    "type": "valid"
                },
                "MultipleOp":{
                    "addr":"./node_modules/playground-core/Examples/Valid/formOpArray.json",
                    "type":"valid"
                },
                "EnumConstContradiction":{
                    "addr":"./node_modules/playground-core/Examples/Warning/enumConst.json",
                    "type":"warning"
                },
                "ArrayWithNoItems":{
                    "addr":"./node_modules/playground-core/Examples/Warning/arrayNoItems.json",
                    "type":"warning"
                },
                "InvalidOperation":{
                    "addr":"./node_modules/playground-core/Examples/Invalid/invalidOp.json",
                    "type":"invalid"
                 },
                "EmptySecurityDefs":{
                    "addr":"./node_modules/playground-core/Examples/Invalid/emptySecDef.json",
                    "type":"invalid"
                }
            };

    return examples;
}
// module.exports.getExamplesList = getExamplesList

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
// module.exports.exampleSelectHandler = exampleSelectHandler

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
 * asdf
 * @param {} bytes asdf
 */
function isUtf8(bytes)
{
    let i = 0;
    while(i < bytes.length)
    {
        if(     (// ASCII
                    bytes[i] === 0x09 ||
                    bytes[i] === 0x0A ||
                    bytes[i] === 0x0D ||
                    (0x20 <= bytes[i] && bytes[i] <= 0x7E)
                )
          ) {
              i += 1;
              continue;
          }

        if(     (// non-overlong 2-byte
                    (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
                    (0x80 <= bytes[i+1] && bytes[i+1] <= 0xBF)
                )
          ) {
              i += 2;
              continue;
          }

        if(     (// excluding overlongs
                    bytes[i] === 0xE0 &&
                    (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                    (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
                ) ||
                (// straight 3-byte
                 ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
                  bytes[i] === 0xEE ||
                  bytes[i] === 0xEF) &&
                 (0x80 <= bytes[i + 1] && bytes[i+1] <= 0xBF) &&
                 (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
                ) ||
                (// excluding surrogates
                 bytes[i] === 0xED &&
                 (0x80 <= bytes[i+1] && bytes[i+1] <= 0x9F) &&
                 (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
                )
          ) {
              i += 3;
              continue;
          }

        if(     (// planes 1-3
                    bytes[i] === 0xF0 &&
                    (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                    (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                    (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
                ) ||
                (// planes 4-15
                 (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
                 (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                 (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                 (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
                ) ||
                (// plane 16
                 bytes[i] === 0xF4 &&
                 (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
                 (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                 (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
                )
          ) {
              i += 4;
              continue;
          }
        return true;
    }
    return true;
}

/**
 * asdf
 * @param {*} objArray asdf
 */
function convertToCSV(objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (const index in array[i]) {
            if (line !== '') line += ','

            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
}

/**
 * asdf
 * @param {*} headers sda
 * @param {*} items sdf
 * @param {*} fileTitle sdf
 */
function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }

    // Convert Object to JSON
    const jsonObject = JSON.stringify(items);

    const csv = this.convertToCSV(jsonObject);

    const exportedFilename = fileTitle + '.csv' || 'export.csv';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, exportedFilename);
    } else {
        const link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

export function validate(e,source, autoValidate) {
    console.log(typeof e.type)
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

// Private helpers
    function realValidator(td, source) {
        // TODO: add trigger validate-json event chain functionality
        if (source === "manual") {log("------- New Validation Started -------")}

        const tdSchemaProm = getTdUrl("./node_modules/playground-core/td-schema.json")
        const tdFullSchemaProm = getTdUrl("./node_modules/playground-core/td-schema-full.json")

        Promise.all([tdSchemaProm, tdFullSchemaProm]).then( values => {
            console.log("Validation would happen now!!!")
            console.log(td)
            console.log(values[0])
            console.log(values[1])
             tdValidator(td, JSON.stringify(values[0]), JSON.stringify(values[1]), {checkDefaults: false, checkJsonLd: true})
             .then( result => {
                log(JSON.stringify(result))
                // console.log(report)
                ["json","schema", "defaults", "jsonld", "add"].forEach( el => {
                    console.log(result.report[el])
                })
                // if (report.json ===)


             })
        })
    }

    function log(message) {
        document.getElementById("console").innerHTML += message + '&#13;&#10;'
    }

    function reset(id) {
        document.getElementById(id).style.visibility = "hidden"
    }

    function resetValidationStatus(){
        reset('spot-json')
        reset('spot-schema')
        reset('spot-defaults')
        reset('spot-jsonld')
        reset('spot-additional-state')
    }

    function updateValidationStatusHead(validationStatus)
    {
        if (validationStatus === "danger") {
            // $("#validation_table").fadeIn("fast");
            document.getElementById("validation_table").setAttribute("class", "custom-fade-in")
            document.getElementById("table_head_arrow").setAttribute("class", "up")
            // $("#table_head_arrow").removeClass();
            // $("#table_head_arrow").toggleClass("up");
        }
        else {
            document.getElementById("validation_table").setAttribute("class", "custom-fade-out")
            // $("#validation_table").fadeOut("fast");
            document.getElementById("table_head_arrow").setAttribute("class", "down")
            // $("#table_head_arrow").removeClass();
            // $("#table_head_arrow").toggleClass("down");
        }

        document.getElementById("validation_table_head").setAttribute("class", "btn-" + validationStatus)
        // $("#validation_table_head").removeClass();
        // $("#validation_table_head").toggleClass("btn-"+validationStatus);
    }
// module.exports.validate = validate

export function clearLog() {
    // var pgConsole = $('#console');
    // pgConsole.empty();
    // pgConsole.append("Reset! Waiting for validation... " + '&#13;&#10;');
    document.getElementById("console").innerHTML = "Reset! Waiting for validation... " + "&#13;&#10;"
    // reset('spot-json');
    // reset('spot-simple-json-schema');
    // reset('spot-full-json-schema');
    // reset('spot-json-ld');
    // reset('spot-add');
    resetValidationStatus()
    // $("#validation_table_head").removeClass();
    // $("#validation_table_head").toggleClass("btn-info");
    document.getElementById("validation_table_head").setAttribute("class", "btn-info")
    // $("#validation_table").fadeOut("fast",function(){
	// 	$("#table_head_arrow").removeClass();
    //     $("#table_head_arrow").toggleClass("down");
    // });
    document.getElementById("validation_table").setAttribute("class", "custom-fade-out")
    setTimeout( () => {
        document.getElementById("table_head_arrow").setAttribute("class", "down")
    }, 200)
}

// module.exports.clearLog = clearLog