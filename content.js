//const debug = chrome.extension.getBackgroundPage().debug;
const debug = true;

function debuglog(string){
  if (debug){
    console.log(string);
  }
}

debuglog("Content: script is running!");
let tabdomainname = document.location.href.replace(/^\w+:?\/\/w?w?w?\.?([^\/]+)\/?.*$/,'$1').split(".").slice(-2).join(".");
debuglog("Content: domain name: "+tabdomainname)


//Get last URL the close button was click on, and store it
let ignoredomain
try {
  chrome.storage.local.get(['rabat_closed'], function(result) {
    ignoredomain = result.rabat_closed;
    debuglog("Content: Ignore domain: " + ignoredomain);
  });
}catch(eer) {
  //
}

let matchtable;
chrome.storage.sync.get('memberships', function(items) {
  
  //Loop through all memberships
  for (i=0; i<items.memberships.length; i++) {
    if (items.memberships[i]=="logbuy"){
      debuglog("Content: Logbuy activated");
      for(let item of array_logbuy){
        if (item[0]==tabdomainname){
          debuglog("Content: Logbuy match found: "+tabdomainname);
          matchtable = item;
          matchtable.push('logbuy');
          break;
        }
      }
    }else if (items.memberships[i]=="forbrugsforeningen" && !matchtable) {
      debuglog("Content: Forbrugsforeningen activated")
      

      for(let item of array_forbrugsforeningen){
        if (item[0]==tabdomainname){
          debuglog("Content: Forbrugsforeningen match found: "+tabdomainname);
          matchtable = item;
          matchtable.push('forbrugsforeningen');
          break;
        }
      }
    }
  }
  

  if (matchtable){
    debuglog("Content: matchtable approved");
    //let shop = matchtable[1]
    //let discount = matchtable[2]
    //let link = '//' + matchtable[3]
    //let service = matchtable[4]
    //Notify the background script of a match
    chrome.runtime.sendMessage({rabatmatch: true});

    if (tabdomainname != ignoredomain){
      let newdiv = document.createElement("div");
      newdiv.style = "all: initial;display:block;height:30px";
      
      newdiv.innerHTML = 
          '<div id="aso12909" style="width:100%;top:0px;padding-right:10px;padding-left:10px;background-color:rgba(180, 180, 180,0.9);position: fixed;box-shadow: 0 2px 6px #3C4A54;z-index:9999999;">\n'+
          '<font style="color:black!important;font-size:150%;font-family:verdana;">'+
          '<img src="' + chrome.runtime.getURL('icon48.png') + '" alt="" style="margin-left:0px; margin-top:0px; width:30px; height:30px; vertical-align:sub;display:inline-block" />'+
          'Rabat: ' + matchtable[1] + ' har '+ matchtable[2] + ' igennem ' + matchtable[4] +'  <a href=" //' + matchtable[3] + '">[<font style="color:blue!important;">link</font>]</a>'+
          '         <button id="aso12910" style="color:red!important;font-size:20px;font-family:verdana;height: 30px;">Close[x]</button>'+
          '</font>\n'+
          '</div>\n'
          //console.log("icon: " + chrome.runtime.getURL('icon48.png'));
      //Append div as the first child of body
      document.body.insertBefore(newdiv, document.body.firstChild);
      //chrome.browserAction.setBadgeText({ text: "!", tabId: tab[0].id})
      //Make close button function
      let elem = document.getElementById("aso12910")
      elem.addEventListener("click", function(){
        elem.parentNode.parentNode.parentNode.remove()
        //chrome.tabs.onUpdated.addListener(function callback)
        //chrome.cookies.set(object details, function callback)

        chrome.storage.local.set({'rabat_closed': tabdomainname}, function() {
          debuglog('Content: Close button domain name: ' + tabdomainname);
        });
      });
    };
  }
});

debuglog("Content: script end.");

//Part of code:
// https://thoughtbot.com/blog/how-to-make-a-chrome-extension
