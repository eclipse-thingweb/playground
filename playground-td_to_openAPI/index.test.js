/* *******************************************************************************
 * Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/

const fs = require("fs")
const toOAP = require("./index.js")
const td = require("./examples/td.json")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}
const oapJson = fs.readFileSync("./examples/openapi.json", "utf-8")
const oapYaml = fs.readFileSync("./examples/openapi.yaml", "utf-8")

test("test the whole openAPI convertion", () => {
    expect.assertions(2) /* openAPI validation also promisfied */
    return toOAP(td).then( apiSpec => {
        const filename = td.title === undefined ? "untitled" : td.title
        const jsonString = JSON.stringify(apiSpec.json, undefined, 2)
        fs.writeFileSync("./out/1.json", jsonString)
        fs.writeFileSync("./out/1.yaml", apiSpec.yaml)
        console.log(JSON.stringify(apiSpec.json, undefined, 4))

        expect(jsonString).toBe(oapJson)
        expect(apiSpec.yaml).toBe(oapYaml)
    }, err => {
        console.error(err)
    })
})

