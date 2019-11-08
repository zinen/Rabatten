/* global debuglog, chrome, DiscountServices */
debuglog('Background: scrip is running!')

chrome.runtime.onInstalled.addListener(async function () {
  function getStorageSync (key) {
    return new Promise(resolve => {
      chrome.storage.sync.get(key, function (data) {
        resolve(data)
      })
    })
  }
  function setStorageSync (key, data) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ [key]: [data] }, function () {
        resolve()
      })
    })
  }
  // Known data settings, and their default values
  const knownSettings = {
    version: null, // Does nothing
    memberships: '_options', // Special case, opens settingspage
    domainfilter: ['facebook.com', 'google.com', 'forbrugsforeningen.dk'] // For compatablity for installs before v0.1.0
  }
  let optionsOpen = false
  const settings = await getStorageSync(null)
  const startSettings = Object.assign({}, settings)
  for (const key in knownSettings) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      if (knownSettings[key] === null) {
        continue
      } else if (knownSettings[key].slice(0, 1) === '_') {
        if (knownSettings[key] === '_options') {
          optionsOpen = true
        } else {
          console.error('Special case, unkown')
        }
      } else {
        debuglog('Data: ' + key + ' is missing from settings, added now')
        settings[key] = knownSettings[key]
      }
    }
  }
  if (JSON.stringify(settings) !== JSON.stringify(startSettings)) {
    debuglog('Creating settings now')
    for (const key in settings) {
      await setStorageSync(key, settings[key])
    }
  }
  if (optionsOpen) {
    const optionsUrl = chrome.extension.getURL('/options.html')
    chrome.tabs.create({ url: optionsUrl })
  } else {
    // If all was settings is okay, without need for manual updating of varibles
    // then get updated list of memberships
    getDiscounts()
  }
})

chrome.runtime.onStartup.addListener(function () {
  // Runs at startup
  chrome.storage.local.remove('rabat_closed')
  chrome.storage.local.set({ matchHolder: {} })
  getDiscounts()
})

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Handels any incoming messeges between background, content, popup and options
  // Respons with needed data
  if (message.matchHolder) {
    // Used to receive message from content about a page match
    debuglog('Badge text set!')
    chrome.browserAction.setBadgeText({ text: '!', tabId: sender.tab.id })
    chrome.storage.local.get('matchHolder', function (content) {
      const matchHolder = content.matchHolder || {}
      // Only store a fixed amount of data, and delete first if more data is needed
      if (Object.keys(matchHolder).length > 10) {
        const firstObject = Object.keys(matchHolder)[0]
        console.log('Deleting', matchHolder[firstObject])
        delete matchHolder[firstObject]
      }
      matchHolder[sender.tab.id] = message.matchHolder
      chrome.storage.local.set({ matchHolder: matchHolder })
    })
  } else if (message.getDiscounts) {
    // By request of options page, initiate a new download of data
    getDiscounts()
  } else {
    // Debug any unkown incoming messages
    debuglog('1 of 3 - Debug message')
    debuglog(message)
    debuglog('2 of 3 - Debug sender:')
    debuglog(sender)
    debuglog('3 of 3 - Debug sendResponse:')
    debuglog(sendResponse)
  }
})

async function getDiscounts () {
  chrome.storage.sync.get('memberships', function (items) {
    const servicses = items.memberships || []
    for (const service of servicses) {
      window.fetch(DiscountServices[service][0].databaseURL)
        .then(response => response.text())
        .then(input => {
          // replace singel quotes with double quotes
          // removes semicolons
          input = input.replace(/'/g, '"').replace(/;/g, '')
          return JSON.parse(input)
        })
        .then(input => {
          chrome.storage.local.set({ [DiscountServices[service][0].arrayName]: input }, function () {
            debuglog('Data for: ' + service + ' is updated')
          })
        })
        .catch(err => console.error(err))
    }
  })
}

debuglog('Background: scrip end.')
