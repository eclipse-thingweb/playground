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
 * @file The `editor.js` contains the main functionality
 * for the generated monaco editors and the surrounding elements
 * such as the tab functionality. It utilizes multiple other files and dependencies
 * such as the monaco-editor dependency, the monochrome-theme file to add the custom 
 * theme, some util functions, the td and tm schemas from the core @thing-description-playground
 * as well as the "Validators" and the "JsonSpellChecker" from the json-spell-checker dependency
 */

import { editor, languages, MarkerSeverity } from 'monaco-editor'
import { getEditorValue, validate } from "./util"
import { setFontSize, editorForm, fontSizeSlider } from './settings-menu'
import { autoValidateBtn, validationTab, validationView } from './validation'
import { jsonBtn, yamlBtn } from './json-yaml'
import tdSchema from '../../../core/td-schema.json'
import tmSchema from '../../../core/tm-schema.json'
import { convertTDJsonToYaml, convertTDYamlToJson } from '../../../core/dist/web-bundle.min.js'
import { configure, checkTypos } from '../../../json-spell-checker/dist/web-bundle.min.js'
import { clearConsole } from './console'

/***********************************************************/
/*                    Editor and tabs                      */
/***********************************************************/

//Declare all necessary item from the DOM
const addTab = document.querySelector(".ide__tabs__add")
const tabsLeftContainer = document.querySelector(".ide__tabs__left")
const ideContainer = document.querySelector(".ide__container")
export let tabsLeft = document.querySelectorAll(".ide__tabs__left li:not(:last-child)")

//Editor list array where all the generated editor will be added and referenced from
export let editorList = []
export const ideCount = {
  ideNumber: 1
}

//Initiate by generating the first editor and the respective tab
createIde(ideCount.ideNumber)

//Initialized the program with an open validation view
validationTab.checked = true
validationView.classList.remove("hidden")

/**
 * Function which creates a tab for the respective editor
 * and adds all other tab component such as the close button
 * @param {Number} tabNumber - the "id" number for the tab
 * @param {String} exampleName - the initial/default name shown in the tab
 * @param {String} thingType - the type of the object TD or TM
 */
