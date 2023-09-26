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
 * @file The `examples-menu.js` contains the main functionality
 * for the examples menu, such as displaying all the TD and TM examples,
 * as well as filtering them by categories, a search function to find
 * specific examples and a use a template example to directly added to an editor where it can be utilized and modified.
 * In the future the option to see short snipets of the most important part of the example, might also be implemented.
 */

import { createIde, ideCount } from "./editor"

/***********************************************************/
/*                      Examples menu                      */
/***********************************************************/
const closeExamples = document.querySelector(".examples-menu-container__close i")
const examplesMenu = document.querySelector(".examples-menu")
const examplesBtn = document.querySelector("#examples-btn")
const thingTypeSelect = document.querySelector('#thing-type')
const categorySelect = document.querySelector('#thing-category')
const filterForm = document.querySelector('.examples-menu-container__filter')
const tdExamplesContainer = document.querySelector(".examples-container__td")
const tmExamplesContainer = document.querySelector(".examples-container__tm")
const searchInput = document.querySelector(".search-input")
const tdSearchResults = tdExamplesContainer.querySelector("#filtered-results")
const tmSearchResults = tmExamplesContainer.querySelector("#filtered-results")

/**
 * Close examples menu when clicking on x icon and
 * clearing all info inside the examples menu
 */
closeExamples.addEventListener("click", () => {
    examplesMenu.classList.add("closed")
})

/**
 * Open examples menu when clicking on examples btn
 * as well as populating the examples and filter selects
 */
examplesBtn.addEventListener("click", () => {
    examplesMenu.classList.remove("closed")
    filterThingType()
})


/***   Creating categories arrays and populating them with async call  ***/
let tdCategories = []
let tmCategories = []
getCategories()

/**
 * Get all the td and tm names, description and id from the paths file
 */
async function getCategories() {
    const res = await fetch('./examples-paths/examples-paths.json')
    const data = await res.json()

    const categoriesTD = Object.entries(data["td"])
    categoriesTD.forEach(category => {

        const newCategory = {
            name: "",
            description: "",
            id: ""
        }

        //Removing all "-" from the category to use as the name
        newCategory["name"] = (category[0].substring(category[0].indexOf("-") + 1)).replaceAll('-', ' ')

        //Use the category as the id
        newCategory["id"] = category[0]

        //get the description text
        newCategory["description"] = category[1]["description"]

        //Push to the td categories array
        tdCategories.push(newCategory)
    })

    const categoriesTM = Object.entries(data["tm"])
    categoriesTM.forEach(category => {

        const newCategory = {
            name: "",
            description: "",
            id: ""
        }

        //Removing all "-" from the category to use as the name
        newCategory["name"] = (category[0].substring(category[0].indexOf("-") + 1)).replaceAll('-', ' ')

        //use the category as the id
        newCategory["id"] = category[0]

        //get the description text
        newCategory["description"] = category[1]["description"]

        //Push to the td categories array
        tmCategories.push(newCategory)
    })

    populateCategories()
}

/**
 * Checks the TD/TM select and updates the categories select respectively
 */
function filterThingType() {
    //Clear all elments inside the categories select
    const selectOptions = [...categorySelect.options]
    selectOptions.forEach(option => {
        option.remove()
    })

    if (thingTypeSelect.value === "thing-description") {
        tdExamplesContainer.classList.remove("hidden")
        tmExamplesContainer.classList.add("hidden")
        tdCategories.forEach(category => {
            const opt = document.createElement('option')
            opt.value = category.id
            opt.innerText = category.name
            categorySelect.appendChild(opt)
        })
    }

    if (thingTypeSelect.value === "thing-model") {
        tmExamplesContainer.classList.remove("hidden")
        tdExamplesContainer.classList.add("hidden")
        tmCategories.forEach(category => {
            const opt = document.createElement('option')
            opt.value = category.id
            opt.innerText = category.name
            categorySelect.appendChild(opt)
        })
    }
}

/**
 * Event listeners to check for changes and scroll to the respective category
 */
thingTypeSelect.addEventListener("change", () => {
    filterThingType()
    const element = document.getElementById(categorySelect.value);
    element.scrollIntoView({ behavior: "smooth", block: "start" })
})
categorySelect.addEventListener("change", () => {
    const element = document.getElementById(categorySelect.value);
    element.scrollIntoView({ behavior: "smooth", block: "start" })
})


