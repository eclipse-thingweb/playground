/**
 * @file The `script.js` takes care of setting eventHandlers
 * and connecting the functionality of `util.js` with
 * the html document. Furthermore it contains the code
 * to integrate the monaco editor
 */

import * as util from "./util.js"
import * as jVis from "./jsonld-vis.js"
import * as vVis from "./vega-vis.js"

let manualAssertions = []
let manualAssertionsLoaded = false
const results = []
let autoValidate = false
let docType = "td"
let visType = "graph"
let urlAddrObject

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

function visualize() {
	let td;
	try {
		td = JSON.parse(window.editor.getValue());
	} catch (err) { 
		alert(`Incorrect JSON: ${err}`);
		return false;
	 }

	if (visType == 'graph') {
		document.getElementById('visualized').innerHTML = '';
		jVis.jsonldVis(
			td,
			'#visualized',
			{
				maxLabelWidth: 200,
				scalingFactor: 5
			}
		);

	} else {
		vVis.vegaVis('#visualized', td);

		// Move bindings to controls panel
		// Needs to be run on the next iteration of the event loop
		// Thus, wrapped with zero timeout
		setTimeout(() => {
			const $bindings = document.querySelector('form.vega-bindings');
			const $wrapper = document.getElementById('vega-bindings-wrapper');
			$wrapper.innerHTML = '';
			$wrapper.appendChild($bindings);
		}, 0);
	}

	// Alter visibility of related controls
	document.querySelectorAll(`div[class*="controls-"]`).forEach(x => {
		if (x.classList.contains(`controls-${visType}`) || x.classList.contains('controls-all')) {
			x.style.display = 'block';
		} else {
			x.style.display = 'none';
		}
	});

	return true;
}

document.querySelectorAll('#graph-vis, #tree-vis').forEach(el => {
	el.addEventListener('change', (e) => {
		visType = e.target.id.split('-')[0];
		visualize();
	});
});

document.getElementById("btn_visualize").addEventListener('click', () => {
	if (visualize()) document.getElementById('visualized-popup-wrapper').style.display = 'block';
});

document.getElementById('close-visualized-popup').addEventListener('click', () => {
	document.getElementById('visualized-popup-wrapper').style.display = 'none';
});

document.querySelectorAll('#vis-download-svg, #vis-download-png').forEach(el => {
	el.addEventListener('click', async (e) => {
		const idParts = e.target.id.split('-');
		const format = idParts[idParts.length - 1];

		if (visType === 'graph') {
			e.preventDefault();
			if (format === 'svg') {
				downloadSvg(document.querySelector('#visualized svg'), 'td');
			} else {
				downloadPng(document.querySelector('#visualized svg'), 'td');
			}
		} else {
			e.target.href = await window.vegaObj.view.toImageURL(format);
		}
	});
});

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

document.getElementById('btn_save').addEventListener('click', () => util.save(docType))

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
require(['vs/editor/editor.main'], async function () {
	// Create globally available TD editor
	const value = util.getEditorValue(window.location.hash.substring(1));
	window.tdEditor = monaco.editor.create(document.getElementById('td-editor'), {
		value: (value.substring(0, 2) === 'td') ? value.substring(2) : '',
		language: 'json'
	});

	// Create globally available TM editor
	window.tmEditor = monaco.editor.create(document.getElementById('tm-editor'), {
		value: (value.substring(0, 2) === 'tm') ? value.substring(2) : '',
		language: 'json',
		// Without automaticLayout editor will not be built inside hidden div
		automaticLayout: true
	});

	window.editor = window.tdEditor;
	document.getElementById('curtain').style.display = 'none';

	const models = [
		window.tdEditor.getModel(),
		window.tmEditor.getModel()
	];

	models.forEach(model => {
		model.onDidChangeContent(_ => {
			markTypos(model);
			util.validate('auto', autoValidate, docType);
		});
	});

	const tdSchema = await (await fetch('./node_modules/@thing-description-playground/core/td-schema.json')).json();
	const tmSchema = await (await fetch('./node_modules/@thing-description-playground/core/tm-schema.json')).json();

	// Configure JSON language support with schemas and schema associations
	monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
		validate: true,
		schemas: [
			{
				fileMatch: [models[0].uri.toString()],
				schema: tdSchema,
				uri: 'file:///td-schema.json'
			},
			{
				fileMatch: [models[1].uri.toString()],
				schema: tmSchema,
				uri: 'file:///tm-schema.json'
			}
		]
	});
});

/**
 * Marks the possible typos on the editor
 * @param {object} model The model that represents the loaded Monaco editor
 */
function markTypos(model) {
	const markers = []

	const typos = Validators.checkTypos(model.getValue())
	const foundTypos = []

	typos.forEach(typo => {
		model.findMatches(typo.word, false, false, true, typo.word, false).forEach(result => {
			foundTypos.push({
				range: result.range,
				message: typo.message
			})
		})
	})

	foundTypos.forEach(typo => {
		const range = typo.range

		markers.push({
			message: typo.message,
			severity: monaco.MarkerSeverity.Warning,
			startLineNumber: range.startLineNumber,
			startColumn: range.startColumn,
			endLineNumber: range.endLineNumber,
			endColumn: range.endColumn
		})
	})

	monaco.editor.setModelMarkers(model, 'typo', markers)
}