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
 * @file The `code-gen.js` handles the Code Generation tab in the console.
 * It provides input fields for language, library, affordance type, affordance key,
 * and operation, then generates code or a prompt using the code-gen package logic.
 */

import { editor } from "monaco-editor";
import { setFontSize, editorForm, fontSizeSlider } from "./settings-menu";
import { generateCode, LANGUAGES_SUPPORT, AFFORDANCE_TYPES, OPERATIONS } from "@thingweb/code-gen";
import { copyToClipboard } from "./util";

/******************************************************************/
/*                    DOM Elements                                */
/******************************************************************/

export const codeGenView = document.querySelector("#code-gen-view");

const languageSelect = document.querySelector("#code-gen-language");
const languageCustomInput = document.querySelector("#code-gen-language-custom");
const librarySelect = document.querySelector("#code-gen-library");
const libraryCustomInput = document.querySelector("#code-gen-library-custom");
const affordanceTypeSelect = document.querySelector("#code-gen-affordance-type");
const affordanceKeySelect = document.querySelector("#code-gen-affordance-key");
const operationSelect = document.querySelector("#code-gen-operation");
const generateBtn = document.querySelector("#code-gen-generate");
const codeGenDownload = document.querySelector("#code-gen-download");
const codeGenCopy = document.querySelector("#code-gen-copy");

/******************************************************************/
/*                    Editor initialization                        */
/******************************************************************/

async function initCodeGenEditor() {
    window.codeGenEditor = editor.create(document.getElementById("code-gen-editor-container"), {
        value: "",
        language: "javascript",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true,
    });

    document.onload = setFontSize(window.codeGenEditor);
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.codeGenEditor);
    });
    editorForm.addEventListener("reset", () => {
        setFontSize(window.codeGenEditor);
    });

    window.codeGenEditor.getModel().onDidChangeContent(() => {
        codeGenCopy.disabled = !window.codeGenEditor.getValue();
    });
}

initCodeGenEditor();
codeGenCopy.disabled = true;

/******************************************************************/
/*                    Populate dropdowns                           */
/******************************************************************/

function setDisabledWithPlaceholder(selectEl, text) {
    selectEl.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = text;
    placeholder.disabled = true;
    placeholder.selected = true;
    selectEl.appendChild(placeholder);
    selectEl.disabled = true;
}

function populateLanguages() {
    languageSelect.innerHTML = "";
    Object.keys(LANGUAGES_SUPPORT).forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });
    const otherOption = document.createElement("option");
    otherOption.value = "__other__";
    otherOption.textContent = "Other";
    languageSelect.appendChild(otherOption);
    languageCustomInput.classList.add("hidden");
    populateLibraries();
}

function populateLibraries() {
    const lang = languageSelect.value;
    librarySelect.innerHTML = "";
    librarySelect.disabled = false;
    const libs = LANGUAGES_SUPPORT[lang] ? Object.keys(LANGUAGES_SUPPORT[lang].libraries) : [];
    libs.forEach((lib) => {
        const option = document.createElement("option");
        option.value = lib;
        option.textContent = lib;
        librarySelect.appendChild(option);
    });
    const otherOption = document.createElement("option");
    otherOption.value = "__other__";
    otherOption.textContent = "Other";
    librarySelect.appendChild(otherOption);

    if (librarySelect.value === "__other__") {
        libraryCustomInput.classList.remove("hidden");
    } else {
        libraryCustomInput.classList.add("hidden");
    }
}

function populateAffordanceTypes() {
    affordanceTypeSelect.innerHTML = "";
    AFFORDANCE_TYPES.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        affordanceTypeSelect.appendChild(option);
    });
    populateAffordanceKeys();
}

function populateAffordanceKeys() {
    const td = currentTD;
    const type = affordanceTypeSelect.value;
    affordanceKeySelect.innerHTML = "";

    const keys = td && td[type] ? Object.keys(td[type]) : [];
    if (keys.length === 0) {
        setDisabledWithPlaceholder(affordanceKeySelect, "No " + type + " found");
    } else {
        affordanceKeySelect.disabled = false;
        keys.forEach((key) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key;
            affordanceKeySelect.appendChild(option);
        });
    }
    populateOperations();
}

