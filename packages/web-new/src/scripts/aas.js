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
 * @file The `aas.js` takes care of the main functionality for the 
 * AAS AID feature within the console. This include initializing the editor,
 * connecting it to the local storage, as well as the main buttons within the AAS
 * feature such as json, yaml conversion and the download option.
 */

import { editor } from 'monaco-editor'
import { setFontSize, editorForm, fontSizeSlider } from './settings-menu'
import { offerFileDownload } from './util'
import { getEditorData } from './editor'

/******************************************************************/
/*                    AAS functionality                       */
/******************************************************************/

//AAS Elements
export const AASTab = document.querySelector(".aas-tab-btn")
export const AASView = document.querySelector("#aas-view")
const AASDownload = document.querySelector("#aas-download")

/**
 * Initialize the monaco editor for the AAS feature, sets it to an empty value,
 * a default language of json and as a read only document. Also it connects the editor
 * to the local storage to change the fontsize correspondingly
 */
async function initAASEditor() {
    window.AASEditor = editor.create(document.getElementById('aas-container'), {
        value: "",
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true
    })

    document.onload = setFontSize(window.AASEditor)
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.AASEditor)
    })

    //Bind the reset button form the settings to the editor and assign the specied font size
    editorForm.addEventListener("reset", () => {
        setFontSize(window.AASEditor)
    })
}

initAASEditor()


//Donwload btn
AASDownload.addEventListener("click", () => {
    const editorData = getEditorData(window.AASEditor)
    const contentType = `application/${editorData[0]};charset=utf-8;`
    const visualizationName = editorData[2]["description"][0]["text"]

    offerFileDownload(
        `${visualizationName}-AAS.${editorData[0]}`,
        window.AASEditor.getModel().getValue(),
        contentType
    )
})