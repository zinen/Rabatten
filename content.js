debuglog("Content: script is running!");
let ignoredomain

let tabdomainname = document.domain.split(".").slice(-2).join(".");

debuglog("Content: domain name: " + tabdomainname)

//Get last URL, from which this discount banner was closed on, and store it
try {
  chrome.storage.local.get('rabat_closed', function (result) {
    ignoredomain = [result.rabat_closed, "facebook.com", "google.com"];
    debuglog("Content: Ignore domain: " + ignoredomain);
  });
} catch (eer) {
  console.error(err)
}

chrome.storage.sync.get('memberships', function (membershipsarray) {
  const promises = []
  //Loop membership and note them in a promise
  for (let membership of membershipsarray.memberships) {
    promises.push(new Promise(resolve => {
      setTimeout(resolve, 2000)
      let arrayName = DiscountServices[membership][0].arrayName
      chrome.storage.local.get([arrayName], function (list) {
        const holder = Array()
        for (let item of list[[arrayName]]) {
          if (item[0] == tabdomainname) {
            item.push(membership)
            holder.push(item)
          }
        }
        resolve(holder)
      })
    }))
  }
  Promise.all(promises).then(function (matches) {
    //Flatten returned array from promises
    matches = matches.reduce((flatten, arr) => [...flatten, ...arr])
    if (matches.length > 0) {
      //Notify the background script of a match
      chrome.runtime.sendMessage({ rabatmatch: true, matchHolder: matches });
      makeTopPane(matches);
    }
  }, function (err) {
    console.error(err);
  })
});

function makeTopPane(matchHolder) {
  if (!ignoredomain.includes(tabdomainname)) {
    debuglog("Content: matchholder info used");
    let shop, discount, link, service
    if (matchHolder.length > 1) {
      shop = "Flere"
      discount = "tilbud"
      //Look if more then one service has discount on the page
      for (i = 0; i < matchHolder.length - 1; i++) {
        if (matchHolder[i][4] != matchHolder[i + 1][4]) {
          service = "flere udbydere"
          break;
        } else {
          service = matchHolder[i][4]
        }
      }
    } else {
      shop = matchHolder[0][1]
      discount = matchHolder[0][2]
      link = matchHolder[0][3] //Link for popup
      service = matchHolder[0][4] //Matching servoce
    }
    let newdiv = document.createElement("div");
    newdiv.style = "all: initial;display:block;height:30px";
    newdiv.innerHTML =
      '<div id="aso12909" style="width:100%;top:0px;padding-right:10px;padding-left:10px;background-color:rgba(180, 180, 180,0.9);position: fixed;box-shadow: 0 2px 6px #3C4A54;z-index:9999999;">\n' +
      '<font style="color:black!important;font-size:150%;font-family:verdana;">' +
      '<img src="' + chrome.runtime.getURL('icon48.png') + '" alt="" style="margin-left:0px; margin-top:0px; width:30px; height:30px; vertical-align:sub;display:inline-block" />' +
      'Rabat: ' + shop + ' har ' + discount + ' igennem ' + service + '  <a href=" //' + link + '">[<font style="color:blue!important;">link</font>]</a>' +
      '         <button id="aso12910" style="color:red!important;font-size:20px;font-family:verdana;height: 30px;">Close[x]</button>' +
      '</font>\n' +
      '</div>\n'
    if (matchHolder.length > 1) {
      //Delete link in the new dir, if multible discounts found
      newdiv.getElementsByTagName("a")[0].remove()
    }
    //Append div as the first child of body
    document.body.insertBefore(newdiv, document.body.firstChild);
    //Make close button function
    let elem = document.getElementById("aso12910")
    elem.addEventListener("click", function () {
      elem.parentNode.parentNode.parentNode.remove()
      chrome.storage.local.set({ 'rabat_closed': tabdomainname }, function () {
        debuglog('Content: Close button domain name: ' + tabdomainname);
      });
    });
  }
}
debuglog("Content: script end.");