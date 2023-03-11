/**
 * @file The `script.js` takes care of setting eventHandlers
 * and connecting the functionality of `util.js` with
 * the html document. Furthermore it contains the code
 * to integrate the monaco editor
 */

import * as util from "./util.js";
import * as jVis from "./jsonld-vis.js";
import * as vVis from "./vega-vis.js";

let manualAssertions = [];
let manualAssertionsLoaded = false;
let autoValidate = false;
let docType = "td";
let visType = "graph";
let urlAddrObject;

handleEditorTabs();
stringDirection.patch();

const tdRelated = [];
[].forEach.call(document.querySelectorAll(".td-related"), (el) => {
    tdRelated.push({ el, display: el.style.display });
});

const tmRelated = [];
[].forEach.call(document.querySelectorAll(".tm-related"), (el) => {
    tmRelated.push({ el, display: el.style.display });
});

document.getElementById("box_jsonld_validate").checked = true;
document.getElementById("box_reset_logging").checked = true;
document.getElementById("box_check_tm_conformance").checked = true;

document.getElementById("validation_table_head").addEventListener("click", () => {
    util.toggleValidationStatusTable();
});

// Auto validates only when the box is checked.
document.getElementById("box_auto_validate").addEventListener("change", () => {
    autoValidate = document.getElementById("box_auto_validate").checked;
});

function onDocTypeChange(outsideValue) {
    manualAssertionsLoaded = false;
    manualAssertions = [];

    if (outsideValue) {
        document.getElementById("doc_type").value = outsideValue;
    }

    docType = document.getElementById("doc_type").value;
    urlAddrObject = util.getExamplesList(docType);
    util.populateExamples(urlAddrObject);

    if (docType === "tm") {
        [].forEach.call(tdRelated, (el) => {
            el.el.style.setProperty("display", "none", "important");
        });
        [].forEach.call(tmRelated, (el) => {
            el.el.style.display = el.display;
        });
        window.editor = window.tmEditor;
        document.getElementById("td-editor").style.display = "none";
        document.getElementById("tm-editor").style.display = "block";
        document.getElementById("tm-tab").click();
    } else {
        [].forEach.call(tmRelated, (el) => {
            el.el.style.setProperty("display", "none", "important");
        });
        [].forEach.call(tdRelated, (el) => {
            el.el.style.display = el.display;
        });
        window.editor = window.tdEditor;
        document.getElementById("td-editor").style.display = "block";
        document.getElementById("tm-editor").style.display = "none";
        document.getElementById("td-tab").click();
    }
}

document.getElementById("doc_type").addEventListener("change", (_) => onDocTypeChange());

function visualize() {
    let td;
    try {
        td = JSON.parse(window.editor.getValue());
    } catch (err) {
        alert(`Incorrect JSON: ${err}`);
        return false;
    }

    if (visType === "graph") {
        document.getElementById("visualized").innerHTML = "";
        jVis.jsonldVis(td, "#visualized", {
            h: document.getElementById("visualized-wrapper").offsetHeight,
            maxLabelWidth: 200,
            scalingFactor: 5,
        });
    } else {
        vVis.vegaVis("#visualized", td);
    }

    // Alter visibility of related controls
    document.querySelectorAll(`div[class*="controls-"]`).forEach((x) => {
        if (x.classList.contains(`controls-${visType}`) || x.classList.contains("controls-all")) {
            x.style.display = "block";
        } else {
            x.style.display = "none";
        }
    });

    return true;
}

document.querySelectorAll("#graph-vis, #tree-vis").forEach((el) => {
    el.addEventListener("change", (e) => {
        visType = e.target.id.split("-")[0];
        visualize();
    });
});

document.getElementById("btn_visualize").addEventListener("click", () => {
    document.getElementById("visualized-popup-wrapper").style.display = "block";
    if (!visualize()) {
        document.getElementById("visualized-popup-wrapper").style.display = "none";
    }
});

document.getElementById("close-visualized-popup").addEventListener("click", () => {
    document.getElementById("visualized-popup-wrapper").style.display = "none";
});

document.querySelectorAll("#vis-download-svg, #vis-download-png").forEach((el) => {
    el.addEventListener("click", async (e) => {
        const idParts = e.target.id.split("-");
        const format = idParts[idParts.length - 1];

        if (visType === "graph") {
            e.preventDefault();
            if (format === "svg") {
                downloadSvg(document.querySelector("#visualized svg"), "td");
            } else {
                downloadPng(document.querySelector("#visualized svg"), "td");
            }
        } else {
            e.target.href = await window.vegaObj.view.toImageURL(format);
        }
    });
});

