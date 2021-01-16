console.log('Popup: script is running!')

/**
 * Listens for the current tab to publish data to.
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM fully loaded and parsed')
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
    if (tab === null) { return }
    chrome.storage.local.get('matchHolder', function (content) {
      // Get data, of any from local storage
      const matchTable = content.matchHolder ? content.matchHolder[tab[0].id] : null
      fillPopup(matchTable)
    })
  })
}, false)

/**
 * Decides how to fill the popup with content.
 * @param {Array} [content=null] Array of 4 string elements.
 */
function fillPopup (content = null) {
  console.log('Populates popup now')
  if (Array.isArray(content)) {
    for (const item of content) {
      populatePopup(item[1], item[2], item[3], item[4])
    }
  } else {
    populatePopup('Ingen match på denne side', 'Reporter gerne hvis det er forkert')
  }
}

/**
 * Generates elements for the each popup item.
 * @param {String} inTitle - String used as headline of item.
 * @param {String} inSubtitle - String used as subtitle of item.
 * @param {String} [inLink=null] - String used to make the item info a link html object.
 * @param {String} [inBadge=null] - String used as make a badge on the item.
*/
function populatePopup (inTitle, inSubtitle, inLink = null, inBadge = null) {
  const matchList = document.getElementById('match-list')
  const newEntry = document.createElement('li')
  matchList.appendChild(newEntry)
  const title = document.createElement('p')
  title.classList.add('listTitle')
  title.innerText = inTitle
  newEntry.appendChild(title)
  const badge = makeBadge(inBadge)
  if (badge) { newEntry.appendChild(badge) }
  const content = document.createElement('p')
  content.classList.add('listSubtitle')
  content.innerText = inSubtitle
  newEntry.appendChild(content)
  if (inLink) { makeLink([title, badge, content], newEntry, inLink) }
}

/**
 * Generates html content for the badge.
 * @param {String} text - String used as label inside badge.
 * @returns {object} - HTML object for the badge
 */
function makeBadge (text) {
  // Make a badge element, with input as its text
  if (!text) { return }
  const badge = document.createElement('span')
  badge.classList.add('badge')
  badge.classList.add('right')
  badge.innerText = text
  return badge
}

/**
 * Transform popup item into a link. Must move all items inside a new <a> element
 * @param {Array} children - Array of html objects to move.
 * @param {Object} newEntry - HTML object for the popup item.
 * @param {String} inLink - String to use as the actual link.
 */
function makeLink (children, newEntry, inLink) {
  // Transforms list object to a link
  const newA = document.createElement('a')
  // Append all underlying elements to new link object
  for (const child of children) {
    if (child) { newA.appendChild(child) }
  }
  newEntry.appendChild(newA)
  newA.classList.add('nounderline')
  newA.setAttribute('href', inLink)
  newA.setAttribute('listTitle', 'Open link')
  newEntry.classList.add('is-link')
  // Add lister to redirect tab page on click in popup window
  newEntry.addEventListener('mouseup', function (e) {
    // Only update url if left mouse button is pressed. This means that middle click
    // will open the url in a new tab, and not do a url update on the current tab
    if (e.which === 1) {
      chrome.tabs.update({ url: inLink })
    }
  })
}

console.log('Popup: script end.')