function createTab(tabNumber, exampleName, thingType) {

  const newTab = document.createElement("li")
  //assign the tabNumber to the data-tab-id property
  newTab.setAttribute("data-tab-id", tabNumber)
  newTab.setAttribute('id', 'tab');

  //Add thing type icon to the tab
  const tabIcon = document.createElement("p")
  tabIcon.classList.add("tab-icon")
  if (thingType === "TM") {
    tabIcon.innerText = "TM"
  } else {
    tabIcon.innerText = "TD"
  }

  const tabContent = document.createElement("p")
  //If there is not specified example name give the default Thing Description + tabNumber
  //Else, if the the user uses TD/TM example use the example name as the tab name
  if (exampleName === undefined || exampleName === "") {
    tabContent.innerText = `Thing Description ${tabNumber}`
  }
  else {
    tabContent.innerText = exampleName
  }
  tabContent.classList.add("content-tab")
  //Add the close btn element
  const closeBtn = document.createElement("div")
  closeBtn.classList.add("close-tab")

  // Create the svg close icon
  const closeIconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  closeIconSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  closeIconSvg.setAttribute("width", "100%")
  closeIconSvg.setAttribute("height", "100%")
  closeIconSvg.setAttribute("viewBox", "0 0 384 512")

  // Create a path element and set its attributes
  const closeIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
  closeIconPath.setAttribute("d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z")

  //append the path to the svg and the svg to the button
  closeIconSvg.appendChild(closeIconPath)
  closeBtn.appendChild(closeIconSvg)

  //Create the close confirmation btns
  const confirmBtns = document.createElement("div")
  confirmBtns.classList.add("confirm-btns", "hidden")

  //Confirm close button
  const confirmTabClose = document.createElement("button")
  confirmTabClose.classList.add("confirm-tab-close")
  confirmTabClose.textContent = "Close"
  // Create the svg confirm close icon
  const confirmIconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  confirmIconSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  confirmIconSvg.setAttribute("width", "100%")
  confirmIconSvg.setAttribute("height", "100%")
  confirmIconSvg.setAttribute("viewBox", "0 0 448 512")
  confirmIconSvg.classList.add("icon")

  // Create a path element and set its attributes
  const confirmIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
  confirmIconPath.setAttribute("d", "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z")

  confirmIconSvg.appendChild(confirmIconPath)
  confirmTabClose.appendChild(confirmIconSvg)
  
  //Cancel close button
  const cancelTabClose = document.createElement("button")
  cancelTabClose.classList.add("cancel-tab-close")
  cancelTabClose.textContent = "Cancel"
  
  // Create the svg close cancel icon
  const cancelIconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  cancelIconSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  cancelIconSvg.setAttribute("width", "100%")
  cancelIconSvg.setAttribute("height", "100%")
  cancelIconSvg.setAttribute("viewBox", "0 0 384 512")
  cancelIconSvg.classList.add("icon")

  // Create a path element and set its attributes
  const cancelIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
  cancelIconPath.setAttribute("d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z")

  cancelIconSvg.appendChild(cancelIconPath)
  cancelTabClose.appendChild(cancelIconSvg)

  cancelTabClose.addEventListener("click", () => {
    cancelTabClose.parentElement.classList.add("hidden")
  })

  confirmBtns.appendChild(confirmTabClose)
  confirmBtns.appendChild(cancelTabClose)
  
  newTab.appendChild(tabIcon)
  newTab.appendChild(tabContent)
  newTab.appendChild(closeBtn)
  newTab.appendChild(confirmBtns)

  //Insert the newly created list at the end of the tab container but before the add new tab button
  tabsLeftContainer.insertBefore(newTab, tabsLeftContainer.children[(tabsLeftContainer.children.length) - 1])
  tabsLeft = document.querySelectorAll(".ide__tabs__left li:not(:last-child)")

  //Once the new tab is created remove "active class from all other tab"
  //and give the class "active to the new tab"
  tabsLeft.forEach(tab => {
    tab.classList.remove("active")
  })
  newTab.classList.add("active")

  confirmTabClose.addEventListener("click", () => {
    //If there is only one tab and its closed create a completely editor and tab and restart the counter
    //If not the last one adjust the styling accordingly and update the amount of tabs
    if (tabsLeft.length == 1) {
      ideCount.ideNumber = 0
      editorList.forEach(ide => {
        if (confirmTabClose.parentElement.parentElement.dataset.tabId === ide["_domElement"].dataset.ideId) {
          //remove the editor from the editor list array and from the DOM
          const index = editorList.indexOf(ide)
          editorList.splice(index, 1)
          ide["_domElement"].remove()
        }
      })
      //remove tab
      confirmTabClose.parentElement.parentElement.remove()
      //create new tab
      createIde(++ideCount.ideNumber)
      jsonBtn.checked = true
    }
    else {
      editorList.forEach(ide => {
        if (confirmTabClose.parentElement.parentElement.dataset.tabId === ide["_domElement"].dataset.ideId) {
          const index = editorList.indexOf(ide)
          editorList.splice(index, 1)
          ide["_domElement"].remove()
        }
      })
      confirmTabClose.parentElement.parentElement.remove()
      tabsLeft = document.querySelectorAll(".ide__tabs__left li:not(:last-child)")
      tabsLeft[0].classList.add("active")
      editorList[0]["_domElement"].classList.add("active")
    }
  })
}

/**
 * Function which takes care of creating the new editor from monaco
 * and appends them to the DOM
 * @param {Number} ideNumber - the id which is assign to the editor in order to connect to the respective tab
 * @param {Object} exampleValue - the td or tm as a json object
 */
