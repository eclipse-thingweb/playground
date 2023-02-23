const  { describe, test, expect, beforeAll } = require('@jest/globals')
const tdSchema = require('./examples/schema/td-schema.json')
const tdExample = require('./examples/json/td-example.json')
const openApiSchema = require('./examples/schema/open-api-schema.json')
const openApiExample = require('./examples/json/open-api-example.json')
const jsonSpellChecker = require('./index')

describe('checkTypos', () => {
    describe('with TD JSON schema', () => {
        beforeAll(() =>{
            jsonSpellChecker.configure(tdSchema)
        })
    
        test('should return correct amount of typos', () => {
            const typos = jsonSpellChecker.checkTypos(JSON.stringify(tdExample))
            expect(typos.length).toBe(tdExample.typoCount)
        })
    })
    
    describe('with Open API JSON schema', () => {
        beforeAll(() =>{
            jsonSpellChecker.configure(openApiSchema)
        })
    
        test('should return correct amount of typos', () => {
            jsonSpellChecker.configure(openApiSchema)
            const typos = jsonSpellChecker.checkTypos(JSON.stringify(openApiExample))
            expect(typos.length).toBe(openApiExample.typoCount)
        })
    })
})