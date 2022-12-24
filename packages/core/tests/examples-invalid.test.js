const fs = require("fs")
const path = require("path")
const tdValidator = require("../index").tdValidator
const tmValidator = require("../index").tmValidator

const tdRootDir = path.join("./", "examples", "tds")
const tmRootDir = path.join("./", "examples", "tms")
const tdDirPath = path.join(tdRootDir, "invalid")
const tmDirPath = path.join(tmRootDir, "valid")

const tdFileNames = fs.readdirSync(tdDirPath)
const tmFileNames = fs.readdirSync(tmDirPath)

const tdRefResult = {
    report: {
        json: 'passed',
        schema: 'failed',
        defaults: null,
        jsonld: null,
        additional: null
    },
    details: {
        enumConst: null,
        linkedAffordances: null,
        linkedStructure: null,
        propItems: null,
        security: null,
        propUniqueness: null,
        multiLangConsistency: null,
        linksRelTypeCount: null,
        readWriteOnly: null,
        uriVariableSecurity: null
    },
    detailComments: expect.any(Object)
}

const tmRefResult = {
    report: {
        json: 'passed',
        schema: 'passed',
        defaults: null,
        jsonld: 'passed',
        additional: 'passed'
    },
    details: {
        enumConst: 'passed',
        propItems: 'passed',
        propUniqueness: 'passed',
        multiLangConsistency: 'passed',
        linksRelTypeCount: 'passed',
        readWriteOnly: 'passed',
        tmOptionalPointer: 'passed'
    },
    detailComments: expect.any(Object)
}

const refResultAdd = {
    report: {
        json: 'passed',
        schema: 'passed',
        defaults: expect.stringMatching(/warning|passed/),
        jsonld: "passed",
        additional: "failed"
    },
    details: {
        enumConst: expect.stringMatching(/failed|passed/),
        linkedAffordances: expect.stringMatching(/warning|not-impl|pass|failed/),
        linkedStructure: 'not-impl',
        propItems: expect.stringMatching(/failed|passed/),
        security: expect.stringMatching(/failed|passed/),
        propUniqueness: expect.stringMatching(/failed|passed/),
        multiLangConsistency: expect.stringMatching(/failed|passed/),
        linksRelTypeCount: expect.stringMatching(/failed|passed/),
        readWriteOnly: expect.stringMatching(/failed|passed/),
        uriVariableSecurity: expect.stringMatching(/failed|passed/)
    },
    detailComments: expect.any(Object)
}

for (const fileNames of [tdFileNames, tmFileNames]) {
    let validator; let dirPath; let refResult
    if (fileNames === tdFileNames) {
        validator = tdValidator
        dirPath = tdDirPath
        refResult = tdRefResult
    } else {
        validator = tmValidator
        dirPath = tmDirPath
        refResult = tmRefResult
    }

    fileNames.forEach(fileName => {
        test(fileName, done => {
            fs.readFile(path.join(dirPath, fileName), "utf-8", (err, docToTest) => {
                if (err) { done(err) }
                validator(docToTest, () => { }, {}).then(result => {
                    if (fileNames === tmFileNames || result.report.schema === "failed") {
                        expect(result).toEqual(refResult)
                    }
                    else {
                        expect(result).toEqual(refResultAdd)
                    }
                    done()
                }, errTwo => { done(errTwo) })
            })
        })
    })
}
