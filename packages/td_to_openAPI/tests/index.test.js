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
 * @file Test the functionality of this package by snapshot comparison.
 */

const fs = require("fs");
const toOAP = require("../index.js");
const td = require("../examples/td.json");

if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
}
const removeExample = (key, value) => (key === "example" ? undefined : value);

// remove examples for testing, since they are random generated
let oapJson = fs.readFileSync("./examples/openapi.json", "utf-8");
oapJson = JSON.parse(oapJson);
oapJson = JSON.stringify(oapJson, removeExample, 2);

test("test the whole openAPI convertion", () => {
    expect.assertions(1);

    return toOAP(td).then(
        (apiSpec) => {
            // write output
            fs.writeFileSync("./out/1.json", JSON.stringify(apiSpec.json, undefined, 2));
            fs.writeFileSync("./out/1.yaml", apiSpec.yaml);

            // test equality without examples
            const jsonString = JSON.stringify(apiSpec.json, removeExample, 2);
            expect(jsonString).toBe(oapJson);
        },
        (err) => {
            console.error(err);
        }
    );
});
