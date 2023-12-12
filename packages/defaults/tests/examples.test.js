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

/**
 * @file Uses all valid TD examples from the core package to test this package.
 *       Call the add defaults function with every TD and check if defaults-schema passes.
 *       Call the remove defaults function with every TD and check if defaults-schema throws warning.
 *       Make sure for both functions that the TD output is still valid JSON and valid TD-schema-without-default-checking
 */

const fs = require("fs");
const { addDefaults, removeDefaults } = require("../index.js");
const tdValidator = require("@thing-description-playground/core").tdValidator;

if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
}

const directory = "../core/examples/tds/valid/";
const filenames = fs.readdirSync(directory);

describe("test if all valid TDs are properly EXTENDED by default values", () => {
    filenames.forEach((filename) => {
        const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"));
        test("testAll testing: " + filename, () => {
            expect.assertions(3);
            addDefaults(td);
            const extendedTdString = JSON.stringify(td, undefined, 2);
            fs.writeFileSync("./out/" + filename.slice(0, -5) + "_extended.json", extendedTdString);

            return tdValidator(extendedTdString, () => {}, { checkJsonLd: false, checkDefaults: true }).then(
                (result) => {
                    const report = result.report;
                    expect(report.json).toBe("passed");
                    expect(report.schema).toBe("passed");
                    expect(report.defaults).toBe("passed");
                }
            );
        });
    });
});

describe("test if all valid TDs are properly REDUCED by set default values", () => {
    filenames.forEach((filename) => {
        const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"));
        test("testAll testing: " + filename, () => {
            expect.assertions(3);
            removeDefaults(td);
            const reducedTdString = JSON.stringify(td, undefined, 2);
            fs.writeFileSync("./out/" + filename.slice(0, -5) + "_reduced.json", reducedTdString);

            return tdValidator(reducedTdString, () => {}, { checkJsonLd: false, checkDefaults: true }).then(
                (result) => {
                    const report = result.report;
                    expect(report.json).toBe("passed");
                    expect(report.schema).toBe("passed");
                    expect(report.defaults).toBe("warning");
                }
            );
        });
    });
});
