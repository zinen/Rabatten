
/* global describe, before, beforeEach, it, afterEach */
const assert = require('assert')
const puppeteer = require('puppeteer')
const rewire = require('rewire')

async function delay (msSec) {
  return new Promise(resolve => {
    setTimeout(() => resolve('DelayTimeout'), msSec)
  })
}

/**
 * Function to return data from top pane
 *
 * @param {string} URL The URL to go to and scrape data from top pane
 * @param {string} [ID='0'] Optional ID to assign to screenshot
 * @returns {object} Object containing style of found top pane
 */
async function getTopPaneData (URL, ID = '0') {
  const page = await browser.newPage()
  await page.goto(URL, { waitUntil: 'networkidle2' })
  // Wait for 1 second to allow this extension to loops its data and show the top pane
  await page.waitFor(1000)
  // Transform URL to something approved by file system eg. https://bauhaus.dk/ into bauhaus.dk
  const screenshotPath = './logs/screenshot/' + ID + '-test-top-pane-of-' + URL.split(/\/\/(.*)\//)[1] + '.jpg'
  await page.screenshot({ path: screenshotPath, type: 'jpeg' })
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
    // If div is not found return null
    return null
  })
  await page.close()
  return scrapedContent
}

let browser
let DiscountServices
let pathToExtension
const ArrayOfDatabaseURL = []

before(async function () {
  pathToExtension = require('path').join(__dirname, '../build/')
  DiscountServices = rewire('../build/common.js').__get__('DiscountServices')
  Object.keys(DiscountServices).forEach((service) => {
    ArrayOfDatabaseURL.push(DiscountServices[service].databaseURL)
  })
  // console.log('ArrayOfDatabaseURL', ArrayOfDatabaseURL)
})

beforeEach(async function () {
  this.timeout(10000)
  browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXEC_PATH,
    headless: false, // to install extensions headless must be false
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
  // Wait for extension to be fully loaded and running.
  await delay(1500)
})

afterEach(async function () {
  await browser.close()
})