document.getElementById("btn_assertion_popup").addEventListener("click", () => {
    if (!manualAssertionsLoaded) {
        fetch(`./node_modules/@thing-description-playground/assertions/assertions-${docType}/manual.csv`)
            .then((res) => {
                if (res.ok) {
                    return res.text();
                } else {
                    throw new Error(
                        "Could not fetch manual assertions: \n Status:" +
                            res.status +
                            " " +
                            res.statusText +
                            "\n Text: " +
                            res.text()
                    );
                }
            })
            .then((text) => {
                fetchManualAssertions(text);
                manualAssertionsLoaded = true;
                document.getElementById("assertion_test_popup").style.display = "block";
            });
    } else {
        document.getElementById("assertion_test_popup").style.display = "block";
    }

    /*
		For the given CSV data of assertions, it parses them uses Papa library
		and pushes them as JSON objects in an array
	*/
    function fetchManualAssertions(allText) {
        const assertionData = Papa.parse(allText).data;
        for (let index = 1; index < assertionData.length; index++) {
            // 1 and not 0 since the 0th is the header
            const element = assertionData[index];
            const singleAssertionJSON = {
                ID: element[0],
                Status: element[1],
                Comment: element[2],
                Description: element[3],
            };
            manualAssertions.push(singleAssertionJSON);
        }

        if (manualAssertions.length === 0) {
            document.getElementById("manual_assertion_table_body").innerHTML = "";
        }

        manualAssertions.forEach((assertion, i) => {
            const htmlrow =
                '<td style="padding-left: 1em;">' +
                i +
                "</td>" +
                "<input type='hidden' value=" +
                i +
                ">" +
                '<td style="padding-left: 1em;">' +
                assertion.ID +
                "</td>" +
                "<td>" +
                "<input type='radio' value='null' name='status" +
                i +
                "'class='indefault' checked/>null" +
                "<input type='radio' value='not-impl' name='status" +
                i +
                "'/>not-impl" +
                "<input type='radio' value='impl' name='status" +
                i +
                "'/>impl" +
                '<td style="padding-left: 1em;">' +
                assertion.Description +
                "</td>";
            document.getElementById("manual_assertion_table_body").innerHTML += htmlrow;
        });

        for (const inputEl of document.getElementsByTagName("input")) {
            if (inputEl.type === "radio") {
                inputEl.addEventListener("change", (thisel) => {
                    const indexnum =
                        thisel.srcElement.parentElement.parentElement.getElementsByTagName("input")[0].value;
                    manualAssertions[indexnum].Status = thisel.srcElement.value;
                });
            }
        }
    }
});

document.getElementById("close_assertion_test_popup").addEventListener("click", () => {
    document.getElementById("assertion_test_popup").style.display = "none";
});

document
    .getElementById("btn_save")
    .addEventListener("click", () => util.save(docType, window.editor.getModel().getLanguageId()));

urlAddrObject = util.getExamplesList(docType); // Fetching list of examples from the given array(in helperFunctions.js).
util.populateExamples(urlAddrObject); // Loading the examples given in list from their respective URLs

document.getElementById("load_example").addEventListener("change", (e) => {
    if (docType === "td") {
        document.getElementById("td-tab").click();
    }
    util.exampleSelectHandler(e, { urlAddrObject });
});

document.getElementById("editor_theme").addEventListener("change", () => {
    window.monaco.editor.setTheme(document.getElementById("editor_theme").value);
});

document.getElementById("btn_assertion").addEventListener("click", () => {
    util.performAssertionTest(manualAssertions, docType);
});

document.getElementById("btn_validate").addEventListener("click", () => {
    util.validate("manual", undefined, docType);
});

/**
 * Implement functionality of the editor's nav tabs
 */
