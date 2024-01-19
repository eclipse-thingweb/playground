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
 * @file The `console.js` takes care of setting the main eventHandlers
 * for opening and closing the corresponding visualizations as well as
 * calling their respective functions when interacted with
 */

import { openApiTab, openApiJsonBtn, openApiYamlBtn, openApiView } from './open-api'
import { asyncApiTab, asyncApiJsonBtn, asyncApiYamlBtn, asyncApiView } from './async-api'
import { AASView } from './aas'
import { defaultsView, defaultsJsonBtn, defaultsYamlBtn, defaultsAddBtn } from './defaults'
import { visualize } from './visualize'
import { validationView, validationTab } from './validation'
import { convertTDYamlToJson, detectProtocolSchemes } from '../../../core/dist/web-bundle.min.js'
import { generateOAP, generateAAP, addDefaultsUtil, validate, generateAAS, resetValidationStatus } from './util'
import { editorList, getEditorData } from './editor'
import { textIcon } from './main.js'

/******************************************************************/
/*                    Console functionality                       */
/******************************************************************/

//Main console elements
const errorContainer = document.querySelector(".console__content #console-error")
const errorTxt = document.querySelector(".console-error__txt")
export const minMaxBtn = document.querySelector(".min-max")
export const visualizationOptions = document.querySelectorAll(".visualizations__option")
export const visualizationContainers = document.querySelectorAll(".console-view")
export const consoleElement = document.querySelector(".console")
const mainContentElement = document.querySelector(".main-content")

/**
 * Hides the text from the left control panel, updates the state of the console element
 * and adjusts the console size as well as the expand/collapse icon
 * *Collapse arrows gotten from: https://fontawesome.com/icons/down-left-and-up-right-to-center?f=classic&s=solid
 */
