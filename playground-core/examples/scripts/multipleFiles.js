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

// Test utility to test index.js
const tdValidator = require("../../index")
const fs = require("fs")

const tdArray = []
tdArray.push(fs.readFileSync("../tds/valid/simple.json", "utf-8"), fs.readFileSync("../tds/valid/simple.json", "utf-8"))

tdArray.forEach( (element, index) => {
	tdValidator(element, console.log, {})
	.then( result => {
		console.log("OKAY TD Nr.: " + index)
		console.log("Report:")
		Object.keys(result.report).forEach( el => {
			console.log(el, ": ", result.report[el])
		})
		console.log("Details of the \"additional\" checks: ")
		Object.keys(result.details).forEach(el => {
			console.log("    " + el + " " + result.details[el] + " (" + result.detailComments[el] + ")")
		})

	}, err => {
		console.log("ERROR " + index)
		console.error(err)
	})
})
