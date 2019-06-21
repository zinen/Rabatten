debuglog('Background: scrip is running!');
var matchtabels = new Object(); //Holder varible for matched pages

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
    if (Object.keys(matchtabels).length > 10) {
      let firstObject = Object.keys(matchtabels)[0]
      delete matchtabels[firstObject]
    }
    matchtabels[sender.tab.id] = message.matchHolder;
  } else if (message.getmatch) {
    //Used to send message to popup of known matches on the page
    sendResponse(matchtabels[message.tab]);
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
  //Initiales download for all active discount services.
  //Anohter function handels the incoming result async
  chrome.storage.sync.get('memberships', function (items) {
    let servicses = items.memberships || [];
    for (let service of servicses) {
      let request = new XMLHttpRequest();
      request.onload = setDiscounts;
      request.open("get", DiscountServices[service][0].databaseURL, true);
      request.send();
    }
  });
}

function setDiscounts() {
  //Parse incoming data, and fix known errors
  //Save the data to a chrome local storage 
  if (this.status == 200) {
    //Loop though all services
    for (let service in DiscountServices) {
      //Look for URL of each service and match it with the received data
      if (this.responseURL.endsWith(DiscountServices[service][0].databaseURL)) {
        let arrayName = DiscountServices[service][0].arrayName
        let text = this.responseText
        try {
          text = JSON.parse(text)
        }
        catch (err1) {
          debuglog(service +" fix error 1")
          if (err1.toString().includes("Unexpected token '")) {
            //replace singel quotes with double quotes
            text = text.replace(/'/g, "\"")
            try {
              text = JSON.parse(text)
            }
            catch (err2) {
              debuglog(service +" fix error 2")
              if (err2.toString().includes("Unexpected token ;")) {
                //removes semicolons
                text = text.replace(/;/g, "")
                text = JSON.parse(text)
              } else {
                console.error(err2)
                break
              }
            }
          } else {
            console.error(err1)
            break
          }
        }
        chrome.storage.local.set({ [arrayName]: text }, function () {
          debuglog("Detected " + service + " to updated")
        });
        break;
      }
    }
  }
}

debuglog('Background: scrip end.');