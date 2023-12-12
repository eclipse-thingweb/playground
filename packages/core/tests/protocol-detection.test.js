/*
 *  Copyright (c) 2022 Contributors to the Eclipse Foundation
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
const { detectProtocolSchemes } = require("../index");
const tdValidator = require("../index").tdValidator;

const rootDir = path.join("./", "tests");

const dirPath = path.join(rootDir, "protocol-detection");
const fileNames = fs.readdirSync(dirPath);
const refResult = {
    report: {
        json: "passed",
        schema: "passed",
        defaults: expect.stringMatching(/warning|passed/),
        jsonld: "passed",
        additional: "passed",
    },
    details: {
        enumConst: "passed",
        propItems: "passed",
        security: "passed",
        propUniqueness: "passed",
        multiLangConsistency: "passed",
        linksRelTypeCount: "passed",
        readWriteOnly: "passed",
        uriVariableSecurity: "passed",
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
                    const tdJson = JSON.parse(tdToTest);
                    const protocolSchemes = tdJson.protocolSchemes;

                    if (protocolSchemes.length === 0) {
                        expect(detectProtocolSchemes(tdToTest)).toEqual([]);
                    } else {
                        expect(detectProtocolSchemes(tdToTest)).toEqual(expect.arrayContaining(protocolSchemes));
                    }
                    done();
                },
                (errTwo) => {
                    done(errTwo);
                }
            );
        });
    });
});
