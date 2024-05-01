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
 * @file The `main.js` takes care of setting eventHandlers
 * and connecting the functionality of `util.js` with
 * the html document. Furthermore it contains the code
 * to integrate the monaco editor
 */

import './visualize'
import './editor'
import './json-yaml'
import './settings-menu'
import './save-menu'
import './examples-menu'
import { consoleElement, minMaxBtn } from './console'
import './open-api'
import './async-api'
import './aas'
import './defaults'
import './visualize'
import './validation'

/***********************************************************/
/*                          Loader                         */
/***********************************************************/
//Show loader until the document is fully loaded
const loader = document.querySelector(".loader-container")
let stateCheck = setInterval(() => {
  if (document.readyState === 'complete') {
    clearInterval(stateCheck)
    loader.classList.add("hidden")
  }
}, 100)

/***********************************************************/
/*                Resizing functionality                   */
/***********************************************************/
export const textIcon = document.querySelectorAll(".text-icon")
const resizerY = document.querySelector(".horizontal-divider")
const resizerX = document.querySelector(".vertical-divider")

/*** Horizontal sizing section ***/

/**
 * @const { number } menuCollapseThreshold - Width limit of the menu element before it collapses into its final width (px)
 * @const { number } menuExpandThreshold - Width limit of the menu element before it expands into its final width (px)
 * @const { number } menuCollapseFinal - Final width size of the menu element when fully collapsed (px)
 * @const { number } menuExpandFinal - Final width size of the menu element when fully expanded (px)
 */
const menuCollapseThreshold = 45;
const menuExpandThreshold = 65;
const menuCollapseFinal = 30;
const menuExpandFinal = 80;

/**
 * Mouse down event listener for the resizerX element which
 * then runs the onmousemoveX and the onmouseupX functions
 * @param {event} e - the mousedown event
 */
resizerX.addEventListener("mousedown", (e) => {
  e.preventDefault()
  document.addEventListener("mousemove", onmousemoveX)
  document.addEventListener("mouseup", onmouseupX)
})

/**
 * Function to calculate the x position of the element to be
 * dragged and resize the right and left elements
 * @param {event} e - the mousemove event
 */
function onmousemoveX(e) {
  e.preventDefault()
  let clientX = e.clientX
  const deltaX = clientX - (resizerX.clientX || clientX)
  const menuContainer = resizerX.previousElementSibling
  const editorContainer = resizerX.nextElementSibling

  if (clientX > screen.width) {
    resizerX.clientX = screen.width
  }
  else if (clientX < 0) {
    resizerX.clientX = 0
  }
  else {
    resizerX.clientX = clientX

    // LEFT (menu collapse)
    if (deltaX < 0) {
      const elementWidth = Math.round(parseInt(getComputedStyle(menuContainer).width) + deltaX)
      menuContainer.style.flex = `0 ${elementWidth < menuCollapseThreshold ? menuCollapseFinal : elementWidth}px`
      editorContainer.style.flex = "1 0"
      //Hide the buttons text when the menus width is less than the menuExpandThreshold
      if (elementWidth < menuExpandThreshold) {
        textIcon.forEach(text => {
          text.classList.add("hiddenH")
        })
      }
    }

    // RIGHT (menu expand)
    if (deltaX > 0) {
      const elementWidth = Math.round(parseInt(getComputedStyle(menuContainer).width) + deltaX)
      menuContainer.style.flex = `0 ${elementWidth > menuExpandThreshold ? menuExpandFinal : elementWidth}px`
      editorContainer.style.flex = "1 0"
      //Show the buttons text when the menus width is bigger than the menuExpandThreshold
      if (elementWidth > menuExpandThreshold) {
        textIcon.forEach(text => {
          text.classList.remove("hiddenH")
        })
      }
    }
  }
}

/**
 * Function to remove the mousemove and mouseup events
 * and stop the onmousemoveX and onmouseupX functions
 * @param {event} e - the mouseup event
 */
function onmouseupX(e) {
  e.preventDefault()
  document.removeEventListener("mousemove", onmousemoveX)
  document.removeEventListener("mouseup", onmouseupX)
  delete e.clientX
}


/*** Vertical sizing section ***/

