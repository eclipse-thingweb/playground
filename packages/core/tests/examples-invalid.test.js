const fs = require("fs")
const path = require("path")
const tdValidator = require("../index")

const rootDir = path.join("./", "examples", "tds")

const dirPath = path.join(rootDir, "invalid")
const fileNames = fs.readdirSync(dirPath)
const refResult = {
    report: {
        json: 'passed',
        schema: 'failed',
        defaults: null,
        jsonld: null,
        additional: null
    },
    details: {
        enumConst: null,
        propItems: null,
        security: null,
        propUniqueness: null,
        multiLangConsistency: null,
        readWriteOnly: null
    },
    detailComments: expect.any(Object)
}
const refResultAdd = {
    report: {
        json: 'passed',
        schema: 'passed',
        defaults: "warning",
        jsonld: "passed",
        additional: "failed"
    },
    details: {
        enumConst: expect.stringMatching(/failed|passed/),
        propItems: expect.stringMatching(/failed|passed/),
        security: expect.stringMatching(/failed|passed/),
        propUniqueness: expect.stringMatching(/failed|passed/),
        multiLangConsistency: expect.stringMatching(/failed|passed/),
        readWriteOnly: expect.stringMatching(/failed|passed/)
    },
    detailComments: expect.any(Object)
}
fileNames.forEach( fileName => {
    test(fileName, done => {
    fs.readFile(path.join(dirPath, fileName), "utf-8", (err, tdToTest) => {
            if (err) {done(err)}
            tdValidator(tdToTest, ()=>{},{}).then( result => {
                if (result.report.schema === "failed") {
                    expect(result).toEqual(refResult)
                }
                else {
                    expect(result).toEqual(refResultAdd)
                }
                done()
            }, errTwo => {done(errTwo)})
        })
    })
})
