const debug = true;

function debuglog(string){
  if (debug){
    console.log(string);
  }
}
debuglog('Background: scrip is running!');
chrome.runtime.onInstalled.addListener(function() {
  let optionsUrl = chrome.extension.getURL("/options.html");
  chrome.storage.sync.get('memberships', function(items) {
    if (items.memberships == null) {
      //Open settings tab, at first run if no values from sync storage is found
      debuglog("Open settings tab for the first time.");
      //Create empty sync varible
      chrome.storage.sync.set({memberships: []});
      //Open settings tab
      chrome.tabs.create({url: optionsUrl });

    }
  });

});

chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.set({'rabat_closed': ""}, function() {
    debuglog("Backgroubd: rabat_closed was cleared");
    
  });
});

chrome.browserAction.onClicked.addListener(function(tab) {
  debuglog("Background: button clicked");
  //chrome.browserAction.setPopup({popup: "popup.html"});
  //chrome.browserAction.getPopup({tabId: tab.id}, function(result) {
  //  debuglog("Start browser action? "+result);
  //})
});
//var msg;

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse) {
  if(message.rabatmatch==true){
    debuglog("Badge text set!");
    chrome.browserAction.setBadgeText({ text: "!" , tabId: sender.tab.id});
  }else{
    //Debug any unkown incoming messages
    debuglog("1 of 3 - Debug message")
    debuglog(message)
    debuglog("2 of 3 - Debug sender:")
    debuglog(sender)
    debuglog("3 of 3 - Debug sendResponse:")
    debuglog(sendResponse)
  }
});

//chrome.browserAction.disable();
//debuglog(chrome)
//Parts from here:
//https://developer.chrome.com/extensions/getstarted
debuglog('Background: scrip end.');