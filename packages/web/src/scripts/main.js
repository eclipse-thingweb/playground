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
      b.style.flex = `0 ${h < 55 ? 43 : h}px`
      t.style.flex = "1 0"

      if (h < 43) {
        consoleElement.classList.remove("expanded")
        consoleElement.classList.add("collapsed")

        minMaxBtn.children[0].children[0].setAttribute("d", "M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z")
        minMaxBtn.children[0].classList.add("expand-arrows")
        minMaxBtn.children[0].classList.remove("collapse-arrows")
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
      t.style.flex = `0 ${h < 225 ? 210 : h}px`
      b.style.flex = "1 0"

      if (h > 714) {
        consoleElement.classList.remove("collapsed")
        consoleElement.classList.add("expanded")

        minMaxBtn.children[0].children[0].setAttribute("d", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H296c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272H216c13.3 0 24 10.7 24 24V440c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z")
        minMaxBtn.children[0].classList.remove("expand-arrows")
        minMaxBtn.children[0].classList.add("collapse-arrows")
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
}
