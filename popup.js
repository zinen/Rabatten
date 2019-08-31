debuglog('Popup: scrip is running!');

document.addEventListener('DOMContentLoaded', function () {
  debuglog('DOM fully loaded and parsed');
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
    chrome.storage.local.get("matchHolder", function (content) {
      //Get data, of any from local storage
      let matchtable = content.matchHolder[tab[0].id] || null
      fillPopup(matchtable)
    });
  });
}, false);

function popuplatePopup(shop, discount, discountlink, service) {
  let section1 = document.getElementById('section1')
  // Element are already populated, then create a line object
  // if (section1.length > 0) {
  //   section1.appendChild(document.createElement("hr"));
  // }
  let newEntry = document.createElement('div')
  //newEntry.setAttribute('class', 'list-entry')
  newEntry.classList.add('list-entry');
  section1.appendChild(newEntry);
  let titel = document.createElement('h2')
  titel.innerText = shop;
  newEntry.appendChild(titel);
  if(service){
    // let hovertext = `Rabat igennem ${service}`
    // newEntry.setAttribute('title',hovertext)
    let info = document.createElement('span')
    info.classList.add('tag');
    info.classList.add('right');
    info.innerHTML = service
    newEntry.appendChild(info);
  }
  let content = document.createElement('h3')
  content.innerHTML = discount
  newEntry.append(content);
  if (discountlink) {
    content.innerHTML += ' <a href="http://' + discountlink + '">[link]</a>'
    newEntry.classList.add('is-link');
    //Add lister to redirect tab page on click in popup window
    newEntry.addEventListener("mouseup", function (e) {
      //Only update url if left mouse button was pressed. This means that middel click
      // will open the url in a new tab if wanted, and not do the url update
      console.log(e.which)
      if (e.which == 1) {
        chrome.tabs.update({ url: "http://" + discountlink });
      }
      // }else if (e.which == 2) {
      //   chrome.tabs.create({url: "http://" + discountlink })
      //   chrome.tabs.
      // }
    });
  }

}

function fillPopup(content) {
  debuglog("Populates popup now")
  if (Array.isArray(content)) {
    for (let item of content) {
      console.log(item)
      //popuplatePopup(item.shop, item.discount, item.link);
      popuplatePopup(item[1], item[2], item[3], item[4]);
    }
  } else {
    popuplatePopup("No match on this site", "Please report if this is wrong");
  }
}

// function addSettingLink(){
//   let element = document.getElementById('header-menu')
//   let linkelm = document.createElement('a')
//   let optionsUrl = chrome.extension.getURL("/options.html");
//   linkelm.setAttribute('href',optionsUrl)
//   //linkelm.innerText('settings')
  
//   linkelm.appendChild(document.createTextNode("settings"))
//   console.log(element)
//   console.log(linkelm)
//   element.appendChild(linkelm)
  
// }
// addSettingLink()

debuglog('Popup: scrip end.');