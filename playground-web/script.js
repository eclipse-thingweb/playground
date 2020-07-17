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

import * as util from "./util.js"

const manualAssertions = []
let manualAssertionsLoaded = false
const results = []
let autoValidate = false

document.getElementById("box_jsonld_validate").checked = true

document.getElementById("validation_table_head").addEventListener("click", ()=>{
	util.toggleValidationStatusTable()
})

// Auto validates only when the box is checked.
document.getElementById("box_auto_validate").addEventListener("change", () => {
	autoValidate = document.getElementById("box_auto_validate").checked
})


document.getElementById("btn_assertion_popup").addEventListener("click", () => {
	if (!manualAssertionsLoaded) {
		fetch("./node_modules/playground-assertions/manual.csv")
		.then( res => {
			if (res.ok) {
				return res.text()
			} else {
				throw new Error("Could not fetch manual assertions: \n Status:" +
								res.status + " " + res.statusText + "\n Text: " + res.text())
			}
		})
		.then( text => {
			fetchManualAssertions(text)
			manualAssertionsLoaded = true
			document.getElementById("assertion_test_popup").style.display = "block"
		})
	} else {
		document.getElementById("assertion_test_popup").style.display = "block"
	}

	/*
		For the given CSV data of assertions, it parses them uses Papa library
		and pushes them as JSON objects in an array
	*/
	function fetchManualAssertions(allText) {
		const assertionData = Papa.parse(allText).data;
		for (let index = 1; index < assertionData.length; index++) { // 1 and not 0 since the 0th is the header
			const element = assertionData[index]
			const singleAssertionJSON = {"ID":element[0],"Status":element[1],"Comment":element[2],"Description":element[3]}
			manualAssertions.push(singleAssertionJSON)
		}

		manualAssertions.forEach( (assertion, i) => {
			const htmlrow =
				"<td style=\"padding-left: 1em;\">" + i + "</td>" +
				"<input type='hidden' value="+i+">"+
				"<td style=\"padding-left: 1em;\">" + assertion.ID + "</td>" +
				"<td>"+
				"<input type='radio' value='null' name='status"+i+"'class='indefault' checked/>null"+
				"<input type='radio' value='not-impl' name='status"+i+"'/>not-impl"+
				"<input type='radio' value='impl' name='status"+i+"'/>impl"+
				"<td style=\"padding-left: 1em;\">" + assertion.Description + "</td>"
			document.getElementById("manual_assertion_table_body").innerHTML += htmlrow
		})

		for (const inputEl of document.getElementsByTagName("input")) {
			if (inputEl.type === "radio") {
				inputEl.addEventListener("change", thisel => {
					const indexnum = thisel.srcElement.parentElement.parentElement.getElementsByTagName("input")[0].value
					manualAssertions[indexnum].Status = thisel.srcElement.value
				})
			}
		}
	}

})

document.getElementById("close_assertion_test_popup").addEventListener("click", () => {
	document.getElementById("assertion_test_popup").style.display = "none"
})

const urlAddrObject= util.getExamplesList(); // Fetching list of examples from the given array(in helperFunctions.js).
util.populateExamples(urlAddrObject);     // Loading the examples given in list from their respective URLs

document.getElementById("load_example").addEventListener("change", e => {util.exampleSelectHandler(e, {urlAddrObject})})

document.getElementById("editor_theme").addEventListener("change", () => {
	window.monaco.editor.setTheme(document.getElementById("editor_theme").value);
})

document.getElementById("btn_assertion").addEventListener("click", e => {
	util.performAssertionTest(e, manualAssertions)
})

document.getElementById("btn_validate").addEventListener("click", () => {
	util.validate("manual")
})

// document.getElementById("btn_gistify").addEventListener("click", submitAsGist)
// $("#btn_gistify").click(submitAsGist);// Attaching Function to Gistify Button, The functions handles submitting TD as Gist.

document.getElementById("btn_clearLog").addEventListener("click", util.clearLog)



//* *************************Monaco editor code*********************************////
// Load monaco editor ACM
let editor
require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], editor=function() {

	const jsonCode = [].join('\n'); // Temporary initial Json
	const modelUri = monaco.Uri.parse("a://b/foo.json"); // a made up unique URI for our model
	const model = monaco.editor.createModel(jsonCode, "json", modelUri);

	fetch("./node_modules/playground-core/td-schema.json")
	.then(res => res.json())
	.then( json => {
		const tdSchema=json;

		// configure the JSON language support with schemas and schema associations
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			// schemas: [schema] // List of schemas to validate against, It will validate the TD with in the editor area.
			schemas:[{
				fileMatch: [modelUri.toString()], // associate with our model
				schema:tdSchema
			}
			]
		});

		window.editor=monaco.editor.create(document.getElementById("monaco"), {
			model,
			contextmenu: false,
			theme:"vs"
		})

		document.getElementById("curtain").style.display = "none"

		model.onDidChangeContent(event => { // When text in the Editor changes
			util.validate("auto", autoValidate)
		})
	}, err => {
		console.error("loading TD schema for editor failed" + err)
	})
})

