/**
 * @file The `open-api.js` takes care of the main functionality for the 
 * OpenAPI feature within the console. This include initializing the editor,
 * connecting it to the local storage, as well as the main buttons within the OpenAPI
 * feature such as json, yaml conversion and the download option.
 */

import { editor } from 'monaco-editor'
import { setFontSize, editorForm, fontSizeSlider } from './settings-menu'
import { generateTD, offerFileDownload } from './util'
import { getEditorData } from './editor'

/******************************************************************/
/*                    OpenAPI functionality                       */
/******************************************************************/

//OpenAPI Elements
export const openApiTab = document.querySelector(".api-tab-btn")
export const openApiJsonBtn = document.querySelector("#open-api-json")
export const openApiYamlBtn = document.querySelector("#open-api-yaml")
export const openApiView = document.querySelector("#open-api-view")
const openApiDownload = document.querySelector("#open-api-download")

/**
 * Initialize the monaco editor for the OpenAPI feature, sets it to an empty value,
 * a default language of json and as a read only document. Also it connects the editor
 * to the local storage to change the fontsize correspondingly
 */
async function initOpenApiEditor() {
    window.openApiEditor = editor.create(document.getElementById('open-api-container'), {
        value: "",
        language: "json",
        automaticLayout: true,
        readOnly: true,
        formatOnPaste: true
    })

    document.onload = setFontSize(window.openApiEditor)
    fontSizeSlider.addEventListener("input", () => {
        setFontSize(window.openApiEditor)
    })

    //Bind the reset button form the settings to the editor and assign the specied font size
    editorForm.addEventListener("reset", () => {
        setFontSize(window.openApiEditor)
    })
}

initOpenApiEditor()

//Json conversion btn
openApiJsonBtn.addEventListener("click", () => {
    generateTD("json", window.openApiEditor)
    openApiJsonBtn.disabled = true
    openApiYamlBtn.disabled = false
})

//Yaml conversion btn
openApiYamlBtn.addEventListener("click", () => {
    generateTD("yaml", window.openApiEditor)
    openApiJsonBtn.disabled = false
    openApiYamlBtn.disabled = true
})

//Donwload btn
openApiDownload.addEventListener("click", () => {
    const editorData = getEditorData(window.openApiEditor)
    const contentType = `application/${editorData[0]};charset=utf-8;`
    const visualizationName = editorData[2]["info"]["title"].replace(/\s/g, "-")

    offerFileDownload(
        `${visualizationName}-OpenAPI.${editorData[0]}`,
        window.openApiEditor.getModel().getValue(),
        contentType
    )
})