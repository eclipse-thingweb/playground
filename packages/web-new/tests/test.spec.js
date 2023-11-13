const { test, expect } = require('@playwright/test');

//Open the playground app before any test is runned
test.beforeEach(async ({ page }) => {
    await page.goto('/')
});

test.describe("Load initial state", () => {
    test('Has title', async ({ page }) => {
        await expect(page).toHaveTitle("TD Playground")
    })

    test('Has editor tab', async ({ page }) => {
        const editorTab = page.locator('#tab')
        await expect(editorTab).toHaveText("TDThing TemplateCloseCancel")
    })

    test('Has TD template', async ({ page }) => {
        const editor = page.locator('#editor1').getByRole('code').locator('div').filter({ hasText: '"title": "Thing Template",' }).nth(4)
        await expect(editor).toHaveText('"title": "Thing Template",')
    })

    test('Validation tab is checked', async ({ page }) => {
        const validationTab = page.locator('#validation-tab')
        await expect(validationTab).toBeChecked()
    })

    test('Validation view is opened', async ({ page }) => {
        const validationView = page.locator('#validation-view')
        await expect(validationView).toHaveClass("console-view validation-view")
    })

    test('JSON button is checked', async ({ page }) => {
        const jsonBtn = page.locator('#file-type-json')
        await expect(jsonBtn).toBeChecked()
    })
})

test.describe("Check all links", () => {
    test("Check Thingweb logo link", async ({ page }) => {
        const thingwebPromise = page.waitForEvent('popup')
        await page.locator(".logo").click()
        const thingwebPage = await thingwebPromise
        await expect(thingwebPage).toHaveTitle("Eclipse Thingweb")
        await expect(thingwebPage).toHaveURL("https://www.thingweb.io")
    })

    test("Check CLI link", async ({ page }) => {
        const cliPromise = page.waitForEvent('popup')
        await page.locator(".cli-link").click()
        const cliPage = await cliPromise
        await expect(cliPage).toHaveURL("https://github.com/eclipse-thingweb/playground/tree/master/packages/cli")
    })

    test("Check Github link", async ({ page }) => {
        const githubPromise = page.waitForEvent('popup')
        await page.locator(".git-link").click()
        const githubPage = await githubPromise
        await expect(githubPage).toHaveTitle(/GitHub - eclipse-thingweb/)
        await expect(githubPage).toHaveURL("https://github.com/eclipse-thingweb/playground")
    })

    test("Check Thingweb footer link", async ({ page }) => {
        await page.locator('#settings-btn').click()
        const thingwebPromise = page.waitForEvent('popup')
        await page.locator("#thingweb-link").click()
        const thingwebPage = await thingwebPromise
        await expect(thingwebPage).toHaveTitle("Eclipse Thingweb")
        await expect(thingwebPage).toHaveURL("https://www.thingweb.io")
    })

    test("Check Eclipse footer link", async ({ page }) => {
        await page.locator('#settings-btn').click()
        const eclipsePromise = page.waitForEvent('popup')
        await page.locator("#eclipse-link").click()
        const eclipsePage = await eclipsePromise
        await expect(eclipsePage).toHaveTitle("The Community for Open Collaboration and Innovation | The Eclipse Foundation")
        await expect(eclipsePage).toHaveURL("https://www.eclipse.org")
    })

    test("Check privacy policy footer link", async ({ page }) => {
        await page.locator('#settings-btn').click()
        const privacyPromise = page.waitForEvent('popup')
        await page.locator("#privacy-link").click()
        const privacyPage = await privacyPromise
        await expect(privacyPage).toHaveTitle("Eclipse Foundation Website Privacy Policy | The Eclipse Foundation")
        await expect(privacyPage).toHaveURL("https://www.eclipse.org/legal/privacy.php")
    })

    test("Check terms of use footer link", async ({ page }) => {
        await page.locator('#settings-btn').click()
        const termsPromise = page.waitForEvent('popup')
        await page.locator("#terms-link").click()
        const termsPage = await termsPromise
        await expect(termsPage).toHaveTitle("Eclipse.org Terms of Use | The Eclipse Foundation")
        await expect(termsPage).toHaveURL("https://www.eclipse.org/legal/termsofuse.php")
    })

    test("Check copyright agent footer link", async ({ page }) => {
        await page.locator('#settings-btn').click()
        const copyrightPromise = page.waitForEvent('popup')
        await page.locator("#copyright-link").click()
        const copyrightPage = await copyrightPromise
        await expect(copyrightPage).toHaveTitle("Copyright Agent | The Eclipse Foundation")
        await expect(copyrightPage).toHaveURL("https://www.eclipse.org/legal/copyright.php")
    })

    test("Check legal footer link", async ({ page }) => {
        await page.locator('#settings-btn').click()
        const legalPromise = page.waitForEvent('popup')
        await page.locator("#legal-link").click()
        const legalPage = await legalPromise
        await expect(legalPage).toHaveTitle("Eclipse Foundation Legal Resources | The Eclipse Foundation")
        await expect(legalPage).toHaveURL("https://www.eclipse.org/legal/")
    })
})

