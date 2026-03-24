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
 * @file The `open-api.js` takes care of the main functionality for the
 * OpenAPI feature within the console. This include initializing the editor,
 * connecting it to the local storage, as well as the main buttons within the OpenAPI
 * feature such as json, yaml conversion and the download option.
 */

import { editor } from "monaco-editor";
import { setFontSize, editorForm, fontSizeSlider } from "./settings-menu";
import { generateTD, offerFileDownload, generateJsonLd, generateOAP } from "./util";
import { getEditorData, editorList } from "./editor";

/******************************************************************/
/*                    OpenAPI functionality                       */
/******************************************************************/

//OpenAPI Elements
export const openApiTab = document.querySelector(".api-tab-btn");
export const openApiJsonBtn = document.querySelector("#open-api-json");
export const openApiYamlBtn = document.querySelector("#open-api-yaml");
export const openApiView = document.querySelector("#open-api-view");
const openApiDownload = document.querySelector("#open-api-download");

/**
 * Initialize the monaco editor for the OpenAPI feature, sets it to an empty value,
 * a default language of json and as a read only document. Also it connects the editor
 * to the local storage to change the fontsize correspondingly
 */
async function initOpenApiEditor() {
    window.openApiEditor = editor.create(document.getElementById("open-api-container"), {
        value: "",
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true,
    });

    document.onload = setFontSize(window.openApiEditor);
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.openApiEditor);
    });

    //Bind the reset button form the settings to the editor and assign the specified font size
    editorForm.addEventListener("reset", () => {
        setFontSize(window.openApiEditor);
    });
}

initOpenApiEditor();

//Json conversion btn
openApiJsonBtn.addEventListener("click", () => {
    const hasActiveFormat = Object.values(formatButtons).some((btn) => btn && btn.classList.contains("active-format"));
    const activeIDE = editorList.find((ide) => ide["_domElement"].classList.contains("active"));

    if (hasActiveFormat && activeIDE) {
        updateFormatButtonStates(null);
        generateOAP("json", activeIDE);
    } else {
        generateTD("json", window.openApiEditor);
    }
    openApiJsonBtn.disabled = true;
    openApiYamlBtn.disabled = false;
});

//Yaml conversion btn
openApiYamlBtn.addEventListener("click", () => {
    const hasActiveFormat = Object.values(formatButtons).some((btn) => btn && btn.classList.contains("active-format"));
    const activeIDE = editorList.find((ide) => ide["_domElement"].classList.contains("active"));

    if (hasActiveFormat && activeIDE) {
        updateFormatButtonStates(null);
        generateOAP("yaml", activeIDE);
    } else {
        generateTD("yaml", window.openApiEditor);
    }
    openApiJsonBtn.disabled = false;
    openApiYamlBtn.disabled = true;
});

//Download btn
openApiDownload.addEventListener("click", () => {
    const editorData = getEditorData(window.openApiEditor);
    const contentType = `application/${editorData[0]};charset=utf-8;`;
    const title = editorData[2]["info"] ? editorData[2]["info"]["title"] : editorData[2]["title"] || "output";
    const visualizationName = title.replace(/\s/g, "-");

    offerFileDownload(
        `${visualizationName}-OpenAPI.${editorData[0]}`,
        window.openApiEditor.getModel().getValue(),
        contentType
    );
});

// Format Filters logic
const formatButtons = {
    expanded: document.querySelector("#format-expanded"),
    compacted: document.querySelector("#format-compacted"),
    flattened: document.querySelector("#format-flattened"),
    framed: document.querySelector("#format-framed"),
    nquads: document.querySelector("#format-nquads"),
};

function updateFormatButtonStates(activeFormat) {
    Object.keys(formatButtons).forEach(format => {
        if (formatButtons[format]) {
            if (format === activeFormat) {
                formatButtons[format].classList.add("active-format");
                formatButtons[format].style.backgroundColor = "var(--clr-primary-500)";
                formatButtons[format].style.color = "var(--clr-neutral-50)";
                formatButtons[format].style.border = "none";
            } else {
                formatButtons[format].classList.remove("active-format");
                formatButtons[format].style.backgroundColor = "transparent";
                formatButtons[format].style.color = "var(--clr-primary-500)";
                formatButtons[format].style.border = "2px solid var(--clr-primary-500)";
            }
        }
    });
    if (activeFormat) {
        if (activeFormat === "nquads") {
            openApiJsonBtn.disabled = false;
            openApiYamlBtn.disabled = false;
        } else {
            // Expanded, compacted, flattened, framed are JSON formats
            openApiJsonBtn.disabled = true;
            openApiYamlBtn.disabled = false;
        }
    }
}

Object.keys(formatButtons).forEach((format) => {
    if (formatButtons[format]) {
        formatButtons[format].addEventListener("click", async () => {
            const activeIDE = editorList.find((ide) => ide["_domElement"].classList.contains("active"));
            if (!activeIDE) return;

            const isAlreadyActive = formatButtons[format].classList.contains("active-format");

            try {
                if (isAlreadyActive) {
                    // Clicked again - Toggle OFF (Revert to OpenAPI)
                    updateFormatButtonStates(null); // Clear all active states
                    const fileType = activeIDE["_domElement"].dataset.modeId;
                    await generateOAP(fileType, activeIDE);

                    // Restore JSON/YAML toggles based on IDE fileType
                    if (fileType === "yaml") {
                        openApiJsonBtn.disabled = false;
                        openApiYamlBtn.disabled = true;
                    } else {
                        openApiJsonBtn.disabled = true;
                        openApiYamlBtn.disabled = false;
                    }
                } else {
                    // Toggle ON
                    await generateJsonLd(format, activeIDE);
                    updateFormatButtonStates(format);
                }
            } catch (err) {
                console.error("Failed to toggle format filter:", err);
                alert("Conversion error: " + err);
            }
        });
    }
});
