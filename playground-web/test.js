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

const playwright = require('playwright');
const fs = require("fs");
 
(async () => {
  for (const browserType of ['chromium', 'firefox'/*, 'webkit'*/]) {
    const browser = await playwright[browserType].launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    if (!fs.existsSync("./test_results")) {fs.mkdirSync("./test_results")}

    await page.goto('http://plugfest.thingweb.io/playground/', {waitUntil: "networkidle"})
    await page.screenshot({ path: `./test_results/index-of-${browserType}.png` })

    await page.click('#load_example', {waitUntil: "networkidle"})
    await page.screenshot({ path: `./test_results/dropdown-of-${browserType}.png` })

    await page.selectOption('#load_example', "SimpleTD")
    // await page.dispatchEvent('#load_example', "change")
    await page.screenshot({ path: `./test_results/td-of-${browserType}.png` })

    await browser.close()
    console.log("Finished testing with: " + browserType)
  }
})()