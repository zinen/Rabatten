debuglog('Popup: scrip is running!');

document.addEventListener('DOMContentLoaded', function () {
  debuglog('DOM fully loaded and parsed');
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
    chrome.storage.local.get("matchHolder", function (content) {
      //Get data, of any from local storage
      let matchtable = content.matchHolder[tab[0].id]
      fillPopup(matchtable)
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
  document.body.appendChild(h2);
  let h3 = document.createElement("h3")
  h3.innerHTML = discount + ' <a href="http://' + link + '">[link]</a>'
  h2.append(h3);
  //Add lister to redirect tab page on click in popup window
  h3.getElementsByTagName("a")[0].addEventListener("mouseup", function (e) {
    //Only update url if left mouse button was pressed. This means that middel click
    // will open the url in a new tab if wanted, and not do the url update
    if (e.which == 1) {
      chrome.tabs.update({ url: "http://" + link });
    }
  });
}

function fillPopup(content) {
  debuglog("Populates popup now")
  if (Array.isArray(content)) {
    for (let item of content) {
      //popuplatePopup(item.shop, item.discount, item.link);
      popuplatePopup(item[1], item[2], item[3]);
    }
  } else {
    popuplatePopup("No match on this site", "Please report if this is wrong", "github.com/zinen/Rabatten/issues");
  }
}

debuglog('Popup: scrip end.');