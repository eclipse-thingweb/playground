const jsonSpellChecker = require("../../index")
const tdSchema = require('../schema/td-schema.json')
const td = require('../json/td-example.json')

jsonSpellChecker.configure(tdSchema, 0.85, 2)
const typos = jsonSpellChecker.checkTypos(JSON.stringify(td))
console.log(typos)