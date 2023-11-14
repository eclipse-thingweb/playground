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
 * @file The `settings.js` contains the main functionality
 * for the settings menu, such as event handlers, toggle buttons, 
 * application preferences and themes. The preferences and themes are
 * subsequently stored in the local storage
 */

import { editor } from 'monaco-editor'
import themeData from './monochrome-theme'

/***********************************************************/
/*                     Settings menu                       */
/***********************************************************/
const closeSettings = document.querySelector(".settings__close i");
const settingsMenu = document.querySelector(".settings-menu");
const settingsBtn = document.querySelector("#settings-btn");
export const editorForm = document.querySelector(".settings__editor")
const themePicker = document.querySelector("#theme-picker")
const fontSizeTxt = document.querySelector(".editor-font-size")
export const fontSizeSlider = document.querySelector("#font-size")
const autoValidateBtn = document.querySelector('#auto-validate')
const validateJSONLDBtn = document.querySelector('#validate-jsonld')
const tmConformanceBtn = document.querySelector('#tm-conformance')

/***********************************************************/
/*              Set New Theme Monaco editor                */
/***********************************************************/
editor.defineTheme('monochrome', themeData)

//set the stored theme (if any)"
document.onload = setTheme()


//Bind the font size text to the slider element
fontSizeTxt.innerText = fontSizeSlider.value

/**
 * Event listeners to open and close the settings menu
 */
closeSettings.addEventListener("click", () => {
    settingsMenu.classList.add("closed");
})

settingsBtn.addEventListener("click", () => {
    settingsMenu.classList.toggle("closed")
    window.dispatchEvent(new CustomEvent("popup"));
})

//Handle click outside the settings menu
document.addEventListener('click', (e) => {
    if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target) && !settingsMenu.classList.contains("closed")) {
        settingsMenu.classList.add("closed")
    }
})

/**
 * Event listener for reseting all the settings and preferences values
 * @param {event} e - reset event
 */
editorForm.addEventListener("reset", (e) => {
    e.preventDefault()

    //reset preference values
    fontSizeSlider.value = 14
    fontSizeTxt.innerText = fontSizeSlider.value
    themePicker.value = "light-mode"
    document.documentElement.className = themePicker.value
    storeTheme(themePicker.value)
    storeFontSize(fontSizeSlider.value)
    setMonacoTheme(themePicker.value)

    //resetting all toggle btns
    autoValidateBtn.checked = false
    validateJSONLDBtn.checked = true
    tmConformanceBtn.checked = true
})

/**
 * Event listener to change the theme when the theme select input is changed
 */
themePicker.addEventListener("change", () => {
    storeTheme(themePicker.value)
    document.documentElement.className = themePicker.value
    setMonacoTheme(themePicker.value)
})

/**
 * Event listener to update the font size in the settings menu text 
 * and in the monaco editor when the font size input is changed
 */
fontSizeSlider.addEventListener("input", () => {
    fontSizeTxt.innerText = fontSizeSlider.value
    storeFontSize(fontSizeSlider.value)
})


/***********************************************************/
/*      Themes picker and font picker functionality        */
/***********************************************************/

/**
 * Store the selected themek in the localStorage
 * @param {String} theme - the name of the theme
 */
function storeTheme(theme) {
    localStorage.setItem("theme", theme)
}

/**
 * Store the selected font size in the localStorage
 * @param {Number} fontSize - The number of the font size
 */
function storeFontSize(fontSize) {
    localStorage.setItem("fontSize", fontSize)
}

/**
 * Gets the theme value from the localStorage and sets the new theme
 */
function setTheme() {
    const activeTheme = localStorage.getItem("theme") === null ? 'light-mode' : localStorage.getItem("theme")
    themePicker.value = activeTheme
    document.documentElement.className = activeTheme
    setMonacoTheme(activeTheme)
}

/**
 * Function which gets the value from the localStorage and sets the new font size
 * @param {object} editor - the editor object which references the created monaco editor
 */
export function setFontSize(editorInstance) {
    const activeFontSize = localStorage.getItem("fontSize") === null ? '14' : localStorage.getItem("fontSize")
    fontSizeTxt.innerText = activeFontSize
    fontSizeSlider.value = activeFontSize
    editorInstance.updateOptions({
        fontSize: activeFontSize
    })
}

/**
 * Get the current page theme and implement it for the monaco editor as well
 * @param { String } theme - the name of the current or wanted theme
 */
function setMonacoTheme(theme) {
    if (theme == "dark-mode") {
        editor.setTheme('vs-dark')
    } else if (theme == "light-mode") {
        editor.setTheme('vs')
    } else {
        editor.setTheme('monochrome')
    }
}