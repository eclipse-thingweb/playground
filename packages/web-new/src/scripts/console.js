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
import { defaultsView, defaultsJsonBtn, defaultsYamlBtn, defaultsAddBtn } from './defaults'
import { visualize } from './visualize'
import { validationView } from './validation'
import { convertTDYamlToJson, detectProtocolSchemes } from '../../../core/dist/web-bundle.min.js'
import { generateOAP, generateAAP, addDefaultsUtil, validate } from './util'
import { editorList, getEditorData } from './editor'

/******************************************************************/
/*                    Console functionality                       */
/******************************************************************/

//Main console elements
const errorContainer = document.querySelector(".console__content #console-error")
const errorTxt = document.querySelector(".console-error__txt")
const eraseConsole = document.querySelector(".console__tabs .trash")
export const visualizationOptions = document.querySelectorAll(".visualization__option")
export const visualizationContainers = document.querySelectorAll(".console-view")

eraseConsole.addEventListener("click", () => {
    clearConsole()
})

/**
 * Unchecks all visualizatin btns and hiddes all visualization containers
 */
export function clearConsole() {
    visualizationContainers.forEach(container => {
        container.classList.add("hidden")
    })
    visualizationOptions.forEach(option => {
        option.checked = false
    })

    clearVisualizationEditors()
}

/**
 * Clear the value of all the viisualization monaco editor
 */
function clearVisualizationEditors() {
    window.openApiEditor.getModel().setValue('')
    window.asyncApiEditor.getModel().setValue('')
    window.defaultsEditor.getModel().setValue('')
}


//Set the behavior for each visualization tab when clicked on it
visualizationOptions.forEach(option => {
    option.addEventListener("click", () => {
        clearVisualizationEditors()
        visualizationContainers.forEach(container => {
            container.classList.add("hidden")
        })

        editorList.forEach(editorInstance => {
            if (editorInstance["_domElement"].classList.contains("active")) {
                const editorValue = editorInstance["_domElement"].dataset.modeId === "yaml" ? convertTDYamlToJson(editorInstance.getValue()) : editorInstance.getValue()
                try {
                    let td = JSON.parse(editorValue)
                    hideConsoleError()

                    if ((td["@type"] === "tm:ThingModel" && option.id === "open-api-tab") || (td["@type"] === "tm:ThingModel" && option.id === "async-api-tab") || (td["@type"] === "tm:ThingModel" && option.id === "defaults-tab")) {
                        showConsoleError("This function is only allowed for Thing Descriptions!")
                    } else {
                        switch (option.id) {
                            case "open-api-tab":
                                if (editorInstance["_domElement"].dataset.modeId === "yaml") {
                                    openApiJsonBtn.disabled = false
                                    openApiYamlBtn.disabled = true
                                } else {
                                    openApiJsonBtn.disabled = true
                                    openApiYamlBtn.disabled = false
                                }

                                if (td["@type"] !== "tm:ThingModel") {
                                    enableAPIConversionWithProtocol(editorInstance)
                                }

                                break;

                            case "async-api-tab":
                                if (editorInstance["_domElement"].dataset.modeId === "yaml") {
                                    asyncApiJsonBtn.disabled = false
                                    asyncApiYamlBtn.disabled = true
                                } else {
                                    asyncApiJsonBtn.disabled = true
                                    asyncApiYamlBtn.disabled = false
                                }

                                if (td["@type"] !== "tm:ThingModel") {
                                    enableAPIConversionWithProtocol(editorInstance)
                                }

                                break;

                            case "defaults-tab":
                                if (editorInstance["_domElement"].dataset.modeId === "yaml") {
                                    defaultsJsonBtn.disabled = false
                                    defaultsYamlBtn.disabled = true
                                } else {
                                    defaultsJsonBtn.disabled = true
                                    defaultsYamlBtn.disabled = false
                                }
                                if (td["@type"] !== "tm:ThingModel") {
                                    addDefaultsUtil(editorInstance)
                                    defaultsAddBtn.disabled = true
                                    defaultsView.classList.remove("hidden")
                                }

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
    let td = editorInstance.getValue()
    if (editorInstance["_domElement"].dataset.modeId === "yaml") {
        td = convertTDYamlToJson(td)
    }

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