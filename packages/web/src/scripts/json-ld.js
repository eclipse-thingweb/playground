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
 * @file The `json-ld.js` takes care of the main functionality for the
 * JSON-LD tab within the console. This includes initializing a dedicated
 * Monaco editor, the format filter buttons (expanded, compacted, flattened,
 * framed, N-Quads), and the download option.
 */

import { editor } from "monaco-editor";
import { setFontSize, editorForm, fontSizeSlider } from "./settings-menu";
import { generateJsonLd, offerFileDownload } from "./util";
import { editorList, getEditorData } from "./editor";

/******************************************************************/
/*                    JSON-LD functionality                       */
/******************************************************************/

// JSON-LD Elements
export const jsonLdTab = document.querySelector(".jsonld-tab-btn");
export const jsonLdView = document.querySelector("#jsonld-view");
const jsonLdDownload = document.querySelector("#jsonld-download");

/**
 * Initialize the Monaco editor for the JSON-LD feature
 */
async function initJsonLdEditor() {
    window.jsonLdEditor = editor.create(document.getElementById("jsonld-container"), {
        value: "",
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true,
    });

    document.onload = setFontSize(window.jsonLdEditor);
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.jsonLdEditor);
    });

    editorForm.addEventListener("reset", () => {
        setFontSize(window.jsonLdEditor);
    });
}

initJsonLdEditor();

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
}

Object.keys(formatButtons).forEach((format) => {
    if (formatButtons[format]) {
        formatButtons[format].addEventListener("click", async () => {
            const activeIDE = editorList.find((ide) => ide["_domElement"].classList.contains("active"));
            if (!activeIDE) return;

            const isAlreadyActive = formatButtons[format].classList.contains("active-format");

            try {
                if (isAlreadyActive) {
                    // Toggle OFF - clear the editor
                    updateFormatButtonStates(null);
                    window.jsonLdEditor.getModel().setValue("");
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

// Download btn
jsonLdDownload.addEventListener("click", () => {
    const editorData = getEditorData(window.jsonLdEditor);
    const contentType = `application/${editorData[0]};charset=utf-8;`;
    const title = "jsonld-output";

    offerFileDownload(
        `${title}.${editorData[0]}`,
        window.jsonLdEditor.getModel().getValue(),
        contentType
    );
});
