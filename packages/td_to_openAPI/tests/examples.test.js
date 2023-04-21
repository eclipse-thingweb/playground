/* 
 *   Copyright (c) 2023 Contributors to the Eclipse Foundation
 *   
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *   
 *   This program and the accompanying materials are made available under the
 *   terms of the Eclipse Public License v. 2.0 which is available at
 *   http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *   Document License (2015-05-13) which is available at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *   
 *   SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

/**
 * @file test if all valid TDs (core-package->examples->valid) are converted to valid openAPI instances
 *       (td_to_openAPI) validates against openAPI specification before returning the result.
 *       Finally writeout the resulting OAP instance to "./out".
 */

const fs = require("fs");
const toOAP = require("../index.js");

if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
}

const directory = "../core/examples/tds/valid/";
const filenames = fs.readdirSync(directory);
const all = filenames.length;

describe("test if all valid TDs are converted to valid openAPI instances", () => {
    filenames.forEach((filename) => {
        const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"));
        test("testAll testing: " + filename, () => {
            return toOAP(td).then((apiSpec) => {
                fs.writeFileSync(
                    "./out/" + filename.slice(0, -5) + "_openapi.json",
                    JSON.stringify(apiSpec.json, undefined, 2)
                );
                expect(apiSpec).toEqual(expect.any(Object));
            });
        });
    });
});
