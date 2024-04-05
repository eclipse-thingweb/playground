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
 * parses the editor value, if it works, checks the the vis type
 * and initializes the respective visualization and well as 
 * enabling the respective inputs
 * @param { String } editorValue 
 */
export function visualize(editorValue) {
    collapseBtn.disabled = false
    expandBtn.disabled = false
    document.getElementById("visualized").innerHTML = ""
    visualizeView.classList.remove("hidden")

    if (graphViewInput.checked === true) {
        //disable and enable respective buttons
        graphViewInput.disabled = true
        treeViewInput.disabled = false
        //Show and hide the respective inputs
        graphInputs.classList.remove("hidden")
        treeInputs.classList.add("hidden")
        //Run the jsonld visualization
        jsonldVis(editorValue, "#visualized", {
            // h: document.getElementById("visualize-container").offsetHeight - 30,
            h: 450,
            w: document.getElementById("visualize-container").offsetWidth - 20,
            maxLabelWidth: 200,
            scalingFactor: 5,
        })
    } else {
        //disable and enable respective buttons
        graphViewInput.disabled = false
        treeViewInput.disabled = true
        //Show and hide the respective inputs
        graphInputs.classList.add("hidden")
        treeInputs.classList.remove("hidden")
        //Run the vega visualization
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