/**
 * @const { number } consoleCollapseThreshold - Width limit of the console element before it collapses into its final width (px)
 * @const { number } consoleExpandThreshold - Width limit of the console element before it expands into its final width (px)
 * @const { number } consoleCollapseFinal - Final width size of the console element when fully collapsed (px)
 * @const { number } consoleExpandFinal - Final width size of the console element when fully expanded (px)
 * @const { number } showTextThreshold - Console height threshold for displaying text on the menu buttons (px)
 * @const { number } hideTextThreshold - Editor height threshold for hiding text on the menu buttons (px)
 * @const { number } minExpandedConsole - Minimum editor height to consider the console to be expanded
 */
const consoleCollapseThreshold = 55;
const consoleExpandThreshold = 225;
const consoleCollapseFinal = 43;
const consoleExpandFinal = 210;
const showTextThreshold = 445;
const hideTextThreshold = 310;
const minExpandedConsole = 714;

/**
 * Mouse down event listener for the resizerY element which
 * then runs the onmousemoveY and the onmouseupY functions
 * @param {event} e - the mousedown event
 */
resizerY.addEventListener("mousedown", (e) => {
  e.preventDefault()
  document.addEventListener("mousemove", onmousemoveY)
  document.addEventListener("mouseup", onmouseupY)
})

/**
 * Function to calculate the y position of the element to be
 * dragged and resize the top and bottom elements
 * @param {event} e - the mousemove event
 */
function onmousemoveY(e) {
  e.preventDefault()
  const clientY = e.clientY
  const deltaY = clientY - (resizerY.clientY || clientY)
  const editorContainer = resizerY.previousElementSibling
  const consoleContainer = resizerY.nextElementSibling

  if (clientY > screen.height) {
    resizerY.clientY = screen.height
  }
  else if (clientY < 0) {
    resizerY.clientY = 0
  }
  else {
    resizerY.clientY = clientY

    // DOWN (Console collapse)
    if (deltaY > 0) {
      const consoleHeight = Math.round(parseInt(getComputedStyle(consoleContainer).height) - deltaY)
      consoleContainer.style.flex = `0 ${consoleHeight < consoleCollapseThreshold ? consoleCollapseFinal : consoleHeight}px`
      editorContainer.style.flex = "1 0"

      //If the console is fully collapse, then change the state of the console element, as well as changing to the expand arrows icon
      if (consoleHeight < consoleCollapseFinal) {
        consoleElement.classList.remove("expanded")
        consoleElement.classList.add("collapsed")

        minMaxBtn.children[0].children[0].setAttribute("d", "M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z")
        minMaxBtn.children[0].classList.add("expand-arrows")
        minMaxBtn.children[0].classList.remove("collapse-arrows")
      }

      //Show the buttons text only if the console height is smaller than showTextThreshold
      if (consoleHeight < showTextThreshold) {
        textIcon.forEach(text => {
          text.classList.remove("hiddenV")
        })
      }
    }

    // UP (Console expand)
    /*Note: Unlike the horizontal resizer, to decide how much the console should be able to expand the height of the editor is used rather than the console height.
    This is to assure be responsiveness, since it is easier to know how small the editor can be in any screen size.*/
    if (deltaY < 0) {
      const editorHeight = Math.round(parseInt(getComputedStyle(editorContainer).height) + deltaY)
      editorContainer.style.flex = `0 ${editorHeight < consoleExpandThreshold ? consoleExpandFinal : editorHeight}px`
      consoleContainer.style.flex = "1 0"

      //If the console is not fully collapse, update the console element state to expanded and show the collapse arrows icon
      if (editorHeight > minExpandedConsole) {
        consoleElement.classList.remove("collapsed")
        consoleElement.classList.add("expanded")

        minMaxBtn.children[0].children[0].setAttribute("d", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H296c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272H216c13.3 0 24 10.7 24 24V440c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z")
        minMaxBtn.children[0].classList.remove("expand-arrows")
        minMaxBtn.children[0].classList.add("collapse-arrows")
      }

      //Hide the buttons text when the editors height is smaller than the hideTextThreshold
      if (editorHeight < hideTextThreshold) {
        textIcon.forEach(text => {
          text.classList.add("hiddenV")
        })
      }
    }
  }
}

/**
 * Function to remove the mousemove and mouseup events
 * and stop the onmousemoveY and onmouseupY functions
 * @param {event} e - the mouseup event
 */
function onmouseupY(e) {
  e.preventDefault()
  document.removeEventListener("mousemove", onmousemoveY)
  document.removeEventListener("mouseup", onmouseupY)
  delete e.clientY
}