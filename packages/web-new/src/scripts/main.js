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

import { visualizeTab } from './visualize'
import './editor'
import './json-yaml'
import './settings-menu'
import './save-menu'
import './examples-menu'
import {minMaxBtn} from './console'
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
  const l = resizerX.previousElementSibling
  const r = resizerX.nextElementSibling

  if (clientX > screen.width) {
    resizerX.clientX = screen.width
  }
  else if (clientX < 0) {
    resizerX.clientX = 0
  }
  else {
    resizerX.clientX = clientX

    // LEFT
    if (deltaX < 0) {
      const w = Math.round(parseInt(getComputedStyle(l).width) + deltaX)
      l.style.flex = `0 ${w < 45 ? 30 : w}px`
      r.style.flex = "1 0"
      if (w < 65) {
        textIcon.forEach(text => {
          text.classList.add("hiddenH")
        })
      }
    }

    // RIGHT
    if (deltaX > 0) {
      const w = Math.round(parseInt(getComputedStyle(l).width) + deltaX)
      l.style.flex = `0 ${w > 65 ? 80 : w}px`
      r.style.flex = "1 0"
      if (w > 65) {
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
  const t = resizerY.previousElementSibling
  const b = resizerY.nextElementSibling

  if (clientY > screen.height) {
    resizerY.clientY = screen.height
  }
  else if (clientY < 0) {
    resizerY.clientY = 0
  }
  else {
    resizerY.clientY = clientY
    // DOWN
    if (deltaY > 0) {
      const h = Math.round(parseInt(getComputedStyle(b).height) - deltaY)
      b.style.flex = `0 ${h < 50 ? 39 : h}px`
      t.style.flex = "1 0"

      if(h > 38){
        minMaxBtn.children[0].classList.add("fa-down-left-and-up-right-to-center")
        minMaxBtn.children[0].classList.remove("fa-up-right-and-down-left-from-center")
      }else{
        minMaxBtn.children[0].classList.remove("fa-down-left-and-up-right-to-center")
        minMaxBtn.children[0].classList.add("fa-up-right-and-down-left-from-center")
      }

      if (h < 445) {
        textIcon.forEach(text => {
          text.classList.remove("hiddenV")
        })
      }
    }
    // UP
    if (deltaY < 0) {
      const h = Math.round(parseInt(getComputedStyle(t).height) + deltaY)
      t.style.flex = `0 ${h < 210 ? 200 : h}px`
      b.style.flex = "1 0"

      if(h < 714){
        minMaxBtn.children[0].classList.add("fa-down-left-and-up-right-to-center")
        minMaxBtn.children[0].classList.remove("fa-up-right-and-down-left-from-center")
      }else{
        minMaxBtn.children[0].classList.remove("fa-down-left-and-up-right-to-center")
        minMaxBtn.children[0].classList.add("fa-up-right-and-down-left-from-center")
      }

      if (h < 310) {
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

  if(visualizeTab.checked === true){
    visualizeTab.click()
  }
}
