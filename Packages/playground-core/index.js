/**
 * Core functionality of the Thing Description Playground
 */
const jsonld = require('jsonld');
const Ajv = require('ajv');

export default function tdValidator(tdString) {
    td = JSON.parse(tdString)
}