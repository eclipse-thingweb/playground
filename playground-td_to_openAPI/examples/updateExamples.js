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
const toOAP = require("../index.js")
const td = require("./td.json")

toOAP(td).then( apiSpec => {
    fs.writeFileSync("./examples/openapi.json", JSON.stringify(apiSpec.json, undefined, 2))
    fs.writeFileSync("./examples/openapi.yaml", apiSpec.yaml)

    console.log("updated examples")
}, err => {
    console.error(err)
})