test.describe("Editors and Tabs creation and deletion", () => {
    test("Adding a new editor and closing it", async ({ page }) => {
        const editorTabs = page.locator("#tab")
        const editors = page.locator(".editor")
        await expect(editorTabs).toHaveCount(1)
        await expect(editors).toHaveCount(1)

        const initialTab = page.locator("#tab").nth(0)
        await expect(initialTab).toHaveAttribute('data-tab-id', "1")
        await expect(initialTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(initialTab).toHaveClass("active")

        const initialEditor = page.locator("#editor1")
        await expect(initialEditor).toHaveAttribute('data-ide-id', "1")
        await expect(initialEditor).toHaveClass("editor active")

        await page.locator("#ide-tab-add").click()
        await expect(editorTabs).toHaveCount(2)
        await expect(editors).toHaveCount(2)

        await expect(initialTab).toHaveClass("")
        await expect(initialEditor).toHaveClass("editor")

        const secondTab = page.locator("#tab").nth(1)
        await expect(secondTab).toHaveAttribute('data-tab-id', "2")
        await expect(secondTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(secondTab).toHaveClass("active")

        const secondEditor = page.locator("#editor2")
        await expect(secondEditor).toHaveAttribute('data-ide-id', "2")
        await expect(secondEditor).toHaveClass("editor active")

        await page.locator("#tab").nth(1).locator(".close-tab").click()
        await page.locator('#tab').nth(1).locator(".confirm-btns > .confirm-tab-close").click()

        await expect(editorTabs).toHaveCount(1)
        await expect(editors).toHaveCount(1)

        await expect(initialTab).toHaveClass("active")
        await expect(initialEditor).toHaveClass("editor active")
    })

    test("Opening an example and closing initial editor", async ({ page }) => {
        const editorTabs = page.locator("#tab")
        const editors = page.locator(".editor")
        await expect(editorTabs).toHaveCount(1)
        await expect(editors).toHaveCount(1)

        const initialTab = page.locator("#tab").nth(0)
        await expect(initialTab).toHaveAttribute('data-tab-id', "1")
        await expect(initialTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(initialTab).toHaveClass("active")

        const initialEditor = page.locator("#editor1")
        await expect(initialEditor).toHaveAttribute('data-ide-id', "1")
        await expect(initialEditor).toHaveClass("editor active")

        await page.locator("#examples-btn").click()
        await page.locator(".example").nth(0).click()
        await page.locator(".example").nth(0).getByRole("button", { name: /Apply/ }).click()

        await expect(editorTabs).toHaveCount(2)
        await expect(editors).toHaveCount(2)

        await expect(initialTab).toHaveClass("")
        await expect(initialEditor).toHaveClass("editor")

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveClass("editor active")

        await page.locator("#tab").nth(0).locator(".close-tab").click()
        await page.locator('#tab').nth(0).locator(".confirm-btns > .confirm-tab-close").click()

        await expect(editorTabs).toHaveCount(1)
        await expect(editors).toHaveCount(1)
    })
})

test.describe("JSON and YAML conversion", () => {
    test("JSON to YAML and YAML to JSON", async ({ page }) => {
        const editorTabs = page.locator("#tab")
        const editors = page.locator(".editor")
        await expect(editorTabs).toHaveCount(1)
        await expect(editors).toHaveCount(1)

        const jsonYamlPopup = page.locator('.json-yaml-warning')
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")

        const initialEditor = page.locator("#editor1")
        const jsonBtn = page.locator('#file-type-json')
        const yamlBtn = page.locator('#file-type-yaml')

        await expect(initialEditor).toHaveAttribute('data-mode-id', "json")
        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })

        await yamlBtn.click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning")

        await page.locator('#yaml-confirm-btn').click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")
        await expect(initialEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(jsonBtn).toBeChecked({ checked: false })
        await expect(yamlBtn).toBeChecked({ checked: true })

        await jsonBtn.click()
        await expect(initialEditor).toHaveAttribute('data-mode-id', "json")
        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })
    })

    test("Cancel YAML conversion", async ({ page }) => {
        const editorTabs = page.locator("#tab")
        const editors = page.locator(".editor")
        await expect(editorTabs).toHaveCount(1)
        await expect(editors).toHaveCount(1)

        const jsonYamlPopup = page.locator('.json-yaml-warning')
        const initialEditor = page.locator("#editor1")
        const jsonBtn = page.locator('#file-type-json')
        const yamlBtn = page.locator('#file-type-yaml')

        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")
        await expect(initialEditor).toHaveAttribute('data-mode-id', "json")
        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })

        await yamlBtn.click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning")

        await page.locator('#yaml-cancel-btn').click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")
        await expect(initialEditor).toHaveAttribute('data-mode-id', "json")
        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })
    })
})


test.describe("Examples menu functionality", () => {
    test("Open and close examples menu", async ({ page }) => {

        await expect(page.getByRole('heading', { name: 'Simple Default' })).toBeVisible({ visible: false })
        await page.locator("#examples-btn").click()

        await expect(page.getByRole('heading', { name: 'Simple Default' })).toBeVisible({ visible: true })
        await page.locator(".examples-menu-container__close > i").click()

        await expect(page.getByRole('heading', { name: 'Simple Default' })).toBeVisible({ visible: false })
    })

    test("Open Basic TD from quick access", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const basicExample = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0)
        await expect(basicExample).toHaveClass("example")

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveClass("editor active")

    })

    test("Open Basic TD from apply button", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const basicExample = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0)
        await basicExample.click()
        await expect(basicExample).toHaveClass("example open")

        const applyBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0).getByRole("button").filter({ hasText: "Apply" })
        await applyBtn.click()
        await expect(basicExample).toHaveClass("example")

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveClass("editor active")
    })

    test("Open Basic TD and close with cancel button", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const basicTDExample = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0)
        await basicTDExample.click()
        await expect(basicTDExample).toHaveClass("example open")

        const cancelBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0).getByRole("button").filter({ hasText: "Cancel" })
        await cancelBtn.click()
        await expect(basicTDExample).toHaveClass("example")
    })

    test("Toggle between TD and TM examples", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await expect(thingTypeToggle).toBeChecked({ checked: false })

        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })
    })

    test("Open Basic TM and check for icon change in tab", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const tabIcon = page.locator("#tab").nth(1).locator(".tab-icon")
        await expect(tabIcon).toHaveText("TM")
    })

    test("Go to versioning in TD category and open example from quick access", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const categoryDropDown = page.locator("#thing-category")
        await categoryDropDown.selectOption('9-versioning')

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Versioning' }).nth(0).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")
    })

    test("Go to Tm Optional in TM category and open example from quick access", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const categoryDropDown = page.locator("#thing-category")
        await categoryDropDown.selectOption('4-tm-optional')

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Optional Interaction Affordances' }).nth(0).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMLamp ThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")
    })

    test("Search for uriVariable in the TDs and open Combined URI variables in href example", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const searchInput = page.locator(".search-input")
        searchInput.fill('uriVariables')

        const searchBtn = page.locator(".search-btn")
        await searchBtn.click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Combined URI variables in href' }).nth(0).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyWeatherThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")
    })

    test("Search for overwrite in the TMs and open Overwrite Existing Definitions example", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const searchInput = page.locator(".search-input")
        searchInput.fill('overwrite')

        const searchBtn = page.locator(".search-btn")
        await searchBtn.click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Overwrite Existing Definitions' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMSmart Lamp ControlCloseCancel")
        await expect(exampleTab).toHaveClass("active")
    })
})

test.describe("Save menu functionality", () => {
    test("Open and close save menu", async ({ page }) => {
        const saveMenu = page.locator(".save-menu")
        await expect(saveMenu).toHaveClass("save-menu closed")

        await page.locator("#save-btn").click()
        await expect(saveMenu).toHaveClass("save-menu")

        const closeMenu = page.locator(".save-menu-close > i")
        await closeMenu.click()
        await expect(saveMenu).toHaveClass("save-menu closed")
    })

    test("Open save menu with template thing and check for TD in menu title", async ({ page }) => {
        const saveMenu = page.locator(".save-menu")

        await page.locator("#save-btn").click()
        await expect(saveMenu).toHaveClass("save-menu")

        const titleThingType = page.locator(".save-menu-title > p > #thing-type-text")
        await expect(titleThingType).toHaveText("TD")
    })

    test("Open TM examples check for TM in the save menu title", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const saveMenu = page.locator(".save-menu")

        await page.locator("#save-btn").click()
        await expect(saveMenu).toHaveClass("save-menu")

        const titleThingType = page.locator(".save-menu-title > p > #thing-type-text")
        await expect(titleThingType).toHaveText("TM")
    })

    test("Share and open in new tab functionality with an example", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const basicExample = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0)
        await expect(basicExample).toHaveClass("example")

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).nth(0).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const saveMenu = page.locator(".save-menu")

        await page.locator("#save-btn").click()
        await expect(saveMenu).toHaveClass("save-menu")

        const openNewTab = page.locator("#open-url-tab")
        await expect(openNewTab).toBeDisabled()

        const shareUrlInput = page.locator("#share-url-input")
        await expect(shareUrlInput).toHaveText("")

        const shareUrlBtn = page.locator("#share-url-btn")
        await shareUrlBtn.click()

        const newPlaygroundPromise = page.waitForEvent('popup')
        await openNewTab.click()
        const newPlaygroundPage = await newPlaygroundPromise

        await expect(newPlaygroundPage).toHaveTitle("TD Playground")

        const newPlaygroundTab = newPlaygroundPage.locator("#tab").nth(0)
        await expect(newPlaygroundTab).toHaveAttribute('data-tab-id', "1")
        await expect(newPlaygroundTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(newPlaygroundTab).toHaveClass("active")

    })

    test("Open in ediTDor functionality", async ({ page }) => {
        const saveMenu = page.locator(".save-menu")

        await page.locator("#save-btn").click()
        await expect(saveMenu).toHaveClass("save-menu")

        const shareUrlInput = page.locator("#share-url-input")
        await expect(shareUrlInput).toHaveText("")

        const openEditdorBtn = page.locator("#open-editdor-btn")

        const editdorPromise = page.waitForEvent('popup')
        await openEditdorBtn.click()
        const editdorPage = await editdorPromise

        await expect(editdorPage).toHaveTitle("ediTDor")

        const linkedTd = editdorPage.locator("#linkedTd > option")
        await expect(linkedTd).toHaveText("Thing Template")
    })

    test("Download functionality", async ({ page }) => {
        const saveMenu = page.locator(".save-menu")

        const exampleTab = page.locator("#tab").nth(0)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "1")
        await expect(exampleTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        await page.locator("#save-btn").click()
        await expect(saveMenu).toHaveClass("save-menu")

        const downloadTdBtn = page.locator(".save-td__download")

        // Start waiting for download before clicking.
        const downloadPromise = page.waitForEvent('download')
        await downloadTdBtn.click()
        const download = await downloadPromise
        const expectedFilename = 'Thing-Template.json'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    //* The "Save as" functionality cannot be tested because it requires to open and interact with the file system wich Playwright cannot do
})