describe('test extension', function () {
  this.timeout(10000)
  this.retries(1)
  it('1: options page should show after first install', async function () {
    const extensionOptionsPageTarget = await browser.waitForTarget(target => target.url().includes('options.html'))
    const extensionOptionsURL = extensionOptionsPageTarget !== undefined ? extensionOptionsPageTarget.url() : undefined
    assert(extensionOptionsURL !== undefined, '1: Options page is not found')
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    await extensionOptionsPage.screenshot({ path: './logs/screenshot/1-test-options-page-new-install.jpg', type: 'jpeg' })
  })

  it('2: background page must be running', async function () {
    const targets = await browser.targets()
    const extensionBackgroundPageTarget = targets.find(target => (target.type() === 'background_page' && target._targetInfo.title === 'Rabatten'))
    assert(await extensionBackgroundPageTarget !== undefined, '2; Background page is not found')
  })

  it('3: options page check all check boxes and saving should start background page fetching data', async function () {
    const extensionOptionsPageTarget = await browser.waitForTarget(target => target.url().includes('options.html'))
    const targets = await browser.targets()
    // Search for background page
    const extensionBackgroundPageTarget = targets.find(target => (target.type() === 'background_page' && target._targetInfo.title === 'Rabatten'))
    const extensionBackgroundPage = await extensionBackgroundPageTarget.page()
    await extensionBackgroundPage.setRequestInterception(true)
    const ArrayOfURLRequests = []
    // Inject controlled data from external resource
    extensionBackgroundPage.on('request', request => {
      request.respond({
        status: 200,
        contentType: 'text/plain',
        body: '[]'
      })
      ArrayOfURLRequests.push(request._url)
    })
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    await extensionOptionsPage.screenshot({ path: './logs/screenshot/3-test-options-page-new-install.jpg', type: 'jpeg' })
    // Get values af check boxes
    const checkBoxValues = await extensionOptionsPage.$$eval('#check-list label', els => {
      return els.map(el => el.innerText)
    })

    // Get values of what should be inside check boxes
    const checkBoxValuesExpect = Object.keys(DiscountServices).map(key => DiscountServices[key].name)
    assert.deepStrictEqual(checkBoxValues, checkBoxValuesExpect, '3: Text on settings page, content of service choices is wrong')
    // Check all the checkboxes
    const checkList = await extensionOptionsPage.$$('#check-list label')
    for await (const check of checkList) {
      await check.click()
    }
    await extensionOptionsPage.screenshot({ path: './logs/screenshot/3-test-options-page-before-save.jpg', type: 'jpeg' })
    // Click save, this should also close the options page
    await extensionOptionsPage.click('#optionsSubmit')
    // Wait for save to handel its web requests
    await delay(1000)
    // console.log('ArrayOfURLRequests', ArrayOfURLRequests)
    assert.deepStrictEqual(ArrayOfURLRequests, ArrayOfDatabaseURL, '3: Fetching discount database didn\'t return as expected')
  })

  it('4: test top pane on some sites', async function () {
    this.timeout(60000)
    const extensionOptionsPageTarget = await browser.waitForTarget(target => target.url().includes('options.html'))
    const targets = await browser.targets()
    // Search for background page
    const extensionBackgroundPageTarget = targets.find(target => (target.type() === 'background_page' && target._targetInfo.title === 'Rabatten'))
    const extensionBackgroundPage = await extensionBackgroundPageTarget.page()
    await extensionBackgroundPage.setRequestInterception(true)
    const ArrayOfURLRequests = []
    // Inject controlled data from external resource
    extensionBackgroundPage.on('request', request => {
      if (request._url === DiscountServices.forbrugsforeningen.databaseURL) {
        // Make fake data for forbrugsforeningen
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: `[
                ["bauhaus.dk", "testData1-1", "101 %", "http://www.home.page"],
                ["ticketmaster.dk", "testData1-2", "102 %", "http://www.home.page"],
                ["ticketmaster.dk", "testData1-3", "103 %", "http://www.home.page"],
                ["silvan.dk", "testData1-4", "104 %", "http://www.home.page"],
                ["taenk.dk", "testData1-5", "104 %", "http://www.home.page"]
              ]`
        })
        ArrayOfURLRequests.push(request._url)
      } else if (request._url === DiscountServices.logbuy.databaseURL) {
        // Make fake data for logbuy
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: '[["cewe.dk", "testData2-5", "105 %", "http://www.home.page"], ' +
                '["silvan.dk", "testData2-6", "106 %", "http://www.home.page"]]'
        })
        ArrayOfURLRequests.push(request._url)
      } else if (ArrayOfDatabaseURL.includes(request._url)) {
        // console.log(`Request blocked for ${request._url}`)
        request.abort()
        // request.respond({
        //   status: 200,
        //   contentType: 'text/plain',
        //   body: '[]'
        // })
        ArrayOfURLRequests.push(request._url)
      } else {
        request.continue()
        ArrayOfURLRequests.push(request._url)
      }
    })
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    // Check all the checkboxes
    const checkList = await extensionOptionsPage.$$('#check-list label')
    for await (const check of checkList) {
      await check.click()
    }
    // Click save, this also should close the options page
    await extensionOptionsPage.click('#optionsSubmit')
    // Wait for save to handel its web requests
    await delay(500)
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
    // Check some sites for expected content in the top pane
    for await (const testObject of topPaneData) {
      // console.log('testObject', testObject)
      const scrapedContent = await getTopPaneData(testObject.webpage, '4')
      // console.log('scrapedContent', scrapedContent)
      if (testObject.expectedTextContent) {
        assert(scrapedContent !== null, '4: Top pane is not found')
        assert.strictEqual(scrapedContent.textContent, testObject.expectedTextContent, '4: Text content of top pane is wrong')
      }
      assert.strictEqual(scrapedContent.styleOffsetLeft, 0, '4: Style left offset of top pane is wrong')
      assert.strictEqual(scrapedContent.styleOffsetTop, 0, '4: Style top offset of top pane is wrong')
      assert.strictEqual(scrapedContent.styleHeight, 28, '4: Style height of top pane is wrong')
    }
  })

  it('5: test if filters on settings page gets fixed when wrong URL input', async function () {
    const extensionOptionsPageTarget = await browser.waitForTarget(target => target.url().includes('options.html'))
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    const extensionOptionsPageURL = await extensionOptionsPage.url()
    await extensionOptionsPage.type('#domainFilter', ',http://test.url/index.html')
    await extensionOptionsPage.$eval('#domainFilter', e => {
      e.value = `,http://test.url/index.html, www.web.co.uk, shop.hear.com
      newline.here`
    })
    await extensionOptionsPage.screenshot({ path: './logs/screenshot/5-test-options-bad-filter-before-save.jpg', type: 'jpeg' })
    await extensionOptionsPage.click('#optionsSubmit')
    // Wait for save to handel its web requests
    await delay(500)
    // On submit options page closes, reopen again to see result of domain filter
    const page = await browser.newPage()
    await page.goto(extensionOptionsPageURL, { waitUntil: 'networkidle2' })
    let filterResult = await page.$eval('#domainFilter', e => e.value)
    filterResult = filterResult.split(',').map(s => s.trim()) // Split and trim array
    await page.screenshot({ path: './logs/screenshot/5-test-options-bad-filter-after-save.jpg', type: 'jpeg' })
    // console.log('result', result)
    const filterExpected = ['test.url', 'web.co.uk', 'hear.com', 'newline.here', '']
    assert.deepStrictEqual(filterResult, filterExpected, '5: Text inside filter fields on settings page is not corrected as expected')
  })

  it('6: define filters on settings page should prevent top pane on sites', async function () {
    this.timeout(20000)
    const extensionOptionsPageTarget = await browser.waitForTarget(target => target.url().includes('options.html'))
    const targets = await browser.targets()
    // Search for background page
    const extensionBackgroundPageTarget = targets.find(target => (target.type() === 'background_page' && target._targetInfo.title === 'Rabatten'))
    const extensionBackgroundPage = await extensionBackgroundPageTarget.page()
    await extensionBackgroundPage.setRequestInterception(true)
    const ArrayOfURLRequests = []
    // Inject controlled data from external resource
    extensionBackgroundPage.on('request', request => {
      if (request._url === DiscountServices.forbrugsforeningen.databaseURL) {
        // Make fake data for forbrugsforeningen
        request.respond({
          status: 200,
          contentType: 'text/plain',
          body: `[
                ["bauhaus.dk", "testData1-1", "101 %", "http://www.home.page"]
              ]`
        })
        ArrayOfURLRequests.push(request._url)
      } else if (ArrayOfDatabaseURL.includes(request._url)) {
        request.abort()
        ArrayOfURLRequests.push(request._url)
      } else {
        request.continue()
        ArrayOfURLRequests.push(request._url)
      }
    })
    const extensionOptionsPage = await extensionOptionsPageTarget.page()
    // Check all the checkboxes
    const checkList = await extensionOptionsPage.$$('#check-list label')
    for await (const check of checkList) {
      await check.click()
    }
    await extensionOptionsPage.type('#domainFilter', ',http://bauhaus.dk')
    await extensionOptionsPage.screenshot({ path: './logs/screenshot/6-test-options-page-before-save-filter.jpg', type: 'jpeg' })
    await extensionOptionsPage.click('#optionsSubmit')
    // Wait for save to handel its web requests
    await delay(500)
    // Check site for no top pane
    const URL = 'http://bauhaus.dk'
    const page = await browser.newPage()
    await page.goto(URL, { waitUntil: 'networkidle2' })
    await page.screenshot({ path: './logs/screenshot/6-test-top-pane-filtered-out.jpg', type: 'jpeg' })
    const scrapedContent = await page.$$eval('body > div', divs => {
      for (const div of divs) {
        // Search to find the correct div
        if (div.shadowRoot && div.shadowRoot.querySelector('#aso12909')) {
          return true
        }
      }
      // If div is not found return false
      return false
    })
    assert.strictEqual(scrapedContent, false, '6: Top pane should be missing but was found')
  })
})
