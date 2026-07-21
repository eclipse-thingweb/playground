/*
 *  Copyright (c) 2026 Contributors to the Eclipse Foundation
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
 * @file The `post-message.js` implements the browser `postMessage` API
 * communication feature. When the playground is opened by another web
 * application (in a new window or tab), it notifies the opener that it is
 * ready to receive a Thing Description. The parent application can then send
 * a Thing Description which, after user confirmation, is loaded into a new
 * editor tab.
 *
 * Message contract:
 * - Playground -> opener: { type: "EDITDOR_READY" }
 * - opener -> Playground: {
 *       type: "LOAD_TD",
 *       description: "text shown in the confirmation dialog",
 *       payload: "<valid JSON string containing the Thing Description>"
 *   }
 */

import { createIde, ideCount } from "./editor.js";

const READY_MESSAGE_TYPE = "EDITDOR_READY";
const LOAD_TD_MESSAGE_TYPE = "LOAD_TD";

//DOM elements of the confirmation dialog
const postMessageDialog = document.querySelector(".post-message-dialog");
const postMessageContainer = document.querySelector(".post-message-dialog__container");
const postMessageDescription = document.querySelector("#post-message-description");
const postMessageConfirmBtn = document.querySelector("#post-message-confirm-btn");
const postMessageCancelBtn = document.querySelector("#post-message-cancel-btn");

//Holds the parsed Thing Description waiting for the user's confirmation
let pendingThingDescription = null;
let readyInterval = null;
/**
 * Notify the opener window that the playground is ready to receive a
 * Thing Description. Only sent when the playground was actually opened by
 * another window/tab.
 */
function notifyOpenerReady() {
    if (!window.opener || window.opener.closed) return;

    // Keep announcing until the opener responds with LOAD_TD
    const send = () => window.opener.postMessage({ type: READY_MESSAGE_TYPE }, "*");
    send();
    readyInterval = setInterval(send, 300);

    // Give up after a while so we don't loop forever
    setTimeout(() => clearInterval(readyInterval), 10000);
}

/**
 * Open the confirmation dialog and display the provided description.
 * @param {String} description - text describing the incoming Thing Description
 */
function openDialog(description) {
    postMessageDescription.innerText = description;
    postMessageDialog.classList.remove("closed");
}

/**
 * Close the confirmation dialog and clear any pending Thing Description.
 */
function closeDialog() {
    postMessageDialog.classList.add("closed");
    pendingThingDescription = null;
}

/**
 * Handle incoming `message` events. Only messages of type `LOAD_TD` with a
 * valid JSON `payload` are processed. The user is always asked to confirm
 * before the Thing Description is loaded into the editor.
 * @param {MessageEvent} event - the received message event
 */
function handleMessage(event) {
    const data = event.data;

    //Ignore anything that is not a LOAD_TD message
    if (!data || typeof data !== "object" || data.type !== LOAD_TD_MESSAGE_TYPE) {
        return;
    }
    
    if (readyInterval) {
        clearInterval(readyInterval);
        readyInterval = null;
    }

    let thingDescription;
    try {
        thingDescription = JSON.parse(data.payload);
    } catch (err) {
        alert("Received Thing Description could not be loaded: payload is not valid JSON.");
        return;
    }

    pendingThingDescription = thingDescription;
    openDialog(typeof data.description === "string" ? data.description : "Imported TD");
}

//Confirm loading the received Thing Description into a new editor tab
postMessageConfirmBtn.addEventListener("click", () => {
    if (pendingThingDescription !== null) {
        createIde(++ideCount.ideNumber, pendingThingDescription);
    }
    closeDialog();
});

//Dismiss the received Thing Description without loading it
postMessageCancelBtn.addEventListener("click", () => {
    closeDialog();
});

//Close the dialog when clicking outside of it
document.addEventListener("click", (e) => {
    if (
        !postMessageDialog.classList.contains("closed") &&
        !postMessageContainer.contains(e.target)
    ) {
        closeDialog();
    }
});

window.addEventListener("message", handleMessage);

//Announce readiness to the opener as soon as the script is loaded
notifyOpenerReady();