/**
 * Creates all the html container elements for the TD and TM categories
 * and initializes the getAllExamples function
 */
function populateCategories() {
    tdCategories.forEach(category => {
        const categoryContainer = document.createElement('div')
        categoryContainer.classList.add("examples-category")
        categoryContainer.setAttribute("data-category", category.id)
        categoryContainer.setAttribute("id", category.id)
        tdExamplesContainer.appendChild(categoryContainer)

        const categoryTitle = document.createElement('div')
        categoryTitle.classList.add("examples-category__title")
        categoryContainer.appendChild(categoryTitle)

        const title = document.createElement('h3')
        title.innerText = category.name
        categoryTitle.appendChild(title)

        const categoryDescription = document.createElement('div')
        categoryDescription.classList.add("examples-category__description")
        categoryContainer.appendChild(categoryDescription)

        const description = document.createElement('p')
        description.innerText = category.description
        categoryDescription.appendChild(description)

        const categoryContent = document.createElement('div')
        categoryContent.classList.add("examples-category__container")
        categoryContainer.appendChild(categoryContent)

        getAllExamples(category.id, "td")
    })

    tmCategories.forEach(category => {
        const categoryContainer = document.createElement('div')
        categoryContainer.classList.add("examples-category")
        categoryContainer.setAttribute("data-category", category.id)
        categoryContainer.setAttribute("id", category.id)
        tmExamplesContainer.appendChild(categoryContainer)

        const categoryTitle = document.createElement('div')
        categoryTitle.classList.add("examples-category__title")
        categoryContainer.appendChild(categoryTitle)

        const title = document.createElement('h3')
        title.innerText = category.name
        categoryTitle.appendChild(title)

        const categoryDescription = document.createElement('div')
        categoryDescription.classList.add("examples-category__description")
        categoryContainer.appendChild(categoryDescription)

        const description = document.createElement('p')
        description.innerText = category.description
        categoryDescription.appendChild(description)

        const categoryContent = document.createElement('div')
        categoryContent.classList.add("examples-category__container")
        categoryContainer.appendChild(categoryContent)

        getAllExamples(category.id, "tm")
    })
}


/**
 * Utilizes the paths file to get all examples from github
 * and calls the create example function with the id and raw path
 * @param {string} categoryId - the name of the category
 * @param {string} thingType - td or tm
 */
async function getAllExamples(categoryId, thingType) {

    const res = await fetch('./examples-paths/examples-paths.json')
    const data = await res.json()

    const examples = Object.entries(data[thingType][categoryId]["examples"])

    for (const example of examples) {

        //get category
        const categoryContainer = document.querySelector(`[data-category='${categoryId}'] .examples-category__container`)

        //individual examples
        const exampleContainer = document.createElement('div')
        exampleContainer.classList.add("example")
        categoryContainer.appendChild(exampleContainer)

        //create example title
        const exampleName = document.createElement('div')
        exampleName.classList.add("example__name")
        const exampleNameIcon = document.createElement('i')
        exampleNameIcon.classList.add("fa-solid", "fa-file-code")
        exampleName.appendChild(exampleNameIcon)
        const exampleNameTitle = document.createElement('p')
        exampleNameTitle.innerText = example[1]["title"]
        // exampleNameTitle.innerText = data['$title']
        exampleName.appendChild(exampleNameTitle)
        exampleContainer.appendChild(exampleName)

        //add event listener to show example information and interaction btns
        exampleName.addEventListener('click', () => {
            exampleName.parentElement.classList.toggle("open")
        })

        //create example content
        const exampleContent = document.createElement('div')
        exampleContent.classList.add("example__content")
        exampleContainer.appendChild(exampleContent)

        const exampleDescription = document.createElement('p')
        exampleDescription.innerText = example[1]["description"]
        exampleDescription.classList.add('example__description')
        exampleContent.appendChild(exampleDescription)

        const exampleBtns = document.createElement('div')
        exampleBtns.classList.add("example__btn")
        exampleContent.appendChild(exampleBtns)

        const exampleBtnUse = document.createElement('button')
        exampleBtnUse.classList.add("example__btn--use")
        exampleBtns.appendChild(exampleBtnUse)

        const exampleBtnShow = document.createElement('button')
        exampleBtnShow.classList.add("example__btn--show")
        exampleBtns.appendChild(exampleBtnShow)

        const exampleIconShow = document.createElement('i')
        exampleIconShow.classList.add("fa-solid", "fa-eye")
        exampleBtnShow.appendChild(exampleIconShow)

        const exampleTxtShow = document.createElement('p')
        exampleTxtShow.innerText = "Show Snipet"
        exampleBtnShow.appendChild(exampleTxtShow)

        const exampleIconUse = document.createElement('i')
        exampleIconUse.classList.add("fa-solid", "fa-file-pen")
        exampleBtnUse.appendChild(exampleIconUse)

        const exampleTxtUse = document.createElement('p')
        exampleTxtUse.innerText = "Use as Template"
        exampleBtnUse.appendChild(exampleTxtUse)

        //Listener to generate an editor with the examples information
        exampleBtnUse.addEventListener('click', () => {
            getTemplateData(example[1]["path"])
            exampleName.parentElement.classList.toggle("open")
        })
    }
}