test.describe("Settings menu functionality", () => {
    test("Opening and closing the settings menu", async ({ page }) => {
        const settingsMenu = page.locator(".settings-menu")
        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        const closeMenu = page.locator(".settings__close > i")
        await closeMenu.click()
        await expect(settingsMenu).toHaveClass("settings-menu closed")
    })

    test("Checking settings toggle buttons", async ({ page }) => {
        const settingsMenu = page.locator(".settings-menu")
        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        const autoValidate = page.locator("#auto-validate")
        const validateJsonld = page.locator("#validate-jsonld")
        const tmConformance = page.locator("#tm-conformance")

        await expect(autoValidate).toBeChecked({ checked: false })
        await expect(validateJsonld).toBeChecked({ checked: true })
        await expect(tmConformance).toBeChecked({ checked: true })
    })

    test("Changing page theme", async ({ page }) => {
        const playgroundSite = page.locator("html")
        await expect(playgroundSite).toHaveClass("light-mode")

        const settingsMenu = page.locator(".settings-menu")
        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        const themePicker = page.locator("#theme-picker")
        await themePicker.selectOption('monochrome-mode')
        await expect(playgroundSite).toHaveClass("monochrome-mode")

        await themePicker.selectOption('dark-mode')
        await expect(playgroundSite).toHaveClass("dark-mode")

        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(playgroundSite).toHaveClass("dark-mode")
    })

    test("Changing font size", async ({ page }) => {
        const settingsMenu = page.locator(".settings-menu")
        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        const editorFontSize = page.locator(".editor-font-size")
        await expect(editorFontSize).toHaveText("14")

        const fontSizeSlider = page.locator('#font-size')
        await fontSizeSlider.click()

        await expect(editorFontSize).toHaveText("23")

        await page.reload({ waitUntil: 'domcontentloaded' })

        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        await expect(editorFontSize).toHaveText("23")
    })

    test("Utilizing default settings", async ({ page }) => {
        const playgroundSite = page.locator("html")
        await expect(playgroundSite).toHaveClass("light-mode")

        const settingsMenu = page.locator(".settings-menu")
        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        const themePicker = page.locator("#theme-picker")
        await themePicker.selectOption('dark-mode')
        await expect(playgroundSite).toHaveClass("dark-mode")

        const editorFontSize = page.locator(".editor-font-size")
        await expect(editorFontSize).toHaveText("14")

        const fontSizeSlider = page.locator('#font-size')
        await fontSizeSlider.click()

        await expect(editorFontSize).toHaveText("23")

        await page.reload({ waitUntil: 'domcontentloaded' })

        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        await expect(playgroundSite).toHaveClass("dark-mode")
        await expect(editorFontSize).toHaveText("23")

        const resetSettings = page.locator('.reset-settings')
        await resetSettings.click()

        await expect(playgroundSite).toHaveClass("light-mode")
        await expect(editorFontSize).toHaveText("14")

        await page.reload({ waitUntil: 'domcontentloaded' })

        await expect(settingsMenu).toHaveClass("settings-menu closed")

        await page.locator("#settings-btn").click()
        await expect(settingsMenu).toHaveClass("settings-menu")

        await expect(playgroundSite).toHaveClass("light-mode")
        await expect(editorFontSize).toHaveText("14")
    })
})

