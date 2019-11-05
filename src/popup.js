/* global debuglog, chrome */
debuglog('Popup: scrip is running!')

document.addEventListener('DOMContentLoaded', function () {
  debuglog('DOM fully loaded and parsed')
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
    if (tab === null) { return };
    chrome.storage.local.get('matchHolder', function (content) {
      // Get data, of any from local storage
      const matchtable = content.matchHolder[tab[0].id] || null
      fillPopup(matchtable)
    })
  })
}, false)

function popuplatePopup (shop, discount, discountlink, service) {
  const matchlist = document.getElementById('match-list')
  const newEntry = document.createElement('li')
  matchlist.appendChild(newEntry)
  const title = document.createElement('p')
  title.classList.add('title2')
  title.innerText = shop
  newEntry.appendChild(title)
  let badge
  if (service) {
    badge = document.createElement('span')
    badge.classList.add('badge')
    badge.classList.add('right')
    badge.innerText = service
    newEntry.appendChild(badge)
  }
  const content = document.createElement('p')
  content.classList.add('title3')
  content.innerText = discount
  newEntry.appendChild(content)
  if (discountlink) {
    const newA = document.createElement('a')
    newA.classList.add('nounderline')
    newA.appendChild(title)
    if (badge) { newA.appendChild(badge) }
    newA.appendChild(content)
    newEntry.appendChild(newA)
    newA.setAttribute('href', 'https://' + discountlink)
    newA.setAttribute('title', 'Open link')
    newEntry.classList.add('is-link')
    // Add lister to redirect tab page on click in popup window
    newEntry.addEventListener('mouseup', function (e) {
      // Only update url if left mouse button is pressed. This means that middel click
      // will open the url in a new tab, and do a url update
      if (e.which === 1) {
        chrome.tabs.update({ url: 'https://' + discountlink })
      }
    })
  }
}

function fillPopup (content) {
  debuglog('Populates popup now')
  if (Array.isArray(content)) {
    for (const item of content) {
      popuplatePopup(item[1], item[2], item[3], item[4])
    }
  } else {
    popuplatePopup('No match on this site', 'Please report if this is wrong')
  }
}

debuglog('Popup: scrip end.')