/**
 * Gets the example data to pupulate the monaco editor and allow the user to use it as a template
 */
async function getTemplateData(path) {
    const res = await fetch(path)
    const data = await res.json()
    createIde(++ideCount.ideNumber, data)
    examplesMenu.classList.add("closed")
}

/**
 * Listener when search input is used in the examples menu
 * Gets all the examples that match the inputed text to the title and
 * description of the examples, clones them and adds them to the
 * search result category
 * @param {event} e - submit event
 */
filterForm.addEventListener("submit", (e) => {
    e.preventDefault()

    //Check if the thingType select is TD or TM
    if (thingTypeSelect.value === "thing-description") {
        //Only ge the container for the searched results
        const examplesContainer = tdSearchResults.querySelector(".examples-category__container")
        //Clean all the children component
        while (examplesContainer.children.length > 0) {
            examplesContainer.firstElementChild.remove()
        }
        //Show the td examples container and hide the tm examples container
        tdSearchResults.classList.remove("hidden")
        tmSearchResults.classList.add("hidden")

        //Get all the categories and their title and description values
        const categories = tdExamplesContainer.querySelectorAll(".examples-category:not(:first-child)")
        categories.forEach(category => {
            const examples = [...category.children[2].children]
            examples.forEach(example => {
                //If value of the search input mataches the title or description
                //clone it, append it and add the respective event listeners
                if ((example.firstChild.childNodes[1].innerText.toLowerCase()).includes(searchInput.value.toLowerCase()) || (example.children[1].children[0].innerText.toLowerCase()).includes(searchInput.value.toLowerCase())) {
                    let clonedElement = example.cloneNode(true)
                    clonedElement.children[0].addEventListener('click', () => {
                        clonedElement.classList.toggle("open")
                    })

                    clonedElement.querySelector(".example__btn--use").addEventListener('click', () => {
                        example.querySelector(".example__btn--use").click()
                        clonedElement.classList.toggle("open")
                    })
                    examplesContainer.appendChild(clonedElement)
                }
                //If input value is empty clear all the search results and hide the category
                if (searchInput.value === "") {
                    while (examplesContainer.children.length > 0) {
                        examplesContainer.firstElementChild.remove()
                    }
                    tdSearchResults.classList.add("hidden")
                }
            })
        })
    }
    else {
        const examplesContainer = tmSearchResults.querySelector(".examples-category__container")
        while (examplesContainer.children.length > 0) {
            examplesContainer.firstElementChild.remove()
        }
        tmSearchResults.classList.remove("hidden")
        tdSearchResults.classList.add("hidden")
        const categories = tmExamplesContainer.querySelectorAll(".examples-category:not(:first-child)")
        categories.forEach(category => {
            const examples = [...category.children[2].children]
            examples.forEach(example => {
                if ((example.firstChild.childNodes[1].innerText.toLowerCase()).includes(searchInput.value.toLowerCase()) || (example.children[1].children[0].innerText.toLowerCase()).includes(searchInput.value.toLowerCase())) {
                    let clonedElement = example.cloneNode(true)
                    clonedElement.children[0].addEventListener('click', () => {
                        clonedElement.classList.toggle("open")
                    })

                    clonedElement.querySelector(".example__btn--use").addEventListener('click', () => {
                        example.querySelector(".example__btn--use").click()
                        clonedElement.classList.toggle("open")
                    })
                    examplesContainer.appendChild(clonedElement)
                }

                if (searchInput.value === "") {
                    while (examplesContainer.children.length > 0) {
                        examplesContainer.firstElementChild.remove()
                    }
                    tmSearchResults.classList.add("hidden")
                }
            })
        })
    }
})