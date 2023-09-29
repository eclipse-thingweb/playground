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
 * @file The `defaults.js` takes care of the main functionality for the 
 * Defaults feature within the console. This include initializing the editor,
 * connecting it to the local storage, as well as the main buttons within the Defaults
 * feature such as json, yaml conversion and the download option.
 */

import { editor } from 'monaco-editor'
import { setFontSize, editorForm, fontSizeSlider } from './settings-menu'
import { generateTD, offerFileDownload, addDefaultsUtil, removeDefaultsUtil } from './util'
import { getEditorData } from './editor'

/******************************************************************/
/*                    Defaults functionality                       */
/******************************************************************/

//Default Elements
export const defaultsJsonBtn = document.querySelector("#defaults-json")
export const defaultsYamlBtn = document.querySelector("#defaults-yaml")
export const defaultsAddBtn = document.querySelector("#defaults-add")
const defaultsRemoveBtn = document.querySelector("#defaults-remove")
const defaultsDownload = document.querySelector("#defaults-download")
export const defaultsView = document.querySelector("#defaults-view")

/**
 * Initialize the monaco editor for the Defaults feature, sets it to an empty value,
 * a default language of json and as a read only document. Also it connects the editor
 * to the local storage to change the fontsize correspondingly
 */
async function initDefaultsEditor() {
    window.defaultsEditor = editor.create(document.getElementById('defaults-container'), {
        value: "",
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true
    })

    document.onload = setFontSize(window.defaultsEditor)
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.defaultsEditor)
    })

    //Bind the reset button form the settings to the editor and assign the specied font size
    editorForm.addEventListener("reset", () => {
        setFontSize(window.defaultsEditor)
    })
}

initDefaultsEditor()

//Json conversion btn
defaultsJsonBtn.addEventListener("click", () => {
    generateTD("json", window.defaultsEditor)
    defaultsJsonBtn.disabled = true
    defaultsYamlBtn.disabled = false
})

//Yaml conversion btn
defaultsYamlBtn.addEventListener("click", () => {
    generateTD("yaml", window.defaultsEditor)
    defaultsJsonBtn.disabled = false
    defaultsYamlBtn.disabled = true
})

//Add defaults btn
defaultsAddBtn.addEventListener("click", () => {
    defaultsAddBtn.disabled = true
    defaultsRemoveBtn.disabled = false
    addDefaultsUtil(window.defaultsEditor)
})

//Remove defaults btn
defaultsRemoveBtn.addEventListener("click", () => {
    removeDefaultsUtil(window.defaultsEditor)
    defaultsAddBtn.disabled = false
    defaultsRemoveBtn.disabled = true
})

//Donwload btn
defaultsDownload.addEventListener("click", () => {
    const editorData = getEditorData(window.defaultsEditor)
    const contentType = `application/${editorData[0]};charset=utf-8;`
    const visualizationName = editorData[2]["title"].replace(/\s/g, "-")
    const defaultState = defaultsAddBtn.disabled === true ? 'with-Defaults' : 'without-Defaults'

    offerFileDownload(
        `${visualizationName}-${defaultState}.${editorData[0]}`,
        window.defaultsEditor.getModel().getValue(),
        contentType
    )
})