function expandConsole() {
    textIcon.forEach(text => {
        text.classList.add("hiddenV")
    })

    consoleElement.classList.remove("collapsed")
    consoleElement.classList.add("expanded")

    setTimeout(() => {
        mainContentElement.style.flex = "0 210px"
        consoleElement.style.flex = `1 0`
        minMaxBtn.children[0].children[0].setAttribute("d", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H296c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272H216c13.3 0 24 10.7 24 24V440c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z")
        minMaxBtn.children[0].classList.remove("expand-arrows")
        minMaxBtn.children[0].classList.add("collapse-arrows")
    }, 100);
}

/**
 * Shows the text from the left control panel, updates the state of the console element
 * and adjusts the console size as well as the expand/collapse icon
 * *Expand arrows gotten from: https://fontawesome.com/icons/up-right-and-down-left-from-center?f=classic&s=solid
 */
function collapseConsole() {
    textIcon.forEach(text => {
        text.classList.remove("hiddenV")
    })

    consoleElement.classList.remove("expanded")
    consoleElement.classList.add("collapsed")

    mainContentElement.style.flex = "1 0"
    consoleElement.style.flex = `0 39px`
    minMaxBtn.children[0].children[0].setAttribute("d", "M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z")
    minMaxBtn.children[0].classList.add("expand-arrows")
    minMaxBtn.children[0].classList.remove("collapse-arrows")
}

minMaxBtn.addEventListener("click", () => {
    if (consoleElement.classList.contains("expanded")) {
        collapseConsole()
    } else {
        expandConsole()
    }
})

/**
 * Unchecks all visualization buttons and hides all visualization containers
 */
export function clearConsole() {
    visualizationContainers.forEach(container => {
        container.classList.add("hidden")
    })
    visualizationOptions.forEach(option => {
        option.checked = false
    })

    //reset to the default validation view
    validationView.classList.remove("hidden")
    validationTab.checked = true
    resetValidationStatus()
    clearVisualizationEditors()
}

/**
 * Clear the value of all the monaco editors
 */
function clearVisualizationEditors() {
    window.openApiEditor.getModel().setValue('')
    window.asyncApiEditor.getModel().setValue('')
    window.defaultsEditor.getModel().setValue('')
    window.AASEditor.getModel().setValue('')
}


//Set the behavior for each visualization tab when clicked on it
visualizationOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (consoleElement.classList.contains("collapsed")) {
            expandConsole()
        }
        clearVisualizationEditors()
        visualizationContainers.forEach(container => {
            container.classList.add("hidden")
        })

        editorList.forEach(editorInstance => {
            if (editorInstance["_domElement"].classList.contains("active")) {
                const fileType = editorInstance["_domElement"].dataset.modeId
                const editorValue = fileType === "yaml" ? convertTDYamlToJson(editorInstance.getValue()) : editorInstance.getValue()

                try {
                    let td = JSON.parse(editorValue)
                    hideConsoleError()

                    if ((td["@type"] === "tm:ThingModel" && option.id === "open-api-tab") || (td["@type"] === "tm:ThingModel" && option.id === "async-api-tab") || (td["@type"] === "tm:ThingModel" && option.id === "defaults-tab") || (td["@type"] === "tm:ThingModel" && option.id === "aas-tab")) {
                        showConsoleError("This function is only allowed for Thing Descriptions!")
                    } else {
                        switch (option.id) {
                            case "open-api-tab":

                                if (fileType === "yaml") {
                                    openApiJsonBtn.disabled = false
                                    openApiYamlBtn.disabled = true
                                } else {
                                    openApiJsonBtn.disabled = true
                                    openApiYamlBtn.disabled = false
                                }

                                enableAPIConversionWithProtocol(editorInstance)

                                break;

                            case "async-api-tab":
                                if (fileType === "yaml") {
                                    asyncApiJsonBtn.disabled = false
                                    asyncApiYamlBtn.disabled = true
                                } else {
                                    asyncApiJsonBtn.disabled = true
                                    asyncApiYamlBtn.disabled = false
                                }

                                enableAPIConversionWithProtocol(editorInstance)

                                break;

                            case "aas-tab":

                                generateAAS(fileType, editorInstance)
                                AASView.classList.remove("hidden")

                                break;

                            case "defaults-tab":
                                if (fileType === "yaml") {
                                    defaultsJsonBtn.disabled = false
                                    defaultsYamlBtn.disabled = true
                                } else {
                                    defaultsJsonBtn.disabled = true
                                    defaultsYamlBtn.disabled = false
                                }

                                addDefaultsUtil(editorInstance)
                                defaultsAddBtn.disabled = true
                                defaultsView.classList.remove("hidden")

                                break;

                            case "visualize-tab":
                                visualize(td)

                                break;

                            case "validation-tab":
                                validationView.classList.remove("hidden")
                                const editorData = getEditorData(editorInstance)
                                validate(editorData[1], editorValue)

                                break;

                            default:
                                break;
                        }

                    }

                }
                catch (err) {
                    console.error(err);
                    errorTxt.innerText = "Invalid or Empty document"
                    errorContainer.classList.remove("hidden")
                }
            }
        })
    })
})


/**
 * Enable Open/Async API elements according to the protocol schemes of a TD
 * @param {object} editor - currently active monaco editor
 */
function enableAPIConversionWithProtocol(editorInstance) {

    let td = editorInstance["_domElement"].dataset.modeId === "yaml" ? convertTDYamlToJson(editorInstance.getValue()) : editorInstance.getValue()

    const protocolSchemes = detectProtocolSchemes(td)

    if (protocolSchemes) {

        if (openApiTab.checked === true) {
            if (["http", "https"].some(p => protocolSchemes.includes(p))) {
                generateOAP(editorInstance["_domElement"].dataset.modeId, editorInstance)
                openApiView.classList.remove("hidden")
            } else {
                showConsoleError("Please insert a TD which uses HTTP!")
            }
        }

        if (asyncApiTab.checked === true) {
            if (["mqtt", "mqtts"].some(p => protocolSchemes.includes(p))) {
                generateAAP(editorInstance["_domElement"].dataset.modeId, editorInstance)
                asyncApiView.classList.remove("hidden")
            } else {
                showConsoleError("Please insert a TD which uses MQTT!")
            }
        }
    }
}

/**
 * Populates the text that should be shown by the console when theres an error
 * @param { String } msg - the text that should be shown in the error view 
 */
function showConsoleError(msg) {
    errorTxt.innerText = msg
    errorContainer.classList.remove("hidden")
}

/**
 * Hides the console error and remove the previous given text
 */
function hideConsoleError() {
    errorTxt.innerText = ""
    errorContainer.classList.add("hidden")
}