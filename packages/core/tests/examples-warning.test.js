const fs = require("fs")
const path = require("path")
const tdValidator = require("../index").tdValidator

const rootDir = path.join("./", "examples", "tds")

const dirPath = path.join(rootDir, "warning")
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
        enumConst: expect.stringMatching(/warning|passed/),
        linkedAffordances: expect.stringMatching(/warning|not-impl|pass/),
        linkedStructure: expect.stringMatching(/warning|not-impl/),
        propItems: expect.stringMatching(/warning|passed/),
        security: expect.stringMatching(/warning|passed/),
        propUniqueness: expect.stringMatching(/warning|passed/),
        multiLangConsistency: expect.stringMatching(/warning|passed/),
        linksRelTypeCount: expect.stringMatching(/warning|passed/),
        readWriteOnly: expect.stringMatching(/warning|passed/),
        uriVariableSecurity: expect.stringMatching(/warning|passed/)
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
