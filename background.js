debuglog('Background: scrip is running!');

chrome.runtime.onInstalled.addListener(function () {
  //Runs at installations time
  chrome.storage.sync.get('memberships', function (items) {
    if (items.memberships == null) {
      //Open settings tab, at first run if no values from sync storage is found
      debuglog("Open settings tab for the first time.");
      //Create empty sync varible
      chrome.storage.sync.set({ memberships: [] });
      //Open settings tab
      let optionsUrl = chrome.extension.getURL("/options.html");
      chrome.tabs.create({ url: optionsUrl });
    } else {
      getDiscounts();
    }
  });
  //Fix for updated installations to get domainfilter varible set
  chrome.storage.sync.get('domainfilter', function (arraylist) {
    if (arraylist.domainfilter == null) {
      chrome.storage.sync.set({ domainfilter: ["facebook.com", "google.com"] });
    }
  });
});

chrome.runtime.onStartup.addListener(function () {
  //Runs at startup
  chrome.storage.local.set({ 'rabat_closed': "" }, function () {
    debuglog("Varible rabat_closed was cleared");
  });
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
      //Only store a fixed amount of data, and delete first and last if more data is needed
      if (Object.keys(matchHolder).length > 10) {
        let lastObject = Object.keys(matchHolder)[10]
        delete matchHolder[lastObject]
        let firstObject = Object.keys(matchHolder)[0]
        delete matchHolder[firstObject]
      }
      console.table(matchHolder)
      matchHolder[sender.tab.id] = message.matchHolder;
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