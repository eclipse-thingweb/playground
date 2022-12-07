const fs = require("fs")
const path = require("path")
const checkTypos = require("../index").checkTypos
const tdValidator = require("../index").tdValidator

const rootDir = path.join("./", "tests")

const dirPath = path.join(rootDir, "typo")
const fileNames = fs.readdirSync(dirPath)
const refResult = {
    report: {
        json: 'passed',
        schema: 'passed',
        defaults: expect.stringMatching(/warning|passed/),
        jsonld: 'passed',
        additional: expect.stringMatching(/warning|passed/)
    },
    details: {
        enumConst: expect.stringMatching(/failed|warning|passed/),
        propItems: expect.stringMatching(/failed|warning|passed/),
        security: expect.stringMatching(/failed|warning|passed/),
        propUniqueness: expect.stringMatching(/failed|warning|passed/),
        multiLangConsistency: expect.stringMatching(/failed|warning|passed/),
        linksRelTypeCount: expect.stringMatching(/failed|warning|passed/),
        readWriteOnly: expect.stringMatching(/failed|warning|passed/),
        uriVariableSecurity: expect.stringMatching(/failed|warning|passed/)
    },
    detailComments: expect.any(Object)
}
fileNames.forEach( fileName => {
    test(fileName, done => {
    fs.readFile(path.join(dirPath, fileName), "utf-8", (err, tdToTest) => {
            if (err) {done(err)}
            tdValidator(tdToTest, ()=>{},{}).then( result => {
                expect(result).toEqual(refResult)
                const tdJson = JSON.parse(tdToTest)
                const typoCount = tdJson.typoCount
                expect(checkTypos(tdToTest).length).toEqual(typoCount)
                done()
            }, errTwo => {done(errTwo)})
        })
    })
})
