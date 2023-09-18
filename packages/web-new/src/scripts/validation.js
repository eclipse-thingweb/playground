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