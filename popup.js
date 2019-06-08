const debug = true;

function debuglog(input){
  if (debug){
    console.log('Popup: log end');
  }
}
debuglog('Popup: scrip is running!');


document.addEventListener('DOMContentLoaded', function() {
  debuglog('Popup: DOM fully loaded and parsed');
  chrome.tabs.query({active: true,lastFocusedWindow: true}, function(tab) {
  //chrome.tabs.getSelected(null, function(tab) {
    let thissite = document.getElementById('thissite');
    let thisdiscount = document.getElementById('thisdiscount');

    //debuglog("Popup: full URL: "+tab[0].url)
    debuglog(tab[0])


    let tabdomainname=tab[0].url.replace(/^\w+:?\/\/w?w?w?\.?([^\/]+)\/?.*$/,'$1').split(".").slice(-2).join(".");

    debuglog("Popup: domain name: "+tabdomainname)
    
    let matchtable;

    chrome.storage.sync.get('memberships', function(items) {
      for (i=0; i<items.memberships.length; i++) {
        if (items.memberships[i]=="logbuy"){
          debuglog("Popup: Logbuy activated");
          for(let item of array_logbuy){
            if (item[0]==tabdomainname){
              debuglog("Popup: Logbuy match found: "+tabdomainname);
              matchtable = item;
              break;
            }
          }
        }else if (items.memberships[i]=="forbrugsforeningen" && !matchtable) {
          debuglog("Popup: Forbrugsforeningen activated")
          for(let item of array_forbrugsforeningen){
            if (item[0]==tabdomainname){
              debuglog("Popup: Forbrugsforeningen match found: "+tabdomainname);
              matchtable = item;
              break;
            }
          }
        }
      }

      if (matchtable){
        //debuglog("Match: "+matchtable[0])
        chrome.browserAction.setBadgeText({ text: "!", tabId: tab[0].id})
        //chrome.browserAction.setIcon({path: tab[0].favIconUrl , tabId: tab[0].id})
        thissite.innerHTML = matchtable[1]
        thisdiscount.innerHTML = matchtable[2];
        let newA = document.createElement("h3");
        let link = 'http://' + matchtable[3]
        newA.innerHTML = '<a href="' + link + '">[link]</a>'
        thisdiscount.append(newA);

      }else{
        chrome.browserAction.setBadgeText({ text: "" , tabId: tab[0].id})
        thissite.innerHTML = "No match on this site";
        thisdiscount.innerHTML = "Please report if this is wrong";
      }
    });
  });
}, false);
debuglog('Popup: scrip end.');
//Part of code from here:
//https://www.sitepoint.com/create-chrome-extension-10-minutes-flat/
