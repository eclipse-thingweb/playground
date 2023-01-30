const jsonSpellChecker = require("../../index")
const openApiSchema = require('../schema/open-api-schema.json')
const openApiJson = require('../json/open-api-example.json')

jsonSpellChecker.configure(openApiSchema, 0.85, 2)
const typos = jsonSpellChecker.checkTypos(JSON.stringify(openApiJson))
console.log(typos)