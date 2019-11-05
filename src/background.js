debuglog('Background: scrip is running!');

chrome.runtime.onInstalled.addListener(async function () {
  function getStorageSync(key) {
    return new Promise(resolve => {
      chrome.storage.sync.get(key, function (data) {
        resolve(data);
      })
    })
  }
  function setStorageSync(key, data) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ [key]: [data] }, function () {
        resolve();
      });
    })
  }
  //Known data settings, and their default values
  let known_settings = {
    version: null, //Does nothing
    memberships: "_options", //Special case, opens settingspage
    domainfilter: ["facebook.com", "google.com", "forbrugsforeningen.dk"] //For compatablity for installs before v0.1.0
  }
  let optionsOpen = false;
  let settings = await getStorageSync(null);
  let start_settings = Object.assign({}, settings);
  for (var key in known_settings) {
    if (!settings.hasOwnProperty(key)) {
      if (known_settings[key] === null) {
        continue;
      } else if (known_settings[key].slice(0, 1) == "_") {
        if (known_settings[key] == "_options") {
          optionsOpen = true;
        } else {
          console.error("Special case, unkown");
        }
      } else {
        debuglog("Data: "+ key+ " is missing from settings, added now");
        settings[key] = known_settings[key];
      }
    }
  }
  if (JSON.stringify(settings) !== JSON.stringify(start_settings)) {
    debuglog("Creating settings now");
    for (var key in settings) {
      await setStorageSync(key, settings[key])
    }
  }
  if (optionsOpen) {
    let optionsUrl = chrome.extension.getURL("/options.html");
    chrome.tabs.create({ url: optionsUrl });
  } else {
    //If all was settings is okay, without need for manual updating of varibles
    //then get updated list of memberships
    getDiscounts();
  }
});

chrome.runtime.onStartup.addListener(function () {
  //Runs at startup
  chrome.storage.local.remove('rabat_closed')
  chrome.storage.local.set({ "matchHolder": {} });
  getDiscounts()
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  //Handels any incoming messeges between background, content, popup and options
  //Respons with needed data
  if (message.matchHolder) {
    //Used to receive message from content about a page match
    debuglog("Badge text set!");
    chrome.browserAction.setBadgeText({ text: "!", tabId: sender.tab.id });
    chrome.storage.local.get("matchHolder", function (content) {
      let matchHolder = content.matchHolder || {};
      console.log(Object.keys(matchHolder).length)
      //Only store a fixed amount of data, and delete first if more data is needed
      if (Object.keys(matchHolder).length > 10) {
        let firstObject = Object.keys(matchHolder)[0]
        console.log("Deleting",matchHolder[firstObject])
        delete matchHolder[firstObject]
      }
      matchHolder[sender.tab.id] = message.matchHolder;
      console.log("adding data",matchHolder)
      chrome.storage.local.set({ "matchHolder": matchHolder });
    });
  } else if (message.getDiscounts) {
    //By request of options page, initiate a new download of data
    getDiscounts();
  } else {
    //Debug any unkown incoming messages
    debuglog("1 of 3 - Debug message")
    debuglog(message)
    debuglog("2 of 3 - Debug sender:")
    debuglog(sender)
    debuglog("3 of 3 - Debug sendResponse:")
    debuglog(sendResponse)
  }
});

function getDiscounts() {
  chrome.storage.sync.get('memberships', function (items) {
    let servicses = items.memberships || [];
    for (let service of servicses) {
      fetch(DiscountServices[service][0].databaseURL)
        .then(response => response.text())
        .then(input => {
          //replace singel quotes with double quotes
          //removes semicolons
          input = input.replace(/'/g, "\"").replace(/;/g, "")
          return JSON.parse(input)
        })
        .then(input => {
          chrome.storage.local.set({ [DiscountServices[service][0].arrayName]: input }, function () {
            debuglog("Data for: " + service + " is updated")
          });
        })
        .catch(err => console.error(err))
    }
  });
}

debuglog('Background: scrip end.');