export function createIde(ideNumber, exampleValue) {
  clearConsole()
  const url = getEditorValue(window.location.hash.substring(1))
  let defaultValue = {}
  let editorLanguage = "json"

  if (url === "") {
    // If example value is empty utilize a preset of the most basic form of a td
    // else utilize the td/tm from the exampleValue
    if (exampleValue === undefined) {
      defaultValue = {
        "@context": "https://www.w3.org/2022/wot/td/v1.1",
        "id": "urn:uuid:0804d572-cce8-422a-bb7c-4412fcd56f06",
        "@type": "Thing",
        "title": `Thing Template`,
        "description": "This is your customizable template. Edit it to fit your Thing Description or Thing Model needs!",
        "securityDefinitions": {
          "basic_sc": { "scheme": "basic", "in": "header" }
        },
        "security": "basic_sc",
        "properties": {},
        "actions": {},
        "events": {}
      }
    }
    else {
      delete exampleValue["$title"]
      delete exampleValue["$description"]
      defaultValue = exampleValue
    }
  }
  else {
    editorLanguage = url.substring(2, 6)
    defaultValue = JSON.parse(url.substring(6))
    //remove the hash from the url to allow new editor to be created
    history.replaceState(null, null, window.location.origin + window.location.pathname);
  }

  //Create the container for the new editor and add all necessary attributes for styling and identifiers
  const newIde = document.createElement("div")
  newIde.classList.add("editor")
  newIde.setAttribute('id', `editor${ideNumber}`)
  newIde.setAttribute("data-ide-id", ideNumber)
  ideContainer.appendChild(newIde)

  //New monaco editor is created
  initEditor(ideNumber, defaultValue, editorLanguage)

  //remove the active class from previous editor
  editorList.forEach(editor => {
    editor["_domElement"].classList.remove("active")
  })

  //Add active class to new editor
  newIde.classList.add("active")

  //Create the new tab depending if its a TM or TD
  if (defaultValue["@type"] === "tm:ThingModel") {
    createTab(ideNumber, defaultValue["title"], "TM")
  }
  else {
    createTab(ideNumber, defaultValue["title"], "TD")
  }

  findFileType()
}

/**
 * Async function to initiate the editors
 * @param {Number} ideNumber 
 * @param {Object} defaultValue 
 * @param {String} editorLanguage 
 */
async function initEditor(ideNumber, editorValue, editorLanguage) {
  editorValue = editorLanguage === "json" ? JSON.stringify(editorValue, null, 2) : convertTDJsonToYaml(JSON.stringify(editorValue))
  let editorInstance = editor.create(document.getElementById(`editor${ideNumber}`), {
    value: editorValue,
    language: editorLanguage,
    automaticLayout: true,
    formatOnPaste: true
  })

  //Bind the font size slider from the settings to the editor(s) and assign the specified font size
  document.onload = setFontSize(editorInstance)
  fontSizeSlider.addEventListener("input", () => {
    setFontSize(editorInstance)
  })

  //Bind the reset button form the settings to the editor and assign the specified font size
  editorForm.addEventListener("reset", () => {
    setFontSize(editorInstance)
  })

  editorInstance.getModel().onDidChangeContent(_ => {

    try {
      const editorValues = getEditorData(editorInstance)
      changeThingIcon(editorValues[1])
      updateTabName(editorValues[2]["title"])

      if (autoValidateBtn.checked === true && validationTab.checked === true) {
        validate(editorValues[1], JSON.stringify(editorValues[2]))
      }else{
        clearConsole()
      }

      //Only use the spell checker if file is json
      if (editorValues[0] === "json") {
        //Get if thing type and set the respective schema
        if (editorValues[2]["@type"] === "tm:ThingModel") {
          // Configure JSON language support with schemas and schema associations
          languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
              {
                fileMatch: [editorInstance.getModel().uri.toString()],
                schema: tmSchema,
                uri: 'file:///tm-schema.json'
              }
            ]
          });
        }
        else {
          languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
              {
                fileMatch: [editorInstance.getModel().uri.toString()],
                schema: tdSchema,
                uri: 'file:///td-schema.json'
              }
            ]
          });
        }

        markTypos(editorInstance.getModel());
      }
    } catch (err) {
      console.error("Invalid JSON object");
    }

  });

  editorList.push(editorInstance)
}

/**
 * Marks the possible typos on the editor
 * @param {object} model - The model that represents the loaded Monaco editor
 */