test.describe("Validation view functionality", () => {

    test("Starting the validation with the main valiation button", async ({ page }) => {

        const validationTab = page.locator('#validation-tab')
        const validationView = page.locator('#validation-view')

        await expect(validationTab).toBeChecked()
        await expect(validationView).toHaveClass("console-view validation-view")

        const stateIcon = page.locator(".json-validation-section > .section-header > i").nth(0)
        await expect(stateIcon).toHaveClass("fa-solid fa-circle")

        const validationBtn = page.locator("#validate-btn")
        await validationBtn.click()

        //TODO: Find a better way to wait for this event to happen
        await page.waitForTimeout(5000)
        await expect(stateIcon).toHaveClass("fa-solid fa-circle-check")
    })

    test("Closing the default validation view and opening it again with the validation view tab", async ({ page }) => {

        const validationTab = page.locator('#validation-tab')
        const validationView = page.locator('#validation-view')

        await expect(validationTab).toBeChecked()
        await expect(validationView).toHaveClass("console-view validation-view")

        const trashBtn = page.locator(".trash")
        await trashBtn.click()

        await expect(validationTab).toBeChecked({ checked: false })
        await expect(validationView).toHaveClass("console-view validation-view hidden")

        await validationTab.click()

        await expect(validationTab).toBeChecked({ checked: true })
        await expect(validationView).toHaveClass("console-view validation-view")

        const stateIcon = page.locator(".json-validation-section > .section-header > i").nth(0)
        await expect(stateIcon).toHaveClass("fa-solid fa-circle-check")
    })

    test("Validating the 'All Defaults TD'", async ({ page }) => {
        const validationTab = page.locator('#validation-tab')
        const validationView = page.locator('#validation-view')

        await expect(validationTab).toBeChecked()
        await expect(validationView).toHaveClass("console-view validation-view")

        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'All Default Values' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        await expect(validationTab).toBeChecked({ checked: false })
        await expect(validationView).toHaveClass("console-view validation-view hidden")

        const validationBtn = page.locator("#validate-btn")
        await validationBtn.click()

        await expect(validationTab).toBeChecked({ checked: true })
        await expect(validationView).toHaveClass("console-view validation-view")

        //validation section
        const jsonValidationSection = page.locator(".json-validation-section")
        const jsonValidationSectionIcon = page.locator(".json-validation-section > .section-header > i").nth(0)
        const jsonValidationSectionTxt = page.locator(".json-validation-section > .section-content > li")

        await jsonValidationSection.click()
        await expect(jsonValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonSchemaValidationSection = page.locator(".json-schema-validation-section")
        const jsonSchemaValidationSectionIcon = page.locator(".json-schema-validation-section > .section-header > i").nth(0)
        const jsonSchemaValidationSectionTxt = page.locator(".json-schema-validation-section > .section-content > li")

        await jsonSchemaValidationSection.click()
        await expect(jsonSchemaValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonSchemaValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonSchemaDefaultsSection = page.locator(".json-schema-defaults-section")
        const jsonSchemaDefaultsSectionIcon = page.locator(".json-schema-defaults-section > .section-header > i").nth(0)
        const jsonSchemaDefaultsSectionTxt = page.locator(".json-schema-defaults-section > .section-content > li")

        await jsonSchemaDefaultsSection.click()
        await expect(jsonSchemaDefaultsSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonSchemaDefaultsSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonlsValidationSection = page.locator(".jsonls-validation-section")
        const jsonlsValidationSectionIcon = page.locator(".jsonls-validation-section > .section-header > i").nth(0)
        const jsonlsValidationSectionTxt = page.locator(".jsonls-validation-section > .section-content > li")

        await jsonlsValidationSection.click()
        await expect(jsonlsValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonlsValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const additionalChecksSection = page.locator(".additional-checks-section")
        const additionalChecksSectionIcon = page.locator(".additional-checks-section > .section-header > i").nth(0)
        const additionalChecksSectionTxt = page.locator(".additional-checks-section > .section-content > li")

        await additionalChecksSection.click()
        await expect(additionalChecksSectionTxt).toHaveText("Validated Successfully")
        await expect(additionalChecksSectionIcon).toHaveClass("fa-solid fa-circle-check")
    })

    test("Validating the 'Basic TD'", async ({ page }) => {
        const validationTab = page.locator('#validation-tab')
        const validationView = page.locator('#validation-view')

        await expect(validationTab).toBeChecked()
        await expect(validationView).toHaveClass("console-view validation-view")

        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        await expect(validationTab).toBeChecked({ checked: false })
        await expect(validationView).toHaveClass("console-view validation-view hidden")

        const validationBtn = page.locator("#validate-btn")
        await validationBtn.click()

        await expect(validationTab).toBeChecked({ checked: true })
        await expect(validationView).toHaveClass("console-view validation-view")


        //Validation section
        const jsonValidationSection = page.locator(".json-validation-section")
        const jsonValidationSectionIcon = page.locator(".json-validation-section > .section-header > i").nth(0)
        const jsonValidationSectionTxt = page.locator(".json-validation-section > .section-content > li")

        await jsonValidationSection.click()
        await expect(jsonValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonSchemaValidationSection = page.locator(".json-schema-validation-section")
        const jsonSchemaValidationSectionIcon = page.locator(".json-schema-validation-section > .section-header > i").nth(0)
        const jsonSchemaValidationSectionTxt = page.locator(".json-schema-validation-section > .section-content > li")

        await jsonSchemaValidationSection.click()
        await expect(jsonSchemaValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonSchemaValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonSchemaDefaultsSection = page.locator(".json-schema-defaults-section")
        const jsonSchemaDefaultsSectionIcon = page.locator(".json-schema-defaults-section > .section-header > i").nth(0)
        const jsonSchemaDefaultsSectionTxt = page.locator(".json-schema-defaults-section > .section-content > li").nth(0)

        await jsonSchemaDefaultsSection.click()
        await expect(jsonSchemaDefaultsSectionTxt).toHaveText("Optional validation failed:")
        await expect(jsonSchemaDefaultsSectionIcon).toHaveClass("fa-solid fa-circle-exclamation")

        const jsonlsValidationSection = page.locator(".jsonls-validation-section")
        const jsonlsValidationSectionIcon = page.locator(".jsonls-validation-section > .section-header > i").nth(0)
        const jsonlsValidationSectionTxt = page.locator(".jsonls-validation-section > .section-content > li")

        await jsonlsValidationSection.click()
        await expect(jsonlsValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonlsValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const additionalChecksSection = page.locator(".additional-checks-section")
        const additionalChecksSectionIcon = page.locator(".additional-checks-section > .section-header > i").nth(0)
        const additionalChecksSectionTxt = page.locator(".additional-checks-section > .section-content > li")

        await additionalChecksSection.click()
        await expect(additionalChecksSectionTxt).toHaveText("Validated Successfully")
        await expect(additionalChecksSectionIcon).toHaveClass("fa-solid fa-circle-check")
    })

    test("Validating the 'Basic TM'", async ({ page }) => {

        const validationTab = page.locator('#validation-tab')
        const validationView = page.locator('#validation-view')

        await expect(validationTab).toBeChecked()
        await expect(validationView).toHaveClass("console-view validation-view")

        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMLamp ThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        await expect(validationTab).toBeChecked({ checked: false })
        await expect(validationView).toHaveClass("console-view validation-view hidden")

        const validationBtn = page.locator("#validate-btn")
        await validationBtn.click()

        await expect(validationTab).toBeChecked({ checked: true })
        await expect(validationView).toHaveClass("console-view validation-view")

        //Validation section
        const jsonValidationSection = page.locator(".json-validation-section")
        const jsonValidationSectionIcon = page.locator(".json-validation-section > .section-header > i").nth(0)
        const jsonValidationSectionTxt = page.locator(".json-validation-section > .section-content > li")

        await jsonValidationSection.click()
        await expect(jsonValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonSchemaValidationSection = page.locator(".json-schema-validation-section")
        const jsonSchemaValidationSectionIcon = page.locator(".json-schema-validation-section > .section-header > i").nth(0)
        const jsonSchemaValidationSectionTxt = page.locator(".json-schema-validation-section > .section-content > li")

        await jsonSchemaValidationSection.click()
        await expect(jsonSchemaValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonSchemaValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const jsonSchemaDefaultsSection = page.locator(".json-schema-defaults-section")
        const jsonSchemaDefaultsSectionIcon = page.locator(".json-schema-defaults-section > .section-header > i").nth(0)
        const jsonSchemaDefaultsSectionTxt = page.locator(".json-schema-defaults-section > .section-content > li").nth(0)

        await jsonSchemaDefaultsSection.click()
        await expect(jsonSchemaDefaultsSectionTxt).toHaveText("A previous validation has failed or it is only available for Thing Descriptions")
        await expect(jsonSchemaDefaultsSectionIcon).toHaveClass("fa-solid fa-circle")

        const jsonlsValidationSection = page.locator(".jsonls-validation-section")
        const jsonlsValidationSectionIcon = page.locator(".jsonls-validation-section > .section-header > i").nth(0)
        const jsonlsValidationSectionTxt = page.locator(".jsonls-validation-section > .section-content > li")

        await jsonlsValidationSection.click()
        await expect(jsonlsValidationSectionTxt).toHaveText("Validated Successfully")
        await expect(jsonlsValidationSectionIcon).toHaveClass("fa-solid fa-circle-check")

        const additionalChecksSection = page.locator(".additional-checks-section")
        const additionalChecksSectionIcon = page.locator(".additional-checks-section > .section-header > i").nth(0)
        const additionalChecksSectionTxt = page.locator(".additional-checks-section > .section-content > li")

        await additionalChecksSection.click()
        await expect(additionalChecksSectionTxt).toHaveText("Validated Successfully")
        await expect(additionalChecksSectionIcon).toHaveClass("fa-solid fa-circle-check")
    })

})

test.describe("OpenAPI view functionality", () => {
    test("Trying to open the OpenAPI view with a TD with no protocols and closing it", async ({ page }) => {

        const initialTab = page.locator("#tab").nth(0)
        await expect(initialTab).toHaveAttribute('data-tab-id', "1")
        await expect(initialTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(initialTab).toHaveClass("active")

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(page.locator(".console-error__txt")).toHaveText("Please insert a TD which uses HTTP!")

        const trashBtn = page.locator(".trash")
        await trashBtn.click()

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

    })

    test("Trying to open the OpenAPI view with a TM", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMLamp ThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(page.locator(".console-error__txt")).toHaveText("This function is only allowed for Thing Descriptions!")

    })

    test("Open the OpenAPI view with the 'Basic TD' example", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const openAPIEditor = page.locator('#open-api-container')
        const openAPIContainer = openAPIEditor.getByRole('code').locator('div').filter({ hasText: '"openapi": "3.0.3",' }).nth(4)

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "json")
        await expect(openAPIContainer).toHaveText('\"openapi\": \"3.0.3\",')

        const openAPIJsonBtn = page.locator('#open-api-json')

        await expect(openAPIJsonBtn).toBeDisabled()

    })

    test("Open the OpenAPI view with the 'Basic TD' example as YAML", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")


        const jsonYamlPopup = page.locator('.json-yaml-warning')
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")

        const jsonBtn = page.locator('#file-type-json')
        const yamlBtn = page.locator('#file-type-yaml')

        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })

        await yamlBtn.click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning")

        await page.locator('#yaml-confirm-btn').click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(jsonBtn).toBeChecked({ checked: false })
        await expect(yamlBtn).toBeChecked({ checked: true })

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const openAPIEditor = page.locator('#open-api-container')
        const openAPIContainer = openAPIEditor.getByRole('code').locator('div').filter({ hasText: 'openapi: "3.0.3"' }).nth(4)

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(openAPIContainer).toHaveText('openapi: "3.0.3"')

        const openAPIYamlBtn = page.locator('#open-api-yaml')
        await expect(openAPIYamlBtn).toBeDisabled()

    })

    test("Open the OpenAPI view and change form JSON to YAML and from YAML to JSON", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const openAPIEditor = page.locator('#open-api-container')

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "json")

        const openAPIJsonBtn = page.locator('#open-api-json')
        const openAPIYamlBtn = page.locator('#open-api-yaml')

        await expect(openAPIJsonBtn).toBeDisabled()

        await openAPIYamlBtn.click()

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(openAPIYamlBtn).toBeDisabled()

        await openAPIJsonBtn.click()

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "json")
        await expect(openAPIJsonBtn).toBeDisabled()
    })

    test("Open the OpenAPI view and downloading it as JSON", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const openAPIEditor = page.locator('#open-api-container')
        const openAPIContainer = openAPIEditor.getByRole('code').locator('div').filter({ hasText: '"openapi": "3.0.3",' }).nth(4)

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "json")
        await expect(openAPIContainer).toHaveText('\"openapi\": \"3.0.3\",')

        const openAPIJsonBtn = page.locator('#open-api-json')
        await expect(openAPIJsonBtn).toBeDisabled()

        // Start waiting for download before clicking.
        const openAPIDownload = page.locator('#open-api-download')
        const downloadPromise = page.waitForEvent('download')
        await openAPIDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'MyLampThing-OpenAPI.json'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    test("Open the OpenAPI view and downloading it as YAML", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const openAPIView = page.locator('#open-api-view')
        const consoleError = page.locator('#console-error')
        const openAPITab = page.locator("#open-api-tab")

        await expect(openAPIView).toHaveClass("console-view open-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(openAPITab).toBeChecked({ checked: false })

        await openAPITab.click()

        await expect(openAPITab).toBeChecked({ checked: true })
        await expect(openAPIView).toHaveClass("console-view open-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const openAPIEditor = page.locator('#open-api-container')

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "json")

        const openAPIJsonBtn = page.locator('#open-api-json')
        const openAPIYamlBtn = page.locator('#open-api-yaml')

        await expect(openAPIJsonBtn).toBeDisabled()

        await openAPIYamlBtn.click()

        await expect(openAPIEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(openAPIYamlBtn).toBeDisabled()

        const openAPIContainer = openAPIEditor.getByRole('code').locator('div').filter({ hasText: 'openapi: 3.0.3' }).nth(4)
        await expect(openAPIContainer).toHaveText('openapi: 3.0.3')

        // Start waiting for download before clicking.
        const openAPIDownload = page.locator('#open-api-download')
        const downloadPromise = page.waitForEvent('download')
        await openAPIDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'MyLampThing-OpenAPI.yaml'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })
})

test.describe("AsyncAPI view functionality", () => {
    test("Trying to open the AsyncAPI view with a TD with no protocols and closing it", async ({ page }) => {

        const initialTab = page.locator("#tab").nth(0)
        await expect(initialTab).toHaveAttribute('data-tab-id', "1")
        await expect(initialTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(initialTab).toHaveClass("active")

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(page.locator(".console-error__txt")).toHaveText("Please insert a TD which uses MQTT!")

        const trashBtn = page.locator(".trash")
        await trashBtn.click()

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

    })

    test("Trying to open the AsyncAPI view with a TM", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMLamp ThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(page.locator(".console-error__txt")).toHaveText("This function is only allowed for Thing Descriptions!")

    })

    /**
     * TODO: Do to a lack of examples that include the mqtt protocol this cannot be tested, nonetheless once
     * TODO: this is added the code below should sufice with minimal adjustments
    test("Open the AsyncAPI view with the '---' example", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: '---' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TD---CloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const AsyncAPIEditor = page.locator('#async-api-container')
        const AsyncAPIContainer = AsyncAPIEditor.getByRole('code').locator('div').filter({ hasText: '"asyncapi": "2.0.0",' }).nth(4)

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "json")
        await expect(AsyncAPIContainer).toHaveText('"asyncapi": "2.0.0",')

        const AsyncAPIJsonBtn = page.locator('#async-api-json')

        await expect(AsyncAPIJsonBtn).toBeDisabled()

    })

    test("Open the AsyncAPI view with the '---' example as YAML", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: '---' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TD---CloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")


        const jsonYamlPopup = page.locator('.json-yaml-warning')
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")

        const jsonBtn = page.locator('#file-type-json')
        const yamlBtn = page.locator('#file-type-yaml')

        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })

        await yamlBtn.click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning")

        await page.locator('#yaml-confirm-btn').click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(jsonBtn).toBeChecked({ checked: false })
        await expect(yamlBtn).toBeChecked({ checked: true })

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const AsyncAPIEditor = page.locator('#async-api-container')
        const AsyncAPIContainer = AsyncAPIEditor.getByRole('code').locator('div').filter({ hasText: 'asyncapi: 2.0.0' }).nth(4)

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(AsyncAPIContainer).toHaveText('asyncapi: 2.0.0')

        const AsyncAPIYamlBtn = page.locator('#async-api-yaml')
        await expect(AsyncAPIYamlBtn).toBeDisabled()

    })

    test("Open the AsyncAPI view and change form JSON to YAML and from YAML to JSON", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: '---' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TD---CloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const AsyncAPIEditor = page.locator('#async-api-container')

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "json")

        const AsyncAPIJsonBtn = page.locator('#async-api-json')
        const AsyncAPIYamlBtn = page.locator('#async-api-yaml')

        await expect(AsyncAPIJsonBtn).toBeDisabled()

        await AsyncAPIYamlBtn.click()

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(AsyncAPIYamlBtn).toBeDisabled()

        await AsyncAPIJsonBtn.click()

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "json")
        await expect(AsyncAPIJsonBtn).toBeDisabled()
    })

    test("Open the AsyncAPI view and downloading it as JSON", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: '---' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TD---CloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const AsyncAPIEditor = page.locator('#async-api-container')
        const AsyncAPIContainer = AsyncAPIEditor.getByRole('code').locator('div').filter({ hasText: '"asyncapi": "2.0.0",' }).nth(4)

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "json")
        await expect(AsyncAPIContainer).toHaveText('\"asyncapi\": \"2.0.0\",')

        const AsyncAPIJsonBtn = page.locator('#async-api-json')
        await expect(AsyncAPIJsonBtn).toBeDisabled()

        // Start waiting for download before clicking.
        const AsyncAPIDownload = page.locator('#async-api-download')
        const downloadPromise = page.waitForEvent('download')
        await AsyncAPIDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'MyLampThing-AsyncAPI.json'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    test("Open the AsyncAPI view and downloading it as YAML", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: '---' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TD---CloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const AsyncAPIView = page.locator('#async-api-view')
        const consoleError = page.locator('#console-error')
        const AsyncAPITab = page.locator("#async-api-tab")

        await expect(AsyncAPIView).toHaveClass("console-view async-api-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AsyncAPITab).toBeChecked({ checked: false })

        await AsyncAPITab.click()

        await expect(AsyncAPITab).toBeChecked({ checked: true })
        await expect(AsyncAPIView).toHaveClass("console-view async-api-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const AsyncAPIEditor = page.locator('#async-api-container')

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "json")

        const AsyncAPIJsonBtn = page.locator('#async-api-json')
        const AsyncAPIYamlBtn = page.locator('#async-api-yaml')

        await expect(AsyncAPIJsonBtn).toBeDisabled()

        await AsyncAPIYamlBtn.click()

        await expect(AsyncAPIEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(AsyncAPIYamlBtn).toBeDisabled()

        const AsyncAPIContainer = AsyncAPIEditor.getByRole('code').locator('div').filter({ hasText: 'asyncapi: 2.0.0' }).nth(4)
        await expect(AsyncAPIContainer).toHaveText('asyncapi: 2.0.0')

        // Start waiting for download before clicking.
        const AsyncAPIDownload = page.locator('#async-api-download')
        const downloadPromise = page.waitForEvent('download')
        await AsyncAPIDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'MyLampThing-AsyncAPI.yaml'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })
    */
})


test.describe("AAS AID view functionality", () => {
    test("Open the AAS view with a TD with no protocols and closing it", async ({ page }) => {

        const initialTab = page.locator("#tab").nth(0)
        await expect(initialTab).toHaveAttribute('data-tab-id', "1")
        await expect(initialTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(initialTab).toHaveClass("active")

        const AASView = page.locator('#aas-view')
        const consoleError = page.locator('#console-error')
        const AASTab = page.locator("#aas-tab")

        await expect(AASView).toHaveClass("console-view aas-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AASTab).toBeChecked({ checked: false })

        await AASTab.click()

        await expect(AASTab).toBeChecked({ checked: true })
        await expect(AASView).toHaveClass("console-view aas-view")

        const trashBtn = page.locator(".trash")
        await trashBtn.click()

        await expect(AASView).toHaveClass("console-view aas-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AASTab).toBeChecked({ checked: false })

    })

    test("Trying to open the AAS view with a TM", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMLamp ThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const AASView = page.locator('#aas-view')
        const consoleError = page.locator('#console-error')
        const AASTab = page.locator("#aas-tab")

        await expect(AASView).toHaveClass("console-view aas-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AASTab).toBeChecked({ checked: false })

        await AASTab.click()

        await expect(AASTab).toBeChecked({ checked: true })
        await expect(AASView).toHaveClass("console-view aas-view hidden")
        await expect(page.locator(".console-error__txt")).toHaveText("This function is only allowed for Thing Descriptions!")

    })

    test("Open the AAS AID view with the 'Basic TD' example", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const AASView = page.locator('#aas-view')
        const consoleError = page.locator('#console-error')
        const AASTab = page.locator("#aas-tab")

        await expect(AASView).toHaveClass("console-view aas-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AASTab).toBeChecked({ checked: false })

        await AASTab.click()

        await expect(AASTab).toBeChecked({ checked: true })
        await expect(AASView).toHaveClass("console-view aas-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const ASSEditor = page.locator('#aas-container')
        const ASSContainer = ASSEditor.getByRole('code').locator('div').filter({ hasText: '"idShort": "AssetInterfacesDescription",' }).nth(4)

        await expect(ASSEditor).toHaveAttribute('data-mode-id', "json")
        await expect(ASSContainer).toHaveText('"idShort": "AssetInterfacesDescription",')

    })

    test("Open the AAS AID view with the 'Basic TD' example and downloading it", async ({ page }) => {
        await page.locator("#examples-btn").click()

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TD' }).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TDMyLampThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const exampleEditor = page.locator("#editor2")
        await expect(exampleEditor).toHaveAttribute('data-ide-id', "2")
        await expect(exampleEditor).toHaveAttribute('data-mode-id', "json")
        await expect(exampleEditor).toHaveClass("editor active")

        const AASView = page.locator('#aas-view')
        const consoleError = page.locator('#console-error')
        const AASTab = page.locator("#aas-tab")

        await expect(AASView).toHaveClass("console-view aas-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(AASTab).toBeChecked({ checked: false })

        await AASTab.click()

        await expect(AASTab).toBeChecked({ checked: true })
        await expect(AASView).toHaveClass("console-view aas-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const ASSEditor = page.locator('#aas-container')
        const ASSContainer = ASSEditor.getByRole('code').locator('div').filter({ hasText: '"idShort": "AssetInterfacesDescription",' }).nth(4)

        await expect(ASSEditor).toHaveAttribute('data-mode-id', "json")
        await expect(ASSContainer).toHaveText('"idShort": "AssetInterfacesDescription",')

        // Start waiting for download before clicking.
        const AASDownload = page.locator('#aas-download')
        const downloadPromise = page.waitForEvent('download')
        await AASDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'MyLampThing-AAS.json'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })
})

test.describe("Defaults view functionality", () => {
    test("Opening the Defaults view with the Thing Template and closing it", async ({ page }) => {

        const initialTab = page.locator("#tab").nth(0)
        await expect(initialTab).toHaveAttribute('data-tab-id', "1")
        await expect(initialTab).toHaveText("TDThing TemplateCloseCancel")
        await expect(initialTab).toHaveClass("active")

        const DefaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const DefaultsTab = page.locator("#defaults-tab")

        await expect(DefaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(DefaultsTab).toBeChecked({ checked: false })

        await DefaultsTab.click()

        await expect(DefaultsTab).toBeChecked({ checked: true })
        await expect(DefaultsView).toHaveClass("console-view defaults-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const defaultsEditor = page.locator('#defaults-container')
        const defaultsContainer = defaultsEditor.getByRole('code').locator('div').filter({ hasText: '"description": "This is your customizable template. Edit it to fit your Thing Description or Thing Model needs!",' }).nth(4)

        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "json")
        await expect(defaultsContainer).toHaveText('"description": "This is your customizable template. Edit it to fit your Thing Description or Thing Model needs!",')

        const defaultsJsonBtn = page.locator('#defaults-json')
        const defaultsAddBtn = page.locator('#defaults-add')

        await expect(defaultsJsonBtn).toBeDisabled()
        await expect(defaultsAddBtn).toBeDisabled()

        const trashBtn = page.locator(".trash")
        await trashBtn.click()

        await expect(DefaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(DefaultsTab).toBeChecked({ checked: false })
    })

    test("Trying to open the Defaults view with a TM", async ({ page }) => {

        await page.locator("#examples-btn").click()

        const thingTypeToggle = page.locator('#thing-type-btn')
        await thingTypeToggle.click()
        await expect(thingTypeToggle).toBeChecked({ checked: true })

        const quickAccessBtn = page.locator(".example").filter({ hasText: 'Basic TM' }).nth(1).getByRole("button").nth(0)
        await quickAccessBtn.click()

        const exampleTab = page.locator("#tab").nth(1)
        await expect(exampleTab).toHaveAttribute('data-tab-id', "2")
        await expect(exampleTab).toHaveText("TMLamp ThingCloseCancel")
        await expect(exampleTab).toHaveClass("active")

        const DefaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const DefaultsTab = page.locator("#defaults-tab")

        await expect(DefaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(DefaultsTab).toBeChecked({ checked: false })

        await DefaultsTab.click()

        await expect(DefaultsTab).toBeChecked({ checked: true })
        await expect(DefaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(page.locator(".console-error__txt")).toHaveText("This function is only allowed for Thing Descriptions!")

    })

    test("Open the Defaults view as YAML", async ({ page }) => {

        const templateEditor = page.locator("#editor1")
        await expect(templateEditor).toHaveAttribute('data-ide-id', "1")
        await expect(templateEditor).toHaveAttribute('data-mode-id', "json")
        await expect(templateEditor).toHaveClass("editor active")

        const jsonYamlPopup = page.locator('.json-yaml-warning')
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")

        const jsonBtn = page.locator('#file-type-json')
        const yamlBtn = page.locator('#file-type-yaml')

        await expect(jsonBtn).toBeChecked({ checked: true })
        await expect(yamlBtn).toBeChecked({ checked: false })

        await yamlBtn.click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning")

        await page.locator('#yaml-confirm-btn').click()
        await expect(jsonYamlPopup).toHaveClass("json-yaml-warning closed")
        await expect(templateEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(jsonBtn).toBeChecked({ checked: false })
        await expect(yamlBtn).toBeChecked({ checked: true })

        const defaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const defaultsTab = page.locator("#defaults-tab")

        await expect(defaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(defaultsTab).toBeChecked({ checked: false })

        await defaultsTab.click()

        await expect(defaultsTab).toBeChecked({ checked: true })
        await expect(defaultsView).toHaveClass("console-view defaults-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const defaultsEditor = page.locator('#defaults-container')
        const defaultsContainer = defaultsEditor.getByRole('code').locator('div').filter({ hasText: 'description: >-' }).nth(4)
        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(defaultsContainer).toHaveText('description: >-')

        const defaultsYamlBtn = page.locator('#defaults-yaml')
        await expect(defaultsYamlBtn).toBeDisabled()
    })

    test("Open the Defaults view and change form JSON to YAML and from YAML to JSON", async ({ page }) => {
        const templateEditor = page.locator("#editor1")
        await expect(templateEditor).toHaveAttribute('data-ide-id', "1")
        await expect(templateEditor).toHaveAttribute('data-mode-id', "json")
        await expect(templateEditor).toHaveClass("editor active")

        const defaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const defaultsTab = page.locator("#defaults-tab")

        await expect(defaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(defaultsTab).toBeChecked({ checked: false })

        await defaultsTab.click()

        await expect(defaultsTab).toBeChecked({ checked: true })
        await expect(defaultsView).toHaveClass("console-view defaults-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const defaultsEditor = page.locator('#defaults-container')

        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "json")

        const defaultsJsonBtn = page.locator('#defaults-json')
        const defaultsYamlBtn = page.locator('#defaults-yaml')

        await expect(defaultsJsonBtn).toBeDisabled()

        await defaultsYamlBtn.click()

        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(defaultsYamlBtn).toBeDisabled()

        await defaultsJsonBtn.click()

        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "json")
        await expect(defaultsJsonBtn).toBeDisabled()
    })

    test("Open the Defaults view and removing and adding default values", async ({ page }) => {

        const templateEditor = page.locator("#editor1")
        await expect(templateEditor).toHaveAttribute('data-ide-id', "1")
        await expect(templateEditor).toHaveClass("editor active")

        const defaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const defaultsTab = page.locator("#defaults-tab")

        await expect(defaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(defaultsTab).toBeChecked({ checked: false })

        await defaultsTab.click()

        await expect(defaultsTab).toBeChecked({ checked: true })
        await expect(defaultsView).toHaveClass("console-view defaults-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const defaultsAddBtn = page.locator('#defaults-add')
        const defaultsRemoveBtn = page.locator('#defaults-remove')

        await expect(defaultsAddBtn).toBeDisabled()

        await defaultsRemoveBtn.click()
        await expect(defaultsRemoveBtn).toBeDisabled()

        await defaultsAddBtn.click()
        await expect(defaultsAddBtn).toBeDisabled()
    })

    test("Open the Defaults view and downloading it as JSON with defaults", async ({ page }) => {

        const templateEditor = page.locator("#editor1")
        await expect(templateEditor).toHaveAttribute('data-ide-id', "1")
        await expect(templateEditor).toHaveAttribute('data-mode-id', "json")
        await expect(templateEditor).toHaveClass("editor active")

        const DefaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const DefaultsTab = page.locator("#defaults-tab")

        await expect(DefaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(DefaultsTab).toBeChecked({ checked: false })

        await DefaultsTab.click()

        await expect(DefaultsTab).toBeChecked({ checked: true })
        await expect(DefaultsView).toHaveClass("console-view defaults-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const defaultsEditor = page.locator('#defaults-container')
        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "json")

        const DefaultsJsonBtn = page.locator('#defaults-json')
        await expect(DefaultsJsonBtn).toBeDisabled()

        // Start waiting for download before clicking.
        const DefaultsDownload = page.locator('#defaults-download')
        const downloadPromise = page.waitForEvent('download')
        await DefaultsDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'Thing-Template-with-Defaults.json'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    test("Open the OpenAPI view and downloading it as YAML", async ({ page }) => {
        const templateEditor = page.locator("#editor1")
        await expect(templateEditor).toHaveAttribute('data-ide-id', "1")
        await expect(templateEditor).toHaveAttribute('data-mode-id', "json")
        await expect(templateEditor).toHaveClass("editor active")

        const DefaultsView = page.locator('#defaults-view')
        const consoleError = page.locator('#console-error')
        const DefaultsTab = page.locator("#defaults-tab")

        await expect(DefaultsView).toHaveClass("console-view defaults-view hidden")
        await expect(consoleError).toHaveClass("console-view console-error hidden")
        await expect(DefaultsTab).toBeChecked({ checked: false })

        await DefaultsTab.click()

        await expect(DefaultsTab).toBeChecked({ checked: true })
        await expect(DefaultsView).toHaveClass("console-view defaults-view")
        await expect(consoleError).toHaveClass("console-view console-error hidden")

        const defaultsEditor = page.locator('#defaults-container')
        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "json")

        const defaultsJsonBtn = page.locator('#defaults-json')
        const defaultsYamlBtn = page.locator('#defaults-yaml')

        await expect(defaultsJsonBtn).toBeDisabled()

        await defaultsYamlBtn.click()

        await expect(defaultsEditor).toHaveAttribute('data-mode-id', "yaml")
        await expect(defaultsYamlBtn).toBeDisabled()

        const defaultsAddBtn = page.locator('#defaults-add')
        const defaultsRemoveBtn = page.locator('#defaults-remove')

        await expect(defaultsAddBtn).toBeDisabled()

        await defaultsRemoveBtn.click()
        await expect(defaultsRemoveBtn).toBeDisabled()

        // Start waiting for download before clicking.
        const defaultsDownload = page.locator('#defaults-download')
        const downloadPromise = page.waitForEvent('download')
        await defaultsDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'Thing-Template-without-Defaults.yaml'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })
})

test.describe("Visualization view functionality", () => {

    test("Open the visualization view with the thing template and closing it", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        const graphVisTitle = page.locator('#visualized').getByText('Thing Template', { exact: true })
        await expect(graphVisTitle).toHaveText("Thing Template")

        const trashBtn = page.locator(".trash")
        await trashBtn.click()

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })
    })

    test("Open the visualization view with the thing template and expand and collapse the graph view", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')
        const collapseAllBtn = page.locator('#collapse-all')
        const expandAllBtn = page.locator('#expand-all')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        const svgPaths = page.locator("svg > g > path")
        await expect(svgPaths).toHaveCount(9)

        await expandAllBtn.click()
        await expect(expandAllBtn).toBeDisabled()

        await expect(svgPaths).toHaveCount(12)

        await collapseAllBtn.click()
        await expect(collapseAllBtn).toBeDisabled()

        await expect(svgPaths).toHaveCount(0)
    })

    test("Open the visualization view with the thing template download the graph view as SVG", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        // Start waiting for download before clicking.
        const svgDownload = page.locator('#download-svg')
        const downloadPromise = page.waitForEvent('download')
        await svgDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'Graph-visualization.svg'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    test("Open the visualization view with the thing template and download the graph view as PNG", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        // Start waiting for download before clicking.
        const pngDownload = page.locator('#download-png')
        const downloadPromise = page.waitForEvent('download')
        await pngDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'Graph-visualization.png'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    test("Open the tree visualization view with the thing template and modified the input values", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        await treeViewBtn.click()
        await expect(graphViewBtn).toBeChecked({ checked: false })
        await expect(treeViewBtn).toBeChecked({ checked: true })

        const labelBtn = page.getByLabel('labels')
        const radiusSlider = page.getByLabel('radius')
        const extentSlider = page.getByLabel('extent')
        const rotateSlider = page.getByLabel('rotate')
        const dragSlider = page.getByLabel('drag precision')
        const tidyBtn = page.getByLabel('tidy')
        const clusterBtn = page.getByLabel('cluster')
        const linksDropDown = page.getByLabel('links')

        await expect(labelBtn).toBeChecked({ checked: true })
        await expect(radiusSlider).toHaveValue("350")
        await expect(extentSlider).toHaveValue("360")
        await expect(rotateSlider).toHaveValue("0")
        await expect(dragSlider).toHaveValue("100")
        await expect(tidyBtn).toBeChecked({ checked: true })
        await expect(clusterBtn).toBeChecked({ checked: false })
        await expect(linksDropDown).toHaveValue("line")

        await labelBtn.click()
        await radiusSlider.click()
        await extentSlider.click()
        await rotateSlider.click()
        await dragSlider.click()
        await clusterBtn.check()
        await linksDropDown.selectOption("diagonal")
        await expect(labelBtn).toBeChecked({ checked: false })

        const radiusSliderValue = await radiusSlider.inputValue()
        expect(parseInt(radiusSliderValue)).toBeLessThan(450)
        expect(parseInt(radiusSliderValue)).toBeGreaterThan(330)

        const extentSliderValue = await extentSlider.inputValue()
        expect(parseInt(extentSliderValue)).toBeLessThan(190)
        expect(parseInt(extentSliderValue)).toBeGreaterThan(170)

        const rotateSliderValue = await rotateSlider.inputValue()
        expect(parseInt(rotateSliderValue)).toBeLessThan(190)
        expect(parseInt(rotateSliderValue)).toBeGreaterThan(170)

        const dragSliderValue = await dragSlider.inputValue()
        expect(parseInt(dragSliderValue)).toBeLessThan(60)
        expect(parseInt(dragSliderValue)).toBeGreaterThan(40)
        
        await expect(tidyBtn).toBeChecked({ checked: false })
        await expect(clusterBtn).toBeChecked({ checked: true })
        await expect(linksDropDown).toHaveValue("diagonal")

    })

    test("Open the tree visualization view with the thing template and download as SVG", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        await treeViewBtn.click()
        await expect(graphViewBtn).toBeChecked({ checked: false })
        await expect(treeViewBtn).toBeChecked({ checked: true })

        // Start waiting for download before clicking.
        const svgDownload = page.locator('#download-svg')
        const downloadPromise = page.waitForEvent('download')
        await svgDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'Tree-visualization.svg'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })

    test("Open the tree visualization view with the thing template and download as PNG", async ({ page }) => {

        const visualizeView = page.locator('#visualize-view')
        const visualizeTab = page.locator("#visualize-tab")

        await expect(visualizeView).toHaveClass("console-view visualize-view hidden")
        await expect(visualizeTab).toBeChecked({ checked: false })

        await visualizeTab.click()

        await expect(visualizeTab).toBeChecked({ checked: true })
        await expect(visualizeView).toHaveClass("console-view visualize-view")

        const graphViewBtn = page.locator('#graph-view')
        const treeViewBtn = page.locator('#tree-view')

        await expect(graphViewBtn).toBeChecked({ checked: true })
        await expect(treeViewBtn).toBeChecked({ checked: false })

        await treeViewBtn.click()
        await expect(graphViewBtn).toBeChecked({ checked: false })
        await expect(treeViewBtn).toBeChecked({ checked: true })

        // Start waiting for download before clicking.
        const pngDownload = page.locator('#download-png')
        const downloadPromise = page.waitForEvent('download')
        await pngDownload.click()
        const download = await downloadPromise
        const expectedFilename = 'Tree-visualization.png'
        expect(download.suggestedFilename()).toBe(expectedFilename)
    })
})