function populateOperations() {
    const td = currentTD;
    const type = affordanceTypeSelect.value;
    const key = affordanceKeySelect.value;
    operationSelect.innerHTML = "";

    // Get the full set of candidate operations for this affordance type
    let candidateOps = [];
    if (type === "properties") candidateOps = OPERATIONS.property;
    else if (type === "actions") candidateOps = OPERATIONS.action;
    else if (type === "events") candidateOps = OPERATIONS.event;

    // Filter to only operations that exist in the affordance's forms
    const forms = td?.[type]?.[key]?.forms;
    let ops = [];
    if (forms && forms.length > 0) {
        const formOps = new Set();
        forms.forEach((form) => {
            if (Array.isArray(form.op)) {
                form.op.forEach((o) => formOps.add(o));
            } else if (form.op) {
                formOps.add(form.op);
            }
        });

        if (formOps.size > 0) {
            ops = candidateOps.filter((o) => formOps.has(o));
        } else {
            // No op declared — use TD spec defaults per affordance type
            if (type === "properties") ops = ["readproperty", "writeproperty"];
            else if (type === "actions") ops = ["invokeaction"];
            else if (type === "events") ops = ["subscribeevent", "unsubscribeevent"];
        }
    }

    if (ops.length === 0) {
        setDisabledWithPlaceholder(operationSelect, "No operations available");
    } else {
        operationSelect.disabled = false;
        ops.forEach((op) => {
            const option = document.createElement("option");
            option.value = op;
            option.textContent = op;
            operationSelect.appendChild(option);
        });
    }
}

/******************************************************************/
/*                    Initialize & Event Handlers                  */
/******************************************************************/

let currentTD = null;

export function initCodeGen(td) {
    currentTD = td;
    populateLanguages();
    populateAffordanceTypes();
    populateAffordanceKeysFromTD(td);
}

function populateAffordanceKeysFromTD(td) {
    const type = affordanceTypeSelect.value;
    affordanceKeySelect.innerHTML = "";

    const keys = td && td[type] ? Object.keys(td[type]) : [];
    if (keys.length === 0) {
        setDisabledWithPlaceholder(affordanceKeySelect, "No " + type + " found");
    } else {
        affordanceKeySelect.disabled = false;
        keys.forEach((key) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key;
            affordanceKeySelect.appendChild(option);
        });
    }
    populateOperations();
}

languageSelect.addEventListener("change", () => {
    if (languageSelect.value === "__other__") {
        languageCustomInput.classList.remove("hidden");
    } else {
        languageCustomInput.classList.add("hidden");
    }
    populateLibraries();
});

librarySelect.addEventListener("change", () => {
    if (librarySelect.value === "__other__") {
        libraryCustomInput.classList.remove("hidden");
    } else {
        libraryCustomInput.classList.add("hidden");
    }
});

affordanceTypeSelect.addEventListener("change", () => {
    populateAffordanceKeys();
});

affordanceKeySelect.addEventListener("change", () => {
    populateOperations();
});

codeGenDownload.disabled = true;

//Copy btn
codeGenCopy.addEventListener("click", () => {
    copyToClipboard(window.codeGenEditor.getValue(), codeGenCopy);
});

generateBtn.addEventListener("click", () => {
    codeGenDownload.disabled = true;
    const td = currentTD;
    if (!td) {
        window.codeGenEditor.getModel().setValue("// Error: No valid TD found in the editor");
        return;
    }

    const language = languageSelect.value === "__other__" ? languageCustomInput.value.trim() : languageSelect.value;
    const library = librarySelect.value === "__other__" ? libraryCustomInput.value.trim() : librarySelect.value;
    const affordanceType = affordanceTypeSelect.value;
    const affordanceKey = affordanceKeySelect.value;
    const operation = operationSelect.value;

    if (!language) {
        window.codeGenEditor.getModel().setValue("// Error: Please enter a language name");
        return;
    }

    if (!library) {
        window.codeGenEditor.getModel().setValue("// Error: Please enter a library name");
        return;
    }

    if (!affordanceKey) {
        window.codeGenEditor.getModel().setValue(`// Error: No ${affordanceType} found in the TD`);
        return;
    }

    try {
        const result = generateCode({
            td,
            language,
            library,
            affordanceType,
            affordanceKey,
            operation,
        });

        if (result.code) {
            const langId = getMonacoLanguage(language);
            const model = window.codeGenEditor.getModel();
            editor.setModelLanguage(model, langId);
            model.setValue(result.code);
            codeGenDownload.disabled = false;
        } else if (result.prompt) {
            const model = window.codeGenEditor.getModel();
            editor.setModelLanguage(model, "plaintext");
            model.setValue(result.prompt);
        }
    } catch (err) {
        window.codeGenEditor.getModel().setValue(`// Error: ${err.message}`);
    }
});

function getMonacoLanguage(language) {
    const langMap = {
        javascript: "javascript",
        python: "python",
        java: "java",
        rust: "rust",
        go: "go",
        "c#": "csharp",
        php: "php",
        ruby: "ruby",
        dart: "dart",
    };
    return langMap[language] || "plaintext";
}

codeGenDownload.addEventListener("click", () => {
    const value = window.codeGenEditor.getValue();
    if (!value) return;

    const language = languageSelect.value;
    const ext = LANGUAGES_SUPPORT[language]?.fileExtension || "txt";
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
});

populateLanguages();
