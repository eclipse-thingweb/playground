const fs = require("fs")
const path = require("path")
const { detectProtocolSchemes } = require("../index")
const tdValidator = require("../index").tdValidator

const rootDir = path.join("./", "tests")

const dirPath = path.join(rootDir, "protocol-detection")
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
        readWriteOnly: 'passed',
        uriVariableSecurity: 'passed'
    },
    detailComments: expect.any(Object)
}
fileNames.forEach( fileName => {
    test(fileName, done => {
    fs.readFile(path.join(dirPath, fileName), "utf-8", (err, tdToTest) => {
            if (err) {done(err)}
            tdValidator(tdToTest, ()=>{},{}).then( result => {
                const tdJson = JSON.parse(tdToTest)
                const protocolSchemes = tdJson.protocolSchemes
                expect(detectProtocolSchemes(tdToTest)).toEqual(expect.arrayContaining(protocolSchemes))
                done()
            }, errTwo => {done(errTwo)})
        })
    })
})