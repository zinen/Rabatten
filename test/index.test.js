
const assert = require('assert')
const puppeteer = require('puppeteer')
const rewire = require('rewire')

// Controlled test data
const knowData = [
  {
    webpage: 'https://bauhaus.dk/',
    expectedResult: 'Testdata1 har 101 % igennem forbrugsforeningenX'
  },
  {
    webpage: 'https://www.ticketmaster.dk/',
    expectedResult: 'ticketmaster.dk har flere tilbud igennem forbrugsforeningenX'
  },
  {
    webpage: 'https://cewe.dk/',
    expectedResult: 'Testdata5 har 105 % igennem logbuyX'
  },
  {
    webpage: 'https://silvan.dk/',
    expectedResult: 'silvan.dk har tilbud igennem flere udbydereX'
  }
]
async function delay (msSec) {
  return new Promise(resolve => {
    setTimeout(() => resolve('DelayTimeout'), msSec)
  })
}

;(async () => {
  const DiscountServices = rewire('../build/common.js').__get__('DiscountServices')
  await delay(1500)
  try {
    const pathToExtension = require('path').join(__dirname, '../build/')
    const browser = await puppeteer.launch({
      headless: false,
      args: [
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
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: `[
                ["bauhaus.dk", "Testdata1", "101 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["ticketmaster.dk", "Testdata2", "102 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["ticketmaster.dk", "Testdata3", "103 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"],
                ["silvan.dk", "Testdata4", "104 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"]
              ]`
        })
      } else if (request._url === DiscountServices.logbuy.databaseURL) {
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: '[["cewe.dk", "Testdata5", "105 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"], ' +
                '["silvan.dk", "Testdata6", "106 %", "https://www.forbrugsforeningen.dk/businesssearch//1001845759"]]'
        })
      } else {
        request.continue()
      }
    })
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    const extensionOptionsURL = extensionOptionsPageTarget !== undefined ? extensionOptionsPageTarget.url() : undefined
    assert(extensionOptionsURL !== undefined, new Error('Options page is not found'))
    // Get values af check boxes
    const checkBoxValues = await extensionOptionsPage.$$eval('#check-list label', els => {
      return els.map(el => el.innerText)
    })

    // Get values of what should be inside check boxes
    const checkBoxValuesExpect = Object.keys(DiscountServices).map(key => DiscountServices[key].name)
    // Test: Confirm that checkboxes contain the expected values
    assert.deepStrictEqual(checkBoxValues, checkBoxValuesExpect)
    // Check all the checkboxes
    const checkList = await extensionOptionsPage.$$('#check-list label')
    for await (const check of checkList) {
      await check.click()
    }
    // Click save, this also should close the optionspage
    await extensionOptionsPage.click('#optionsSubmit')
    // Check 3 sites for expected content in the top panel
    for await (const testObject of knowData) {
      const scrapedContent = await goToDiscountPage(testObject.webpage, browser)
      assert.strictEqual(scrapedContent, testObject.expectedResult)
    }
    console.log('\x1b[92mAll checks succeded\x1b[39m')
    await browser.close()
  } catch (error) {
    console.log('---Error---')
    console.log(error)
    console.log('-----------')
  }
})()
async function goToDiscountPage (URL, browser) {
  const page = await browser.newPage()
  // await page.goto('https://bauhaus.dk/', { waitUntil: 'domcontentloaded' })
  await page.goto(URL, { waitUntil: 'networkidle2' })
  // Wait for 1 second
  await page.waitFor(1000)
  const scrapedContent = await page.$$eval('body > div', divs => {
    for (const div of divs) {
      // Search to find the correct div
      if (div.shadowRoot && div.shadowRoot.querySelector('#aso12909')) {
        return div.shadowRoot.querySelector('#aso12909').textContent.trim()
      }
    }
  })
  await page.close()
  return scrapedContent
}
