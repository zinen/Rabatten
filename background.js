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
    if (Object.keys(matchtabels).length > 6) {
      let firstObject = Object.keys(matchtabels)[0]
      delete matchtabels[firstObject]
    }
    //matchtabels[sender.tab.id] = message.matchtable;
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
var textHolder = []

for (let service in DiscountServices) {
  getDiscounts(service)
}


function getDiscounts2(inService) {
  let request = new XMLHttpRequest();
  request.onload = setDiscounts2;
  request.open("get", DiscountServices[inService][0].databaseURL, true);
  request.send();
  //debuglog("Yo!")
}

function setDiscounts2() {
  //debuglog("Yiha!")
  if (this.status == 200) {
    //replace singel quotes with double quotes
    let text = this.responseText.replace(/'/g, "\"")
    text = JSON.parse(text)
    console.log(text)
    textHolder.push(text)

  }
  if (textHolder.length==2){
    let matchMatch = [];
    console.log(textHolder)
    for(item1 of textHolder[0]){
      for(item2 of textHolder[1]){
        console.log(item2[0]+"="+item1[0])
        if( item1[0] == item2[0])
        matchMatch.push(item2[0])
      }

    }
    if (matchMatch.length>0){
      console.log("Multible set found")
      console.log(matchMatch)
    }else{
      console.log("Not match-match")
    }

  }
}



debuglog('Background: scrip end.');