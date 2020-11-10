const fs = require("fs")
const path = require("path")
const tdValidator = require("../index")

const rootDir = path.join("./", "examples", "tds")

const dirPath = path.join(rootDir, "valid")
const fileNames = fs.readdirSync(dirPath)
const refResult = {
    report: {
        json: 'passed',
        schema: 'passed',
        defaults: expect.stringMatching(/warning|passed/),
        jsonld: 'passed',
        additional: 'passed'
    },
    details: {
        enumConst: 'passed',
        propItems: 'passed',
        security: 'passed',
        propUniqueness: 'passed',
        multiLangConsistency: 'passed',
        readWriteOnly: 'passed'
    },
    detailComments: expect.any(Object)
}
fileNames.forEach( fileName => {
    test(fileName, done => {
    const tdToTest = fs.readFile(path.join(dirPath, fileName), "utf-8", (err, tdToTest) => {
            if (err) {done(err)}
            const result = tdValidator(tdToTest, ()=>{},{}).then( result => {
                expect(result).toEqual(refResult)
                done()
            }, err => {done(err)})
        })
    })
})