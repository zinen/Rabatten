console.log('Background: script is running!')
/**
 * Runs on installaton in the browser.
 */
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
  // Known data keys, and their default values
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
        console.log('Data: ' + key + ' is missing from settings, added now')
        settings[key] = knownSettings[key]
      }
    }
  }
  // New settings avalible in version 1.1.0', will promt to show
  if (settings.version !== '1.1.0') { optionsOpen = true }
  if (JSON.stringify(settings) !== JSON.stringify(startSettings)) {
    console.log('Creating settings now')
    for (const key in settings) {
      await setStorageSync(key, settings[key])
    }
  }
  if (optionsOpen) {
    const optionsUrl = chrome.extension.getURL('/options.html')
    chrome.tabs.create({ url: optionsUrl })
  } else {
    // If all settings is okay, without need for manual updating deined options
    // then get updated list of memberships
    getDiscounts()
  }
})

/**
 * Handling of status to clear saved local variables.
 */
chrome.runtime.onStartup.addListener(function () {
  // Runs at startup
  chrome.storage.local.remove('rabat_closed')
  chrome.storage.local.set({ matchHolder: {} })
  getDiscounts()
})

/**
 * Handling of incoming messages from content and popup script.
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Handels any incoming messeges between background, content, popup and options
  // Respons with needed data
  if (message.matchHolder) {
    // Used to receive message from content about a page match
    console.log('Badge text set!')
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
    console.log('1 of 3 - Debug message')
    console.log(message)
    console.log('2 of 3 - Debug sender:')
    console.log(sender)
    console.log('3 of 3 - Debug sendResponse:')
    console.log(sendResponse)
  }
})

/**
 * Downloads external resources based on chosen services and saves it locally
 */
async function getDiscounts () {
  chrome.storage.sync.get('memberships', function (items) {
    const servicses = items.memberships || []
    for (const service of servicses) {
      window.fetch(DiscountServices[service].databaseURL)
        .then(response => response.json())
        .then(input => {
          chrome.storage.local.set({ [DiscountServices[service].arrayName]: input }, function () {
            console.log('Data for: ' + service + ' is updated')
          })
        })
        .catch(err => console.error(err))
    }
  })
}

console.log('Background: script end.')
