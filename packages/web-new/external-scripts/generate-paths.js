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

async function getExamples(){
    const files = await fs.readdir(initialPath)

    const examplesPaths = {}

    for(const file of files){
        examplesPaths[file] = {}

        const categories = await fs.readdir(path.join(initialPath, file))

        //sorting them by the first number in their name
        categories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

        for(const category of categories){

            const examples = await fs.readdir(path.join(initialPath, file, category))

            //for each category, create a description with the path to the readMe file, and an examples object to store all the respective exampele
            examplesPaths[file][category] = {
                "description": "",
                "examples": {}
            }

            for(const example of examples){
                if(path.extname(example) == ".txt"){
                    try {
                        const categoryDescription = await fs.readFile(path.join(initialPath, file, category, example), 'utf8')
                        examplesPaths[file][category]["description"] = categoryDescription
                    } catch (err) {
                        console.error("Failed to read file: ", err);
                    }
                }

                if(path.extname(example) == ".jsonld"){
                    const exampleData = JSON.parse(await fs.readFile(path.join(initialPath, file, category, example), 'utf8'))
                    const exampleTitle = exampleData["$title"]
                    const exampleDescription = exampleData["$description"]
                    examplesPaths[file][category]["examples"][example] = {
                        "title": exampleTitle,
                        "description": exampleDescription,
                        "path": `${rawFilePath}/${file}/${category}/${example}`
                    }
                }
            }
        }
    }

    return examplesPaths
}

async function writeExamplesToFile(){
    const examplesData = await getExamples()
    console.log(examplesData);
    
    try {
        const jsonData = JSON.stringify(examplesData, null, 2)
        const filePath = "./src/examples-paths/examples-paths.json"
        await fs.writeFile(filePath, jsonData, 'utf-8')
        console.log("File created succesfully");
        
    } catch (err) {
        console.error("Failed to wirte JSON file: ", err);
    }
}

writeExamplesToFile()