function handleEditorTabs() {
    const navButtons = document.getElementsByClassName("nav-link");

    for (let i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener("click", function () {
            const currentButton = document.getElementsByClassName("nav-link active");
            currentButton[0].className = currentButton[0].className.replace(" active", "");
            this.className += " active";

            const name = this.id.replace("-tab", "");
            const tabPanes = document.getElementsByClassName("tab-pane");

            if (name === "td") {
                window.activeEditorTab = "td";
                window.editor = window.tdEditor;
                document.getElementById("btn_save").disabled = false;
            }

            if (name === "tm") {
                window.activeEditorTab = "tm";
                window.editor = window.tmEditor;
                document.getElementById("btn_save").disabled = false;
            }

            if (name === "open-api") {
                window.activeEditorTab = "open-api";
                window.editor = window.openApiEditor;
                document.getElementById("btn_save").disabled = true;
                util.generateOAP(window.editorFormat);
                enableFormatButtons();
            }

            if (name === "async-api") {
                window.activeEditorTab = "async-api";
                document.getElementById("btn_save").disabled = true;
                window.editor = window.asyncApiEditor;
                util.generateAAP(window.editorFormat);
                enableFormatButtons();
            }

            for (let j = 0; j < tabPanes.length; j++) {
                if (name === tabPanes[j].id) {
                    tabPanes[j].className += " show active";
                } else {
                    tabPanes[j].className = tabPanes[j].className.replace(" show active", "");
                }
            }

            const editors = document.getElementsByClassName("editor");
            for (let k = 0; k < editors.length; k++) {
                const editorName = `${name}-editor`;
                if (editorName === editors[k].id) {
                    editors[k].style.display = "block";
                    editors[k].style.height = "100%";
                } else {
                    editors[k].style.display = "none";
                }
            }
        });
    }
}

document.getElementById("btn_clearLog").addEventListener("click", util.clearLog);

document.getElementById("btn_defaults_add").addEventListener("click", () => {
    document.getElementById("td-tab").click();
    util.addDefaults();
});
document.getElementById("btn_defaults_remove").addEventListener("click", () => {
    document.getElementById("td-tab").click();
    util.removeDefaults();
});

document.getElementById("editor-print-btn").addEventListener("click", () => {
    const contentType = `application/${window.editorFormat};charset=utf-8;`;

    // Until TD/TM supports YAML
    if (window.editor === window.tdEditor || window.editor === window.tmEditor) {
        util.offerFileDownload(`${window.activeEditorTab}.json`, window.editor.getModel().getValue(), contentType);
    } else {
        util.offerFileDownload(
            `${window.activeEditorTab}.${window.editorFormat}`,
            window.editor.getModel().getValue(),
            contentType
        );
    }
});

document.getElementById("json-format-btn").addEventListener("click", (e) => {
    if (!e.currentTarget.classList.contains("active")) {
        const button = document.getElementById("yaml-format-btn");
        button.classList.toggle("active");
        e.currentTarget.classList.toggle("active");
        enableJsonOnlyElements();

        window.editorFormat = "json";
        util.generateTD(window.editorFormat);
        util.generateOAP(window.editorFormat);
        util.generateAAP(window.editorFormat);
    }
});

let yamlFormatBtnClickCount = 0;

document.getElementById("yaml-format-btn").addEventListener("click", (e) => {
    if (!e.currentTarget.classList.contains("active")) {
        try {
            if (window.editor === window.tdEditor) {
                JSON.parse(window.editor.getModel().getValue());
            }
        } catch (err) {
            alert("TD is not a valid JSON!");
            e.currentTarget.blur();
            return;
        }

        if (yamlFormatBtnClickCount === 0 && window.editor === window.tdEditor) {
            alert(
                "YAML conversion for TD is still experimental. " +
                    "If you want to convert your TD to YAML format, please click YAML button again."
            );
            yamlFormatBtnClickCount++;
            e.currentTarget.blur();
            return;
        }

        yamlFormatBtnClickCount = 0;
        const button = document.getElementById("json-format-btn");
        button.classList.toggle("active");
        e.currentTarget.classList.toggle("active");
        disableJsonOnlyElements();

        window.editorFormat = "yaml";
        util.generateTD(window.editorFormat);
        util.generateOAP(window.editorFormat);
        util.generateAAP(window.editorFormat);
    }
});

document.getElementById("btn_formatDocument").addEventListener("click", (e) => {
    formatDocument();
});

/**
 * Enable html elements with class jsonOnly
 */
function enableJsonOnlyElements() {
    document.querySelectorAll(".jsonOnly").forEach((e) => {
        e.disabled = false;
    });
}

/**
 * Disable html elements with class jsonOnly
 */
function disableJsonOnlyElements() {
    document.querySelectorAll(".jsonOnly").forEach((e) => {
        e.disabled = true;
    });
}

/**
 * Enable format selection buttons
 */
function enableFormatButtons() {
    const jsonBtn = document.getElementById("json-format-btn");
    const yamlBtn = document.getElementById("yaml-format-btn");

    if (jsonBtn.classList.contains("disabled")) {
        jsonBtn.classList.toggle("disabled");
    }

    if (yamlBtn.classList.contains("disabled")) {
        yamlBtn.classList.toggle("disabled");
    }
}

/**
 * Enable Open/Async API elements according to the protocol schemes of a TD
 * @param {string} td TD string to check protocols and do enabling accordingly
 */
