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
 * @file The `json-yaml.js` contains the main functionality
 * for converting json to yaml and vice versa, utilizing the util's 
 * functions and the editorList array from the editor file.
 */
import { editorList } from './editor.js'
import { generateTD } from './util.js'
import { getEditorData } from './editor.js'

/***********************************************************/
/*                   Yaml functionality                    */
/***********************************************************/

export const yamlBtn = document.querySelector("#file-type-yaml")
export const jsonBtn = document.querySelector("#file-type-json")
const yamlWarning = document.querySelector('.json-yaml-warning')
const yamlConfirmBtn = document.querySelector("#yaml-confirm-btn")
const yamlCancelBtn = document.querySelector("#yaml-cancel-btn")
const yamlWarningContainer = document.querySelector(".json-yaml-warning__container")
jsonBtn.checked = true


//Click event to show the warning text before converting the td/tm
yamlBtn.addEventListener("click", () => {
  editorList.forEach(editorInstance => {
    if (editorInstance["_domElement"].classList.contains("active") && editorInstance["_domElement"]["dataset"]["modeId"] == "json") {
      try {
        JSON.parse(editorInstance.getValue())
        yamlWarning.classList.remove('closed')
      }
      catch (err) {
        alert('TD is not a valid JSON object');
        jsonBtn.checked = true
        return
      }
    }
  })
})

//Close the warning without converting
yamlCancelBtn.addEventListener("click", () => {
  yamlWarning.classList.add('closed')
  jsonBtn.checked = true
})

//Handle click outside the warning pop up
document.addEventListener('click', (e) => {
  if(!yamlBtn.contains(e.target) && !yamlWarningContainer.contains(e.target) && !yamlWarning.classList.contains("closed")){
    yamlWarning.classList.add("closed")
    jsonBtn.checked = true
  }
})

//Confirm the json to yaml conversion
yamlConfirmBtn.addEventListener("click", () => {
  yamlWarning.classList.add('closed')
  convertJsonYaml()
})

jsonBtn.addEventListener("click", () => {
  editorList.forEach(editorInstance => {
    if (editorInstance["_domElement"].classList.contains("active") && editorInstance["_domElement"]["dataset"]["modeId"] == "yaml") {
      try {
        getEditorData(editorInstance)
        convertJsonYaml()
      }
      catch (err) {
        alert('TD is not a valid YAML object');
        yamlBtn.checked = true
        return
      }
    }
  })
})

/**
 * Get the currently active editor and convert it to json or yaml
 */
function convertJsonYaml() {
  editorList.forEach(editorInstance => {
    if (editorInstance["_domElement"].classList.contains("active")) {
      try {
        const editorData = getEditorData(editorInstance)
        generateTD(editorData[0] === "json" ? "yaml" : "json", editorInstance)
      } catch (err) {
        console.error(err)
      }
    }
  })
}