/* global debuglog, chrome, DiscountServices */
debuglog('Content: script is running!')
let ignoredomain

let tabdomainname = document.domain.split('.')
if (tabdomainname[tabdomainname.length - 1] === 'uk') {
  // Fix for uk domains, cant handel domain suffixes with only ".uk" but will handle domains like ".co.uk"
  tabdomainname = tabdomainname.slice(-3).join('.')
} else {
  tabdomainname = tabdomainname.slice(-2).join('.')
}

debuglog('Content: domain name: ' + tabdomainname)

// Get last URL, from which this discount banner was closed on, and store it
try {
  chrome.storage.local.get('rabat_closed', function (result) {
    chrome.storage.sync.get('domainfilter', function (arraylist) {
      ignoredomain = arraylist.domainfilter || []
      ignoredomain.push(result.rabat_closed)
      debuglog('Content: Ignore domain: ' + ignoredomain)
    })
  })
} catch (err) {
  console.error(err)
}

chrome.storage.sync.get('memberships', function (membershipsarray) {
  const promises = []
  // Loop membership and note them in a promise
  for (const membership of membershipsarray.memberships || []) {
    promises.push(new Promise(resolve => {
      setTimeout(resolve, 2000)
      const arrayName = DiscountServices[membership][0].arrayName
      chrome.storage.local.get([arrayName], function (list) {
        const holder = []
        for (const item of list[[arrayName]]) {
          if (item[0] === tabdomainname) {
            item.push(membership)
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
      // Notify the background script of a match
      chrome.runtime.sendMessage({ rabatmatch: true, matchHolder: matches })
      makeTopPane(matches)
    }
  }, function (err) {
    console.error(err)
  })
})

function makeTopPane (matchHolder) {
  if (!ignoredomain.includes(tabdomainname)) {
    debuglog('Content: matchholder info used')
    let text
    if (matchHolder.length > 1) {
      text = tabdomainname + ' har flere tilbud igennem ' + matchHolder[0][4]
      // Look if more then one service has discount on the page
      for (let i = 0; i < matchHolder.length - 1; i++) {
        if (matchHolder[i][4] !== matchHolder[i + 1][4]) {
          text = tabdomainname + ' har tilbud igennem flere udbydere'
          break
        }
      }
    } else {
      const shop = matchHolder[0][1]
      const discount = matchHolder[0][2]
      const link = matchHolder[0][3] // Link for popup
      const service = '<a href=" //' + link + '"><font style="">' + matchHolder[0][4] + '</font></a>'
      text = shop + ' har ' + discount + ' igennem ' + service
    }
    const newdiv = document.createElement('div')
    newdiv.style = 'all:initial;position:absolute;left:0;top:0;'
    newdiv.innerHTML =
      '<div id="aso12909" style="width:100%;padding-right:10px;padding-left:10px;background-color:rgba(244,230,155,0.8);position: fixed;box-shadow: 0 2px 6px #3C4A54;z-index:9999999;top:0px">\n' +
      '<font style="font-size:20px;font-family:Arial;">' +
      '<img src="' + chrome.runtime.getURL('icon48.png') + '" alt="" style="margin-left:0px; margin-top:0px; margin-right:4px; width:28px; height:28px; vertical-align:sub;display:inline-block" />' +
      text + '<button id="aso12910" style="font-size:20px;font-family:verdana;height: 28px;float: right;margin-right: 12px;border: none;background: none;cursor: pointer;">X</button>' +
      '</font>\n' +
      '</div>\n'
    // Append div as the first child of body
    const shadowdiv = document.createElement('div')
    document.body.insertBefore(shadowdiv, document.body.firstChild)
    const shadow = shadowdiv.attachShadow({ mode: 'open' })
    shadow.appendChild(newdiv)
    // Make close button function
    const elem = shadow.getElementById('aso12910')
    elem.addEventListener('click', function () {
      elem.parentNode.parentNode.parentNode.remove()
      chrome.storage.local.set({ rabat_closed: tabdomainname }, function () {
        debuglog('Content: Close button domain name: ' + tabdomainname)
      })
    })
  }
}
debuglog('Content: script end.')
