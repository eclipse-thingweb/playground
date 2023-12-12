/*
 *  Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

const fs = require("fs");
const path = require("path");
const tdValidator = require("../index").tdValidator;

const rootDir = path.join("./", "examples", "tds");

const dirPath = path.join(rootDir, "warning");
const fileNames = fs.readdirSync(dirPath);
const refResult = {
    report: {
        json: "passed",
        schema: "passed",
        defaults: expect.stringMatching(/warning|passed/),
        jsonld: "passed",
        additional: expect.stringMatching(/warning|passed/),
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
        uriVariableSecurity: expect.stringMatching(/warning|passed/),
    },
    detailComments: expect.any(Object),
};
fileNames.forEach((fileName) => {
    test(fileName, (done) => {
        fs.readFile(path.join(dirPath, fileName), "utf-8", (err, tdToTest) => {
            if (err) {
                done(err);
            }
            tdValidator(tdToTest, () => {}, {}).then(
                (result) => {
                    expect(result).toEqual(refResult);
                    done();
                },
                (errTwo) => {
                    done(errTwo);
                }
            );
        });
    });
});
