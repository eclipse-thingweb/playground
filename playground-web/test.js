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

const playwright = require('playwright')
const fs = require("fs")
const handler = require("serve-handler")
const http = require("http")

const arg = process.argv[2]
const options = (arg === "-d" || arg === "--debug") ? {headless: false, slowMo: 200} : {}

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response);
})

server.listen(3000, () => {
  console.log('Running siteTest at http://localhost:3000');
});

testVisual()

async function testVisual() {
  if (!fs.existsSync("./test_results")) {fs.mkdirSync("./test_results")}


  const BrowserList = []
  BrowserList.push("chromium")
  BrowserList.push("firefox")
  // BrowserList.push("webkit")

  for (const browserType of BrowserList) {
    const browser = await playwright[browserType].launch(options)
    const context = await browser.newContext({acceptDownloads: true})
    const page = await context.newPage()

    if (browserType === "chromium") {
      await testVisualChromium(page)
    }
    else if (browserType === "firefox") {
      await testVisualFirefox(page)
    }
    else if (browserType === "webkit") {
      await testVisualWebkit(page)
    }

    await browser.close()
    console.log("Finished testing with: " + browserType)
  }

  server.close()
}

async function testVisualChromium(page) {
  const browserType = "chromium"
  await page.goto('http://localhost:3000')
  await page.screenshot({ path: `./test_results/index-of-${browserType}.png` })

  await page.click('#load_example', {waitUntil: "networkidle"})
  await page.screenshot({ path: `./test_results/chromium_dropdown-examples.png` })

  await page.selectOption('#load_example', "SimpleTD")
  await page.screenshot({ path: `./test_results/chromium_td.png` })

  await page.click("#btn_validate")
  await myWait(1000)
  await page.screenshot({ path: `./test_results/chromium_validation.png`, fullPage: true })

  await page.click("#validation_table_head")
  await page.screenshot({ path: `./test_results/chromium_lights.png` })

  await page.click("#btn_assertion_popup")
  await page.screenshot({ path: `./test_results/chromium_assertion-popup.png` })
  const [assertionDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#btn_assertion")
  ])
  assertionDownload.saveAs("./test_results/assertions.csv")
  await page.click("#close_assertion_test_popup")

  await page.click("#btn_clearLog")
  const consoleField = await page.$("#console")
  await consoleField.screenshot({ path: `./test_results/chromium_cleared-log.png` })

  await page.click("#editor_theme")
  await page.screenshot({ path: `./test_results/chromium_dropdown-editor-color.png` })

  await page.selectOption('#editor_theme', "vs-dark")
  await page.screenshot({ path: `./test_results/chromium_dark-editor.png` })
}

async function testVisualFirefox(page) {
  const browserType = "firefox"
  await page.goto('http://localhost:3000', {waitUntil: "networkidle"})
  await myWait(1000)
  await page.screenshot({ path: `./test_results/index-of-${browserType}.png` })

  // await page.click('#load_example', {waitUntil: "networkidle"})
  // await myWait()
  // const elementHandle = await page.$('.loadExampleForm');
  // await elementHandle.screenshot({path: "./test_results/only-dropdown.png"});
  // await page.screenshot({ path: `./test_results/dropdown-of-${browserType}.png`, fullPage: true })

  // await page.selectOption('#load_example', "SimpleTD")
  // await page.screenshot({ path: `./test_results/td-of-${browserType}.png` })
}

async function testVisualWebkit(page) {
  const browserType = "webkit"
  page.on("console", msg => console.log(msg.text()))
  await page.goto('http://localhost:3000', {waitUntil: "networkidle"})
  await page.screenshot({ path: `./test_results/index-of-${browserType}.png` })
}

/**
 * helper function that resolves after given time
 * @param {number} milliseconds time to wait in milliseconds
 */
function myWait(milliseconds){
  return new Promise( (res, rej) => {
    setTimeout( () => {
      res()
    }, milliseconds)
  })
}