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
 * @file The `validation.js` contains the related html elements for the validation view, as
 * well as the behaviour for the validation button on the main navigation menu
 */

export const validationView = document.querySelector("#validation-view")
export const validationTab = document.querySelector("#validation-tab")
const validationBtn = document.querySelector("#validate-btn")
export const autoValidateBtn = document.querySelector("#auto-validate")
export const resetLoggingBtn = document.querySelector("#reset-logging")
export const validateJsonLdBtn = document.querySelector("#validate-jsonld")
export const tmConformanceBtn = document.querySelector("#tm-conformance")
export const sectionHeaders = document.querySelectorAll("#validation-view .section-header")

//Open validation with menu btn
validationBtn.addEventListener("click", () => {
    validationTab.click()
})