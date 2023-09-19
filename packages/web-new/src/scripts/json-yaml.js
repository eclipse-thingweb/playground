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
 * funcions and the editorList array from the editor file.
 */
import { editorList } from './editor.js'
import { generateTD } from './util.js'

/***********************************************************/
/*                   Yaml functionality                    */
/***********************************************************/

export const yamlBtn = document.querySelector("#file-type-yaml")
export const jsonBtn = document.querySelector("#file-type-json")
const yamlWarning = document.querySelector('.json-yaml-warning')
const yamlConfirmBtn = document.querySelector("#yaml-confirm-btn")
const yamlCancelBtn = document.querySelector("#yaml-cancel-btn")
jsonBtn.checked = true


//Click event to show the warning text before converting the td/tm
yamlBtn.addEventListener("click", ()=> {
  editorList.forEach(editorInstance => {
    if(editorInstance["_domElement"].classList.contains("active")){
      try{
        JSON.parse(editorInstance.getValue())
      }
      catch(err){
        alert('TD is not a valid JSON object');
        jsonBtn.checked = true
        return
      }
      yamlWarning.classList.remove('closed')
    }
  })
})

//Close the warning without converting
yamlCancelBtn.addEventListener("click", () => {
  yamlWarning.classList.add('closed')
  jsonBtn.checked = true
})

//Confirm the json to yaml convertion
yamlConfirmBtn.addEventListener("click", () => {
  yamlWarning.classList.add('closed')
  convertJsonYaml()
})

jsonBtn.addEventListener("click", ()=> {
  convertJsonYaml()
})

/**
 * Get the currently active editor and its value and convert to json or yaml
 */
function convertJsonYaml(){
  editorList.forEach(editorInstance => {
    if(editorInstance["_domElement"].classList.contains("active")){
      generateTD(jsonBtn.checked === true ? "json" : "yaml", editorInstance)
    }
  })
}