import { DiscountServices } from './common.js'
console.log('Content: script is running!')
let ignoreDomain

let tabDomainName = document.domain.split('.')
if (tabDomainName[tabDomainName.length - 1] === 'uk') {
  // Fix for uk domains, cant handel domain suffixes with only ".uk" but will handle domains like ".co.uk"
  tabDomainName = tabDomainName.slice(-3).join('.')
} else {
  tabDomainName = tabDomainName.slice(-2).join('.')
}

console.log('Content: domain name: ' + tabDomainName)

/**
 * Get last URL, from which the top pane was closed on, and store it.
 */
try {
  chrome.storage.local.get('rabat_closed', function (result) {
    chrome.storage.sync.get('domainfilter', function (arrayList) {
      ignoreDomain = arrayList.domainfilter || []
      ignoreDomain.push(result.rabat_closed)
      console.log('Content: Ignore domain: ' + ignoreDomain)
    })
  })
} catch (err) {
  console.error(err)
}

/**
 * Initiate the loop of the chosen services.
 */
chrome.storage.sync.get('memberships', function (membershipsArray) {
  const promises = []
  // Loop memberships and note them in a promise
  for (const membership of membershipsArray.memberships || []) {
    promises.push(new Promise(resolve => {
      setTimeout(resolve, 2000)
      const arrayName = DiscountServices[membership].arrayName
      chrome.storage.local.get(arrayName, function (list) {
        const holder = []
        for (const item of list[arrayName]) {
          if (item[0] === tabDomainName) {
            // Add name of service to record to be used as info in top pane
            item.push(DiscountServices[membership].name)
            holder.push(item)
          }
        }
        resolve(holder)
      })
    }))
  }
  Promise.all(promises).then(function (matches) {
    // Flatten returned array from promises
    matches = matches.reduce((flatten, arr) => [...flatten, ...arr], [])
    if (matches.length > 0) {
      // Notify the service_worker script of a match
      chrome.runtime.sendMessage({ rabatMatch: true, matchHolder: matches })
      handelMatches(matches)
    }
  }, function (err) {
    console.error(err)
  })
})

/**
 * Loops the matches for how to show the resulting match or matches.
 * @param {Array} matchHolder - Array with arrays holding the matches.
 */
function handelMatches (matchHolder) {
  if (!ignoreDomain.includes(tabDomainName)) {
    console.log('Content: match holder info used', matchHolder)
    let text
    if (matchHolder.length > 1) {
      text = tabDomainName + ' har flere tilbud igennem ' + matchHolder[0][4]
      // Look if more then one service has discount on the page
      for (let i = 0; i < matchHolder.length - 1; i++) {
        if (matchHolder[i][4] !== matchHolder[i + 1][4]) {
          text = tabDomainName + ' har tilbud igennem flere udbydere'
          break
        }
      }
    } else {
      const shop = matchHolder[0][1]
      const discount = matchHolder[0][2]
      const link = matchHolder[0][3] // Link for popup
      const service = '<a href="' + link + '"><font style="">' + matchHolder[0][4] + '</font></a>'
      text = shop + ' har ' + discount + ' igennem ' + service
    }
    makeTopPane(text)
  }
}

/**
 * Generates the content for the top pane.
 * @param {String} text - String with HTML code in raw text
 */
function makeTopPane (text) {
  const newDiv = document.createElement('div')
  newDiv.style = 'all:initial'
  newDiv.innerHTML =
    '<div id="aso12909" style="width:100%;padding-right:10px;padding-left:10px;background-color:rgba(244,230,155,0.8);position: fixed;box-shadow: 0 2px 6px #3C4A54;z-index:9999999;left:0;top:0;">\n' +
    '<font style="font-size:20px;font-family:Arial;">' +
    '<img src="' + chrome.runtime.getURL('icon48.png') + '" alt="" style="margin-left:0px; margin-top:0px; margin-right:4px; width:28px; height:28px; vertical-align:sub;display:inline-block" />' +
    text + '<button id="aso12910" style="font-size:20px;font-family:verdana;height: 28px;float: right;margin-right: 12px;border: none;background: none;cursor: pointer;" title="Skjul rabat">X</button>' +
    '</font>\n' +
    '</div>\n'
  // Append div as the first child of body
  const shadowDiv = document.createElement('div')
  document.body.insertBefore(shadowDiv, document.body.firstChild)
  const shadow = shadowDiv.attachShadow({ mode: 'open' })
  shadow.appendChild(newDiv)
  // Make close button function
  const elem = shadow.getElementById('aso12910')
  elem.addEventListener('click', function () {
    elem.parentNode.parentNode.parentNode.remove()
    chrome.storage.local.set({ rabat_closed: tabDomainName }, function () {
      console.log('Content: Close button domain name: ' + tabDomainName)
    })
  })
}

console.log('Content: script end.')