function markTypos(model) {
  const markers = []

  configure()
  const typos = checkTypos(model.getValue())

  typos.forEach(typo => {
    markers.push({
      message: typo.message,
      severity: MarkerSeverity.Warning,
      startLineNumber: typo.startLineNumber,
      startColumn: typo.startColumn,
      endLineNumber: typo.endLineNumber,
      endColumn: typo.endColumn
    })
  })

  editor.setModelMarkers(model, 'typo', markers)
}

/**
 * Check for the content of the editor and return the format (json, yaml), the content and the thing type (TD, TM)
 * @param { monaco object } editor 
 * @returns {String, String, JSON Object} , [formatType, thingType, editorContent]
 */
export function getEditorData(editorInstance) {
  const formatType = editorInstance["_domElement"].dataset.modeId
  const editorContent = formatType === "json" ? JSON.parse(editorInstance.getValue()) : JSON.parse(convertTDYamlToJson(editorInstance.getValue()))
  const thingType = editorContent["@type"] === "tm:ThingModel" ? "tm" : "td"

  return [formatType, thingType, editorContent]
}

/**
 * Finds the current active tab and modifies the icon accordingly
 * @param { string } thingType - TM or TD to modify the tab icon
 */
function changeThingIcon(thingType) {
  tabsLeft.forEach(tab => {
    if (tab.classList.contains("active")) {
      tab.children[0].innerText = thingType.toUpperCase()
    }
  })
}

/**
 * Create a new editor and respective tab when clicking on the plus tab
 * Always initialized the new added thing as a TD
 * Set the json btn to true
 */
addTab.addEventListener("click", () => {
  createIde(++ideCount.ideNumber)
  jsonBtn.checked = true
})

/**
 * Getting and managing all event inside the tabs, such as closing and selecting each tab
 * @param {event} e - click event
 */
tabsLeftContainer.addEventListener("click", (e) => {
  //getting the initial target
  const selectedElement = e.target
  clearConsole()
  tabsLeft.forEach(tab => {
    tab.children[3].classList.add("hidden")
  })

  //Add the active styling when tab is clicked
  if (selectedElement.id == "tab" || selectedElement.parentElement.id == "tab") {

    //Removing the active style from all tabs
    tabsLeft.forEach(tab => {
      tab.classList.remove("active")
    })
    //removing the active style from all editors
    editorList.forEach(ide => {
      ide["_domElement"].classList.remove("active")
    })

    //if the target element is the tab itself add the active class
    //else if the target element is a child of the element add the active class to the parent element
    if (selectedElement.id == "tab") {
      selectedElement.classList.add("active")
    }
    else {
      selectedElement.parentElement.classList.add("active")
    }

    //Get the id of the element and setting the active style to the respective editor
    if (selectedElement.dataset.tabId) {
      editorList.forEach(ide => {
        if (selectedElement.dataset.tabId === ide["_domElement"].dataset.ideId) {
          ide["_domElement"].classList.add("active")
        }
      })
    }
    else {
      editorList.forEach(ide => {
        if (selectedElement.parentElement.dataset.tabId === ide["_domElement"].dataset.ideId) {
          ide["_domElement"].classList.add("active")
        }
      })
    }
  }

  //Closing tabs only when the click event happens on the close icon of the tab
  if (selectedElement.className == "close-tab" && tabsLeft.length >= 1) {
    selectedElement.nextElementSibling.classList.remove("hidden")
  }

  findFileType()
})

/**
 * Find if active editor is json or yaml and change the json/yaml btns respectively
 */
function findFileType() {
  editorList.forEach(editor => {
    if (editor["_domElement"].classList.contains("active")) {
      if (editor["_domElement"].dataset.modeId === "json") {
        jsonBtn.checked = true
      }
      else {
        yamlBtn.checked = true
      }
    }
  })
}

/**
 * Update the tab name depending on the title of the document
 * @param { String } docTitle - title of the TD/TM document
 */
function updateTabName(docTitle) {
  tabsLeft.forEach(tab => {
    if (tab.classList.contains("active")) {
      tab.children[1].textContent = docTitle
    }
  })
}