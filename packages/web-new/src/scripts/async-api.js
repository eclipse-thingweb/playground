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
 * @file The `async-api.js` takes care of the main functionality for the 
 * AsyncAPI feature within the console. This include initializing the editor,
 * connecting it to the local storage, as well as the main buttons within the AsyncAPI
 * feature such as json, yaml conversion and the download option.
 */

import { editor } from 'monaco-editor'
import { setFontSize, editorForm, fontSizeSlider } from './settings-menu'
import { generateTD, offerFileDownload } from './util'
import { getEditorData } from './editor'

/******************************************************************/
/*                    AsyncAPI functionality                       */
/******************************************************************/

//AsyncAPI Elements
export const asyncApiTab = document.querySelector(".async-tab-btn")
export const asyncApiJsonBtn = document.querySelector("#async-api-json")
export const asyncApiYamlBtn = document.querySelector("#async-api-yaml")
export const asyncApiView = document.querySelector("#async-api-view")
const asyncApiDownload = document.querySelector("#async-api-download")

/**
 * Initialize the monaco editor for the AsyncAPI feature, sets it to an empty value,
 * a default language of json and as a read only document. Also it connects the editor
 * to the local storage to change the fontsize correspondingly
 */
async function initAsyncApiEditor() {
    window.asyncApiEditor = editor.create(document.getElementById('async-api-container'), {
        value: "",
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true
    })

    document.onload = setFontSize(window.asyncApiEditor)
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.asyncApiEditor)
    })

    //Bind the reset button form the settings to the editor and assign the specied font size
    editorForm.addEventListener("reset", () => {
        setFontSize(window.asyncApiEditor)
    })
}

initAsyncApiEditor()

//Json conversion btn
asyncApiJsonBtn.addEventListener("click", () => {
    generateTD("json", window.asyncApiEditor)
    asyncApiJsonBtn.disabled = true
    asyncApiYamlBtn.disabled = false
})

//Yaml conversion btn
asyncApiYamlBtn.addEventListener("click", () => {
    generateTD("yaml", window.asyncApiEditor)
    asyncApiJsonBtn.disabled = false
    asyncApiYamlBtn.disabled = true
})

//Donwload btn
asyncApiDownload.addEventListener("click", () => {
    const editorData = getEditorData(window.asyncApiEditor)
    const contentType = `application/${editorData[0]};charset=utf-8;`
    const visualizationName = editorData[2]["info"]["title"].replace(/\s/g, "-")

    offerFileDownload(
        `${visualizationName}-AsyncAPI.${editorData[0]}`,
        window.asyncApiEditor.getModel().getValue(),
        contentType
    )
})
