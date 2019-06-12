debuglog('Background: scrip is running!');
var matchtabels = new Object();

chrome.runtime.onInstalled.addListener(function () {
  let optionsUrl = chrome.extension.getURL("/options.html");
  chrome.storage.sync.get('memberships', function (items) {
    if (items.memberships == null) {
      //Open settings tab, at first run if no values from sync storage is found
      debuglog("Open settings tab for the first time.");
      //Create empty sync varible
      chrome.storage.sync.set({ memberships: [] });
      //Open settings tab
      chrome.tabs.create({ url: optionsUrl });
    }
  });
});

chrome.runtime.onStartup.addListener(function () {
  chrome.storage.local.set({ 'rabat_closed': "" }, function () {
    debuglog("Varible rabat_closed was cleared");
  });
  //Get updated files here:
  for (let service in DiscountServices) {
    getDiscounts(service)
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.matchHolder) {
    //Used to receive message from content
    debuglog("Badge text set!");
    chrome.browserAction.setBadgeText({ text: "!", tabId: sender.tab.id });
    if (Object.keys(matchtabels).length > 10) {
      let firstObject = Object.keys(matchtabels)[0]
      delete matchtabels[firstObject]
    }
    matchtabels[sender.tab.id] = message.matchHolder;

  } else if (message.getmatch) {
    //Used to send message to popup
    sendResponse(matchtabels[message.tab]);
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

function getDiscounts(inService) {
  let request = new XMLHttpRequest();
  request.onload = setDiscounts;
  request.open("get", DiscountServices[inService][0].databaseURL, true);
  request.send();
}

function setDiscounts() {
  if (this.status == 200) {
    //replace singel quotes with double quotes
    let text = this.responseText.replace(/'/g, "\"")
    for (let service in DiscountServices) {
      if (this.responseURL.endsWith(DiscountServices[service][0].databaseURL)) {
        let arrayName = DiscountServices[service][0].arrayName
        text = JSON.parse(text)
        chrome.storage.local.set({ [arrayName]: text }, function () {
          debuglog("Detected " + service + " to updated")
        });
        break;
      }
    }
  }
}

debuglog('Background: scrip end.');