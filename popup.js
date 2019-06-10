debuglog('Popup: scrip is running!');
var matchtable;
var tabdomainname
var currentTab

document.addEventListener('DOMContentLoaded', function () {
  debuglog('DOM fully loaded and parsed');
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
    chrome.runtime.sendMessage({ getmatch: true, tab: tab[0].id }, function (response) {
      matchtable = response
      debuglog("Received matchtable:")
      debuglog(matchtable);
      fillPopup()
    });
  });
}, false);

function popuplatePopup(shop, discount, link) {
  let elements = document.body.getElementsByTagName("h2")
  // Element are already populated, then create a line object
  if (elements.length > 0) {
    document.body.appendChild(document.createElement("hr"));
  }
  let h2 = document.createElement("h2")
  h2.innerText = shop;
  let h3 = document.createElement("h3")
  h3.innerHTML = discount + ' <a href="http://' + link + '">[link]</a>'
  h2.append(h3);
  document.body.appendChild(h2);
  //Add lister to redirect tab page on click in popup window
  h3.getElementsByTagName("a")[0].addEventListener("mouseup", function () {
    chrome.tabs.update({ url: "http://" + link });
  });
}

function fillPopup() {
  debuglog("Populates popup now")
  if (matchtable) {
    for (let item of matchtable) {
      //popuplatePopup(item.shop, item.discount, item.link);
      popuplatePopup(item[1], item[2], item[3]);
    }
  } else {
    popuplatePopup("No match on this site", "Please report if this is wrong", "report.com");
  }
}

debuglog('Popup: scrip end.');