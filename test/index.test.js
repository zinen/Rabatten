
const assert = require('assert')
const puppeteer = require('puppeteer')
const rewire = require('rewire')

// Controlled test data for content of top pane
const topPaneData = [
  {
    // Test for service 1
    webpage: 'https://bauhaus.dk/',
    expectedTextContent: 'testData1-1 har 101 % igennem forbrugsforeningenX'
  },
  {
    // Test for service 2
    webpage: 'https://cewe.dk/',
    expectedTextContent: 'testData2-5 har 105 % igennem logbuyX'
  },
  {
    // Test for multiple discounts
    webpage: 'https://www.ticketmaster.dk/',
    expectedTextContent: 'ticketmaster.dk har flere tilbud igennem forbrugsforeningenX'
  },
  {
    // Test for top pane top offset 0
    webpage: 'https://silvan.dk/',
    expectedTextContent: 'silvan.dk har tilbud igennem flere udbydereX'
  },
  {
    // Test for top pane left offset 0
    webpage: 'https://taenk.dk/'
  }
]
async function delay (msSec) {
  return new Promise(resolve => {
    setTimeout(() => resolve('DelayTimeout'), msSec)
  })
}

;(async () => {
  const DiscountServices = rewire('../build/common.js').__get__('DiscountServices')
  const ArrayOfDatabaseURL = []
  Object.keys(DiscountServices).forEach((service) => {
    ArrayOfDatabaseURL.push(DiscountServices[service].databaseURL)
  })
  // console.log('ArrayOfDatabaseURL', ArrayOfDatabaseURL)
  await delay(1500)
  let browser
  try {
    const pathToExtension = require('path').join(__dirname, '../build/')
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXEC_PATH,
      // headless: false, // default is true
      args: [
        '--no-sandbox',
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--lang=da-DK',
        '--disable-infobars',
        '--window-position=960,10',
        '--user-agent=PuppeteerAgent'
      ]
    })
    // Wait for extension to fully load, and show its options page
    const extensionOptionsPageTarget = await browser.waitForTarget(target => target.url().includes('options.html'))
    const targets = await browser.targets()
    // Search for background page
    const extensionBackgroundPageTarget = targets.find(target => (target.type() === 'background_page' && target._targetInfo.title === 'Rabatten'))
    const extensionBackgroundPage = await extensionBackgroundPageTarget.page()
    await extensionBackgroundPage.setRequestInterception(true)
    // Inject controlled data from external resource
    extensionBackgroundPage.on('request', request => {
      if (request._url === DiscountServices.forbrugsforeningen.databaseURL) {
        // Make fake data for forbrugsforeningen
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: `[
                ["bauhaus.dk", "testData1-1", "101 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["ticketmaster.dk", "testData1-2", "102 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["ticketmaster.dk", "testData1-3", "103 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["silvan.dk", "testData1-4", "104 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["taenk.dk", "testData1-5", "104 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"]
              ]`
        })
      } else if (request._url === DiscountServices.logbuy.databaseURL) {
        // Make fake data for logbuy
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: '[["cewe.dk", "testData2-5", "105 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"], ' +
                '["silvan.dk", "testData2-6", "106 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"]]'
        })
      } else if (ArrayOfDatabaseURL.includes(request._url)) {
        // Make fate data for any other know service
        console.log(`Request blocked for ${request._url}`)
        // request.abort() // TODO: Fix this should not break the app
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: '[]'
        })
      } else {
        request.continue()
      }
    })
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    const extensionOptionsURL = extensionOptionsPageTarget !== undefined ? extensionOptionsPageTarget.url() : undefined
    assert(extensionOptionsURL !== undefined, 'Options page is not found')
    // Get values af check boxes
    const checkBoxValues = await extensionOptionsPage.$$eval('#check-list label', els => {
      return els.map(el => el.innerText)
    })

    // Get values of what should be inside check boxes
    const checkBoxValuesExpect = Object.keys(DiscountServices).map(key => DiscountServices[key].name)
    // Test: Confirm that checkboxes contain the expected values
    assert.deepStrictEqual(checkBoxValues, checkBoxValuesExpect, 'Text: On settings page, content of service choices is wrong')
    // Check all the checkboxes
    const checkList = await extensionOptionsPage.$$('#check-list label')
    for await (const check of checkList) {
      await check.click()
    }
    // Click save, this also should close the options page
    await extensionOptionsPage.click('#optionsSubmit')
    // Check 3 sites for expected content in the top panel
    for await (const testObject of topPaneData) {
      const scrapedContent = await getTopPaneData(testObject.webpage, browser)
      // console.log('testObject', testObject)
      console.log('scrapedContent', scrapedContent)
      if (testObject.expectedTextContent) {
        assert.strictEqual(scrapedContent.textContent, testObject.expectedTextContent, 'Text: Content of top pane is wrong')
      }
      assert.strictEqual(scrapedContent.styleOffsetLeft, 0, 'Style: Left offset of top pane is wrong')
      assert.strictEqual(scrapedContent.styleOffsetTop, 0, 'Style: Top offset of top pane is wrong')
      assert.strictEqual(scrapedContent.styleHeight, 28, 'Style: Height of top pane is wrong')
    }
    console.log('\x1b[92mAll checks succeeded. Closing browser now.\x1b[39m')
  } catch (error) {
    console.log('---Error1---')
    console.log(error)
    console.log('-----------')
    process.exitCode = 1
  }
  try {
    browser.close()
  } catch (error) {
    console.log('---Warning2---')
    console.log(error)
    console.log('-----------')
  }
})()
async function getTopPaneData (URL, browser) {
  const page = await browser.newPage()
  await page.goto(URL, { waitUntil: 'networkidle2' })
  // Wait for 1 second
  await page.waitFor(1000)
  const scrapedContent = await page.$$eval('body > div', divs => {
    for (const div of divs) {
      // Search to find the correct div
      if (div.shadowRoot && div.shadowRoot.querySelector('#aso12909')) {
        const divInScope = div.shadowRoot.querySelector('#aso12909')
        return {
          textContent: divInScope.textContent.trim(),
          styleOffsetLeft: divInScope.offsetLeft,
          styleOffsetTop: divInScope.offsetTop,
          styleHeight: divInScope.clientHeight
        }
      }
    }
  })
  await page.close()
  return scrapedContent
}

// Test domain ignore filter
// Test handle not reaching cdn.jsdeliver. Currently it breaks the app.
