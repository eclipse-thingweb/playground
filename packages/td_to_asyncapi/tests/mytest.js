/**
 * @file Test the functionality of this package by snapshot comparison.
 */

const fs = require("fs")
const toAAP = require("../index.js")
const td = require("../examples/td.json")

toAAP(td).then( apiSpec => {
    console.log("OK")
}, err => {
    console.error(err)
})
