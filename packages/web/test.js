/**
 * @file Visual testing for this package. Uses `playwright` to create screenshots of the locally served package
 *       and download an instance of the assertion report and OpenAPI convertion result (json & yaml).
 *        The screenshots are generated using chromium and firefox (webkit fails ATM) and different
 *        viewports and actions (click on forms etc.). The test results are written to "./test_results".
 */

const playwright = require('playwright')
const fs = require("fs")
const handler = require("serve-handler")
const http = require("http")
const path = require("path")

const arg = process.argv[2]
const options = (arg === "-d" || arg === "--debug") ? {headless: false, slowMo: 200} : {}

const port = 3000
const host = "http://localhost"
const fullHost = host + ":" + port
const testDir = "./test_results"

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response);
})

/* ################### */
/*      MAIN           */
server.listen(port, () => {
  console.log("Running siteTest at " + fullHost);
});
testVisual()
/* ################### */


/**
 * main function to execute visual test using playwright
 */
async function testVisual() {
  if (!fs.existsSync(testDir)) {fs.mkdirSync(testDir)}


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

      await testViewport(browser, 1920, 1080)
      await testViewport(browser, 2560, 1440)
      await testViewport(browser, 3840, 2160)
      await testViewport(browser, 4096, 2160)
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

/**
 * Render the testing target with given viewport dimensions and take screenshots
 * @param {object} browser a playwright browser
 * @param {*} width viewport width in px
 * @param {*} height viewport height in px
 */
async function testViewport(browser, width, height) {
  const customPage = await browser.newPage({
    viewport: { width, height }
  })

  await customPage.goto(fullHost)
  await customPage.screenshot({ path: path.join(testDir, "viewport_" + width +"_x_" + height + ".png")})
  await customPage.close()
}

/**
 * execute tests and take screenshots with chromium
 * works better than other browser engines
 * @param {object} page a playwright page
 */
async function testVisualChromium(page) {

  /** a shortcut function for taking screenshots of chromium pages */
  const customShot = async postfix => {await page.screenshot({path: path.join(testDir, "chromium_" + postfix + ".png")})}
  await page.goto(fullHost)
  await customShot("index")

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.click('#load_example', {waitUntil: "networkidle"})
  await customShot("dropdown-examples")

  await page.selectOption('#load_example', "SimpleTD")
  await customShot("td")
  await page.screenshot({ path: `./test_results/chromium_td.png` })

  await page.click("#btn_validate")
  await myWait(1000)
  await page.screenshot({ path: path.join(testDir, "chromium_validation.png"),fullPage: true })

  await page.click("#validation_table_head")
  await page.screenshot({ path: `./test_results/chromium_lights.png` })
  await customShot("lights")

  await page.click("#btn_assertion_popup")
  await customShot("assertion-popup")
  const [assertionDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#btn_assertion")
  ])
  assertionDownload.saveAs("./test_results/assertions.csv")
  await page.click("#close_assertion_test_popup")

  const [openapiJsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#btn_oap_json")
  ])
  openapiJsonDownload.saveAs("./test_results/openapi.json")

  const [openapiYamlDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#btn_oap_yaml")
  ])
  openapiYamlDownload.saveAs("./test_results/openapi.yaml")

  await page.click("#btn_clearLog")
  await myWait(300)
  await customShot("cleared-log")

  await page.click("#editor_theme")
  await customShot("dropdown-editor-color")

  await page.selectOption('#editor_theme', "vs-dark")
  await customShot("dark-editor")
}

/**
 * execute tests and take screenshots with firefox
 * the page renders correctly but e.g. dropdowns are not shown in screenshots
 * -> use chrome for advanced testing
 * @param {object} page a playwright page
 */
async function testVisualFirefox(page) {
  const browserType = "firefox"
  await page.goto(fullHost, {waitUntil: "networkidle"})
  await myWait(1000)
  await page.screenshot({ path: path.join(testDir, "firefox_index.png")})
}

/**
 * execute tests and take screenshots with webkit
 * TODO: not working
 * @param {object} page a playwright page
 */
async function testVisualWebkit(page) {
  page.on("console", msg => console.log(msg.text())) // print page console output to node.js console
  await page.goto(fullHost, {waitUntil: "networkidle"})
  await myWait(9000)
  await page.screenshot({ path: path.join(testDir, "webkit_index.png")})
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
