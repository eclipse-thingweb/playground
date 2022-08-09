/**
 * @file The `script.js` takes care of setting eventHandlers
 * and connecting the functionality of `util.js` with
 * the html document. Furthermore it contains the code
 * to integrate the monaco editor
 */

import * as util from "./util.js"
import * as config from "./config.js"

let manualAssertions = []
let manualAssertionsLoaded = false
const results = []
let autoValidate = false
let docType = "td"
let urlAddrObject
const jsonOptions = {
	validate: true,
	schemas: []
}

const tdRelated = [];
[].forEach.call(document.querySelectorAll('.td-related'), el => {
	tdRelated.push({"el": el, "display": el.style.display})
})

document.getElementById("box_jsonld_validate").checked = true
document.getElementById("box_reset_logging").checked = true

document.getElementById("validation_table_head").addEventListener("click", ()=>{
	util.toggleValidationStatusTable()
})

// Auto validates only when the box is checked.
document.getElementById("box_auto_validate").addEventListener("change", () => {
	autoValidate = document.getElementById("box_auto_validate").checked
})

document.getElementById("doc_type").addEventListener("change", () => {
	manualAssertionsLoaded = false
	manualAssertions = []
	docType = document.getElementById("doc_type").value
	urlAddrObject = util.getExamplesList(docType);
	util.populateExamples(urlAddrObject);

	if (docType == 'tm') {
		[].forEach.call(tdRelated, el => {
			el["el"].style.display = "none"
		})
		window.editor = window.tmEditor
		document.getElementById("td-editor").style.display = "none"
		document.getElementById("tm-editor").style.display = "block"
	} else {
		[].forEach.call(tdRelated, el => {
			el["el"].style.display = el["display"]
		})
		window.editor = window.tdEditor
		document.getElementById("td-editor").style.display = "block"
		document.getElementById("tm-editor").style.display = "none"
	}
})

document.getElementById("btn_gistify").addEventListener("click", () => {
	if (window.editor.getValue() === "") {
		alert("Please paste a TD before submission")
	}
	else {
		document.getElementById("gist_popup").style.display = "block"
	}
})

document.getElementById("btn_gist").addEventListener("click", () => {
	let name = document.getElementById("textName").value
	const description = document.getElementById("textDescription").value
	const td = window.editor.getValue().replace(/\t/g, "    ") /* replace tabs with spaces */
	if (name === "") {
		name = "WoT Playground Gist"
	}


	util.submitAsGist(name, description, td, config.gistBackendUrl).then( gistLink => {
		document.getElementById("gistSuccess").innerText = "Submission successful!"
		document.getElementById("gistSuccess").style.color = "rgb(28, 184, 65)"
		document.getElementById("gistSuccess").style.display = "inline"
		document.getElementById("gistLink").href = gistLink
		document.getElementById("gistLink").innerText = gistLink
		document.getElementById("gistLink").style.display = "inline"
	}, err => {
		console.error(err)
		document.getElementById("gistSuccess").style.color = "rgb(202, 60, 60)"
		document.getElementById("gistSuccess").innerText = "Gist could not be submitted!"
		document.getElementById("gistSuccess").style.display = "inline"
	})
})

document.getElementById("close_gist_popup").addEventListener("click", () => {
	document.getElementById("gist_popup").style.display = "none"
	document.getElementById("gistSuccess").style.display = "none"
	document.getElementById("gistLink").style.display = "none"
})

document.getElementById("btn_assertion_popup").addEventListener("click", () => {
	if (!manualAssertionsLoaded) {
		fetch(`./node_modules/@thing-description-playground/assertions/assertions-${docType}/manual.csv`)
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

		if (manualAssertions.length == 0) {
			document.getElementById("manual_assertion_table_body").innerHTML = ''
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

urlAddrObject = util.getExamplesList(docType);  // Fetching list of examples from the given array(in helperFunctions.js).
util.populateExamples(urlAddrObject);  // Loading the examples given in list from their respective URLs

document.getElementById("load_example").addEventListener("change", e => {util.exampleSelectHandler(e, {urlAddrObject})})

document.getElementById("editor_theme").addEventListener("change", () => {
	window.monaco.editor.setTheme(document.getElementById("editor_theme").value);
})

document.getElementById("btn_assertion").addEventListener("click", () => {
	util.performAssertionTest(manualAssertions, docType)
})

document.getElementById("btn_validate").addEventListener("click", () => {
	util.validate("manual", undefined, docType)
})

document.getElementById("btn_clearLog").addEventListener("click", util.clearLog)

document.getElementById("btn_oap_json").addEventListener("click", () => {
	util.generateOAP("json").catch(err => {alert(err)})
})

document.getElementById("btn_oap_yaml").addEventListener("click", () => {
	util.generateOAP("yaml").catch(err => {alert(err)})
})

document.getElementById("btn_aap_json").addEventListener("click", () => {
	util.generateAAP("json").catch(err => {alert(err)})
})

document.getElementById("btn_aap_yaml").addEventListener("click", () => {
	util.generateAAP("yaml").catch(err => {alert(err)})
})

document.getElementById("btn_defaults_add").addEventListener("click", util.addDefaults)
document.getElementById("btn_defaults_remove").addEventListener("click", util.removeDefaults)




//* *************************Monaco editor code*********************************////
// Load monaco editor ACM
require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], window.tdEditor=function() {

	const jsonCode = [].join('\n'); // Temporary initial Json
	const modelUri = monaco.Uri.parse("a://b/foo.json"); // a made up unique URI for our model
	const model = monaco.editor.createModel(jsonCode, "json", modelUri);

	fetch("./node_modules/@thing-description-playground/core/td-schema.json")
	.then(res => res.json())
	.then( json => {
		const tdSchema=json;
		jsonOptions['schemas'].push({
			fileMatch: [modelUri.toString()], // associate with our model
			schema: tdSchema
		})

		// configure the JSON language support with schemas and schema associations
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions(jsonOptions);

		window.tdEditor=monaco.editor.create(document.getElementById("td-editor"), {
			model,
			contextmenu: false,
			theme:"vs"
		})

		document.getElementById("curtain").style.display = "none"

		model.onDidChangeContent(event => { // When text in the Editor changes
			util.validate("auto", autoValidate, docType)
		})

		window.editor = window.tdEditor
	}, err => {
		console.error("loading TD schema for editor failed" + err)
	})
})

require(['vs/editor/editor.main'], async function () {
	window.tmEditor = monaco.editor.create(document.getElementById('tm-editor'), {
	  language: 'json',
	  // Without automaticLayout editor will not be built inside hidden div
	  automaticLayout: true
	});

	window.tmEditor.getModel().onDidChangeContent(_ => {
		util.validate("auto", autoValidate, docType)
	});

	const schema = await fetch("./node_modules/@thing-description-playground/core/tm-schema.json");
	const schemaJson = await schema.json();
	jsonOptions['schemas'].push({
		fileMatch: [window.tmEditor.getModel().uri.toString()],
		schema: schemaJson
	});

	monaco.languages.json.jsonDefaults.setDiagnosticsOptions(jsonOptions);
  });
