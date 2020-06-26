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

 function checkCoverage(jsonResults) {

    let passCount = 0
    let failCount = 0
    let nullCount = 0
    let notImplCount = 0
    let totalCount = 0

    jsonResults.forEach(curResult => {
        if (curResult.Status === "fail") {
            failCount++
        }
        if (curResult.Status === "pass") {
            passCount++
        }
        if (curResult.Status === "null") {
            nullCount++
        }
        if (curResult.Status === "not-impl") {
            notImplCount++
        }
        totalCount++
    })

    console.log("Failed Assertions:", failCount)
    console.log("Not-Implemented Assertions:", notImplCount)
    console.log("Not Tested Assertions:",nullCount)
    console.log("Passed Assertions:",passCount)
    console.log("Total Assertions",totalCount)
 }

 module.exports = checkCoverage