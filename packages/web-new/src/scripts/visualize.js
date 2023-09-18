/**
 * @file The `visualize.js` takes care of setting eventHandlers
 * and and the the main functions to initialize both the d3 and the vega
 * visualizations as well as the visualization type and download buttons
 */

import { collapseBtn, expandBtn, jsonldVis } from "./jsonld-vis.js"
import { vegaVis } from "./vega-vis.js"
import { downloadSvg, downloadPng } from 'svg-crowbar'

export const visualizeView = document.querySelector("#visualize-view")
export const visualizeTab = document.querySelector("#visualize-tab")
const downloadSvgBtn = document.getElementById('download-svg')
const downloadPngBtn = document.getElementById('download-png')
const graphViewInput = document.querySelector("#graph-view")
const treeViewInput = document.querySelector("#tree-view")
const graphInputs = document.querySelector(".visualize-inputs__graph")
const treeInputs = document.querySelector(".visualize-inputs__tree")
const visViews = [graphViewInput, treeViewInput]

/**
 * parses the edito value, if it works, checks the the vis type
 * and initializes the rescpective visualization and well as 
 * enabling the respective inputs
 * @param { String } editorValue 
 */
export function visualize(editorValue) {
    collapseBtn.disabled = false
    expandBtn.disabled = false
    document.getElementById("visualized").innerHTML = ""
    visualizeView.classList.remove("hidden")

    if (graphViewInput.checked === true) {
        graphInputs.classList.remove("hidden")
        treeInputs.classList.add("hidden")
        jsonldVis(editorValue, "#visualized", {
            h: document.getElementById("visualize-container").offsetHeight - 30,
            w: document.getElementById("visualize-container").offsetWidth - 20,
            maxLabelWidth: 200,
            scalingFactor: 5,
        })
    } else {
        graphInputs.classList.add("hidden")
        treeInputs.classList.remove("hidden")

        vegaVis("#visualized", editorValue)
    }
}

// Download as svg button
downloadSvgBtn.addEventListener("click", () => {
    const visualizationName = graphViewInput.checked === true ? "Graph-visualization" : "Tree-visualization"
    downloadSvg(document.querySelector("#visualized svg"), visualizationName)
})

// Download as png button
downloadPngBtn.addEventListener("click", () => {
    const visualizationName = graphViewInput.checked === true ? "Graph-visualization" : "Tree-visualization"
    downloadPng(document.querySelector("#visualized svg"), visualizationName)
})

//If the vis type is changed simulate a click on the visualize tab to call the visualize function
visViews.forEach(el => {
    el.addEventListener("click", () => {
        visualizeTab.click()
    })
})