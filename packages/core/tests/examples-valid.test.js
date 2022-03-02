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
        linksRelTypeCount: 'passed',
        readWriteOnly: 'passed'
    },
    detailComments: expect.any(Object)
}
fileNames.forEach( fileName => {
    test(fileName, done => {
    fs.readFile(path.join(dirPath, fileName), "utf-8", (err, tdToTest) => {
            if (err) {done(err)}
            tdValidator(tdToTest, ()=>{},{}).then( result => {
                expect(result).toEqual(refResult)
                done()
            }, errTwo => {done(errTwo)})
        })
    })
})