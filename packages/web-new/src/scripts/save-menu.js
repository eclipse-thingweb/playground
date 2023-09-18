/**
 * @file The `save-menu.js` handle the main functionality for the save menu
 * such as generating a sharable link, allowing to open such link in a new playground
 * tab, or in ediTDor. As well as allowing the user to download the current TD/TM or 
 * save it directly in their file system.
 */

import { save, openEditdor, offerFileDownload } from "./util"
import { editorList, getEditorData } from "./editor"

/***********************************************************/
/*                 Save Menu functionality                 */
/***********************************************************/
const saveMenu = document.querySelector(".save-menu")
const saveMenuBtn = document.querySelector("#save-btn")
const closeSaveMenu = document.querySelector(".save-menu-close i")
const shareUrlContainer =  document.querySelector("#share-url-input")
const openUrlTab =  document.querySelector("#open-url-tab")
const thingTypeText = document.querySelector('#thing-type-text')
const shareUrlBtn = document.querySelector("#share-url-btn")
const openEditdorBtn = document.querySelector('#open-editdor-btn')
const downloadBtn = document.querySelector("#download-btn")
const saveAsBtn = document.querySelector("#save-as-btn")
const saveAsWarning = document.querySelector(".save-warning")
let fileHandle;
openUrlTab.disabled = true
shareUrlContainer.value = ""

//Open the save menu and change the text depending on the Thing type (TD or TM)
saveMenuBtn.addEventListener("click", () => {
  editorList.forEach(editorInstance => {
    if(editorInstance["_domElement"].classList.contains("active")){
      const editorValues = getEditorData(editorInstance)
      thingTypeText.innerText = editorValues[1].toUpperCase()
    }
  })
  saveMenu.classList.remove("closed")
})

//Hide save menu
closeSaveMenu.addEventListener("click", () => {
  saveMenu.classList.add("closed")
  shareUrlContainer.value = ""
  openUrlTab.disabled = true
})

/**
 * Get the active editor, the format type, doc type and editor
 * and call the saveAsURL function
 */
shareUrlBtn.addEventListener("click", () => {
  try {
    editorList.forEach(editorInstance => {
      if(editorInstance["_domElement"].classList.contains("active")){
        const editorValues = getEditorData(editorInstance)

        saveAsURL(editorValues[0], editorValues[1], editorValues[2])
      }
    })
  } catch (err) {
    console.error(err);
    shareUrlContainer.value = "Invalid JSON Object"
    shareUrlContainer.classList.add("error")
    setTimeout(() => {
      shareUrlContainer.value = ""
      shareUrlContainer.classList.remove("error")
    }, 1500)
  }
})

/**
 * Get the doc type, format type and editor and calls the utils save function
 * It then copies the link the url container
 * @param { String } docType - tm or td
 * @param { String } format - json or yaml
 * @param { Object } editor - the editor reference object
 */
async function saveAsURL(formatType, thingType, editorContent){
  const URL = await save(formatType, thingType, editorContent)
  if(URL !== undefined){
    shareUrlContainer.value = URL
    openUrlTab.disabled = false
  }
}

/**
 * Get the active editor, the format type, doc type and editor
 * and call the openEditdor function from utils
 */
openEditdorBtn.addEventListener("click", () => {
  try {
    editorList.forEach(editorInstance => {
      if(editorInstance["_domElement"].classList.contains("active")){
        const editorValues = getEditorData(editorInstance)

        openEditdor(editorValues[0], editorValues[1], editorInstance)
      }
    })
  } catch (err) {
    console.error(err);
    shareUrlContainer.value = "Invalid JSON Object"
    shareUrlContainer.classList.add("error")
    setTimeout(() => {
      shareUrlContainer.value = ""
      shareUrlContainer.classList.remove("error")
    }, 1500)
  }
})

/**
 * Open the generated sharable link in a new playground tab
 */
openUrlTab.addEventListener("click", () => {
  if(shareUrlContainer.value !== "" || shareUrlContainer.value !== "Invalid JSON Object"){
    window.open(shareUrlContainer.value, '_blank');
  }
})

/**
 * Gets the active editor, editor content type and tab name,
 * then it calls the utils offerFileDownload
 */
downloadBtn.addEventListener("click", () => {
  editorList.forEach(editorInstance => {
    if(editorInstance["_domElement"].classList.contains("active")){
      const editorValues = getEditorData(editorInstance)
      let tabName = editorValues[2]["title"].replaceAll(' ', '-')
      const contentType = `application/${editorValues[0]};charset=utf-8;`

      offerFileDownload(`${tabName}.${editorValues[0]}`, editorInstance.getValue(), contentType)
    }
  })
  saveMenu.classList.add("closed")
})

/* Save as btn functionality */
saveAsBtn.addEventListener("click", () => {
  saveAsFile()
})

/**
 * Saves the td as a file in the file system
 * @param {*} content
 */
async function saveFileInSystem(content){
  let stream = await fileHandle.createWritable()
  await stream.write(content)
  await stream.close()
}

/**
 * Opens the file system allows the user to input a file
 * name and save it as json , jsonld or yaml
 * This function only works for chrome, edge and oper as of now (26.05.2023)
 */
async function saveAsFile(){
  try{
    let fileName = ""
    let editorContent = ""
    let acceptOpts = {}
    let acceptDesc = ""
    editorList.forEach(editorInstance => {
      if(editorInstance["_domElement"].classList.contains("active")){
        const editorValues = getEditorData(editorInstance)
        fileName = `${editorValues[2]["title"]}.${editorValues[0]}`
        editorContent = editorInstance.getValue()
        acceptOpts = editorValues[0] === "json" ? { "text/plain": [".jsonld", ".json"] } : { "text/plain": [".yaml"] }
        acceptDesc = editorValues[0] === "json" ? "json or jsonld files only" : "yaml files only"
      }
    })


    const opts = {
      suggestedName : fileName,
      types: [
        {
          description: acceptDesc,
          accept: acceptOpts,
        },
      ],
      excludeAcceptAllOption: true,
    }

    fileHandle = await window.showSaveFilePicker(opts)

    saveFileInSystem(editorContent)

  }catch(err){
    const errTxt = `${err}`
    if(errTxt === "AbortError: The user aborted a request.")
    {
      console.error(err)
    }
    else{
      saveAsWarning.classList.add("active")
      setTimeout(() => {
        saveAsWarning.classList.remove("active")
      },1500)
    }
  }
}

//TODO IMPORT FROM FILES
/** Experimental file manager fucntion*/
// const visualizeView = document.querySelector("#visualize-view p")
// async function getFile() {
//   // Open file picker and destructure the result the first handle
//   [fileHandle] = await window.showOpenFilePicker()
//   let fileData = await fileHandle.getFile()
//   let text = await fileData.text()
//   visualizeView.innerText = text
//   console.log(JSON.parse(text));
// }