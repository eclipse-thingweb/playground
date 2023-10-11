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
 * @file The `examples.js` generates a json file
 * with all the links, title and descriptions of the TD and TM examples in the 
 * main github repository utilizing the examples folder
 */

const fs = require('fs').promises;
const path = require('path');
//path to where all the td/tm examples
const initialPath = "../../examples";
//path to the get the raw files from the github
const rawFilePath = "https://raw.githubusercontent.com/eclipse-thingweb/playground/master/examples"

async function getExamples() {
    const files = await fs.readdir(initialPath)

    const examplesPaths = {}

    for (const file of files) {
        examplesPaths[file] = {}

        const categories = await fs.readdir(path.join(initialPath, file))

        //sorting them by the first number in their name
        categories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

        for (const category of categories) {

            const examples = await fs.readdir(path.join(initialPath, file, category))

            //for each category, create a description with the path to the readMe file, and an examples object to store all the respective exampele
            examplesPaths[file][category] = {
                "description": "",
                "examples": {}
            }

            for (const example of examples) {

                if (path.extname(example) == ".txt") {
                    try {
                        const categoryDescription = await fs.readFile(path.join(initialPath, file, category, example), 'utf8')
                        examplesPaths[file][category]["description"] = categoryDescription
                    } catch (err) {
                        console.error("Failed to read file: ", err);
                    }
                } else if (path.extname(example) == ".jsonld" || path.extname(example) == ".json") {
                    const exampleData = JSON.parse(await fs.readFile(path.join(initialPath, file, category, example), 'utf8'))
                    const exampleTitle = exampleData["$title"]
                    const exampleDescription = exampleData["$description"]
                    examplesPaths[file][category]["examples"][example] = {
                        "title": exampleTitle,
                        "description": exampleDescription,
                        "path": `${rawFilePath}/${file}/${category}/${example}`
                    }
                } else {
                    //Do nothing
                }
            }
        }
    }

    return examplesPaths
}

async function writeExamplesToFile() {
    const examplesData = await getExamples()

    try {
        const jsonData = JSON.stringify(examplesData, null, 2)
        const filePath = "./src/examples-paths/examples-paths.json"
        await fs.writeFile(filePath, jsonData, 'utf-8')
        console.log("File created succesfully")

    } catch (err) {
        console.error("Failed to wirte JSON file: ", err)
    }
}

writeExamplesToFile()