function enableAPIConversionWithProtocol(td) {
    if (window.editorFormat === "yaml") {
        td = Validators.convertTDYamlToJson(td);
    }

    const protocolSchemes = Validators.detectProtocolSchemes(td);

    if (protocolSchemes) {
        const openApiTab = document.getElementById("open-api-tab");

        if (["http", "https"].some((p) => protocolSchemes.includes(p))) {
            openApiTab.disabled = false;
            openApiTab.title = "";
        } else {
            openApiTab.disabled = true;
            openApiTab.title = "Please insert a TD which uses HTTP";
        }

        const asyncApiTab = document.getElementById("async-api-tab");

        if (["mqtt", "mqtts"].some((p) => protocolSchemes.includes(p))) {
            asyncApiTab.disabled = false;
            asyncApiTab.title = "";
        } else {
            asyncApiTab.disabled = true;
            asyncApiTab.title = "Please insert a TD which uses MQTT";
        }
    }
}

function formatDocument() {
    window.editor.getAction("editor.action.formatDocument").run();
}

//* *************************Monaco editor code*********************************////
// Load monaco editor ACM
require.config({ paths: { vs: "./node_modules/monaco-editor/min/vs" } });
require(["vs/editor/editor.main"], async function () {
    // Determine new doc type and editor value if present as exported URL
    const value = util.getEditorValue(window.location.hash.substring(1));
    const newDocType = value.substring(0, 2);
    window.editorFormat = value ? value.substring(2, 6) : "json";

    if (window.editorFormat === "yaml") {
        const jsonBtn = document.getElementById("json-format-btn");
        const yamlBtn = document.getElementById("yaml-format-btn");

        jsonBtn.classList.toggle("active");
        yamlBtn.classList.toggle("active");

        disableJsonOnlyElements();
    }

    docType = newDocType;
    onDocTypeChange(docType);

    // Create globally available TD editor
    window.tdEditor = monaco.editor.create(document.getElementById("td-editor"), {
        value: docType === "td" ? value.substring(6) : "",
        language: window.editorFormat,
        // Without automaticLayout editor will not be built inside hidden div
        automaticLayout: true,
        formatOnPaste: true,
    });

    // Create globally available TM editor
    window.tmEditor = monaco.editor.create(document.getElementById("tm-editor"), {
        value: docType === "tm" ? value.substring(6) : "",
        language: "json",
        automaticLayout: true,
        formatOnPaste: true,
    });

    // Create globally available Open API editor
    window.openApiEditor = monaco.editor.create(document.getElementById("open-api-editor"), {
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true,
    });

    // Create globally available Async API editor
    window.asyncApiEditor = monaco.editor.create(document.getElementById("async-api-editor"), {
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true,
    });

    window.editor = docType === "td" ? window.tdEditor : window.tmEditor;
    document.getElementById("curtain").style.display = "none";

    if (docType === "td") {
        enableAPIConversionWithProtocol(window.editor.getModel().getValue());
    }

    const models = [window.tdEditor.getModel(), window.tmEditor.getModel()];

    formatDocument();

    models.forEach((model) => {
        model.onDidChangeContent((_) => {
            if (model === window.tdEditor.getModel()) {
                enableAPIConversionWithProtocol(model.getValue());
            }

            markTypos(model);
            util.validate("auto", autoValidate, docType);
        });
    });

    const tdSchema = await (await fetch("./node_modules/@thing-description-playground/core/td-schema.json")).json();
    const tmSchema = await (await fetch("./node_modules/@thing-description-playground/core/tm-schema.json")).json();

    // Configure JSON language support with schemas and schema associations
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
            {
                fileMatch: [models[0].uri.toString()],
                schema: tdSchema,
                uri: "file:///td-schema.json",
            },
            {
                fileMatch: [models[1].uri.toString()],
                schema: tmSchema,
                uri: "file:///tm-schema.json",
            },
        ],
    });
});

/**
 * Marks the possible typos on the editor
 * @param {object} model The model that represents the loaded Monaco editor
 */
function markTypos(model) {
    const markers = [];

    JsonSpellChecker.configure();
    const typos = JsonSpellChecker.checkTypos(model.getValue());

    typos.forEach((typo) => {
        markers.push({
            message: typo.message,
            severity: monaco.MarkerSeverity.Warning,
            startLineNumber: typo.startLineNumber,
            startColumn: typo.startColumn,
            endLineNumber: typo.endLineNumber,
            endColumn: typo.endColumn,
        });
    });

    monaco.editor.setModelMarkers(model, "typo", markers);
}
