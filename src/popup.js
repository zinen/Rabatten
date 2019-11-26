/* global debuglog, chrome */
debuglog('Popup: scrip is running!')

// Listens for the corrent tab to puplish data to
document.addEventListener('DOMContentLoaded', function () {
  debuglog('DOM fully loaded and parsed')
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
    if (tab === null) { return }
    chrome.storage.local.get('matchHolder', function (content) {
      // Get data, of any from local storage
      const matchtable = content.matchHolder ? content.matchHolder[tab[0].id] : null
      fillPopup(matchtable)
    })
  })
}, false)

// Desides how to fill the popup with content
// content - Optional: Array of 1-4 string elemnts
function fillPopup (content = null) {
  debuglog('Populates popup now')
  if (Array.isArray(content)) {
    for (const item of content) {
      popuplatePopup(item[1], item[2], item[3], item[4])
    }
  } else {
    popuplatePopup('No match on this site', 'Please report if this is wrong')
  }
}

// Generates elements for the each popop item
// inTitel - String used as headline of item.
// inSubtitel - String used as subtitel of item
// inLink - Opttional: String used to make the item info a link html object
// inBadge - Opttional: String used as make a badge on the item
function popuplatePopup (inTitel, inSubtitel, inLink = null, inBadge = null) {
  const matchlist = document.getElementById('match-list')
  const newEntry = document.createElement('li')
  matchlist.appendChild(newEntry)
  const title = document.createElement('p')
  title.classList.add('title2')
  title.innerText = inTitel
  newEntry.appendChild(title)
  const badge = makeBadge(inBadge)
  if (badge) { newEntry.appendChild(badge) }
  const content = document.createElement('p')
  content.classList.add('title3')
  content.innerText = inSubtitel
  newEntry.appendChild(content)
  if (inLink) { makeLink([title, badge, content], newEntry, inLink) }
}

// Generates html content for the badge
// text - String used as label inside badge
function makeBadge (text) {
  // Make a badge element, with input as its text
  if (!text) { return }
  const badge = document.createElement('span')
  badge.classList.add('badge')
  badge.classList.add('right')
  badge.innerText = text
  return badge
}

// Transform popup item into a link. Must move all items inside a new <a> element
// children - Array of html objects
// newEntry - HTML object for the opup item
// inLink - String to use as the actual link
function makeLink (children, newEntry, inLink) {
  // Transforms list obejct to a link
  const newA = document.createElement('a')
  // Append all underlying elements to new link object
  for (const child of children) {
    if (child) { newA.appendChild(child) }
  }
  newEntry.appendChild(newA)
  newA.classList.add('nounderline')
  newA.setAttribute('href', 'https://' + inLink)
  newA.setAttribute('title', 'Open link')
  newEntry.classList.add('is-link')
  // Add lister to redirect tab page on click in popup window
  newEntry.addEventListener('mouseup', function (e) {
    // Only update url if left mouse button is pressed. This means that middel click
    // will open the url in a new tab, and not do a url update on the current tab
    if (e.which === 1) {
      chrome.tabs.update({ url: 'https://' + inLink })
    }
  })
}

debuglog('Popup: scrip end.')
