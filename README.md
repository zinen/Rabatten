# Rabatten - A Chromium extension

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![DeepScan grade](https://deepscan.io/api/teams/5999/projects/7865/branches/86176/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5999&pid=7865&bid=86176)
[![Maintainability](https://api.codeclimate.com/v1/badges/7f37cac1b78f385627d2/maintainability)](https://codeclimate.com/github/zinen/Rabatten/maintainability)
[![devDependencies Status](https://status.david-dm.org/gh/zinen/rabatten.svg?type=dev)](https://david-dm.org/zinen/rabatten?type=dev)
[![BCH compliance](https://bettercodehub.com/edge/badge/zinen/Rabatten?branch=master)](https://bettercodehub.com/results/zinen/Rabatten)
![Node build and test](https://github.com/zinen/Rabatten/workflows/Node%20build%20and%20test/badge.svg)

### Description (in danish)

Start med at vælge de sider du får rabat gennem. Herefter ser du en besked i toppen af hjemmesiderne med info omkring gældende rabat på netop denne hjemmeside.

For mere info, klik på ikonet øverst i højre hjørne når en blå indikator viser at der er rabat på siden.

[Available at the Chrome Web Store](https://chromewebstore.google.com/detail/rabatten/ekaaoiehoehhfffifhgclflhjjkppdnc).

[Available at Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/lmllmkiljoibjomgpofgaaccfcllebgf/).

## How the extension works

Some of the terminology require knowledge of [the workings of a browser extensions](https://developer.chrome.com/extensions).

### Options page

In the options page, you define which services you want to see your discounts from. And you can specify filters on domains you don’t want to see the discount top pane on.
Options are saved in chrome synchronized storage and thus made available to your other installations. 
*This requires a google account being logged in to chrome otherwise options are only saved localy.*

### service_worker page

The service_worker page is activated when new options are saved or when the browser starts. Once triggered, it will download the database with discounts for the services chosen on options page. The database of the discount is found [here at another git repo](https://github.com/zinen/rabatten-scraper#readme).

The service_worker page also enables the content script to send data to popup page.

### Content script

The content script will fire on each site you visit, looking for a match between the site and your activated services. It is fired only at `document_end` meaning it will be the lasts priority to load on each site. Once a match is found the match is made visible to the user via a top pane on the sites content. The data of the match is also shared with service_worker page, to be used later for the popup page.

### Popup page

The popup page starts by asking the service_worker if a match is stored for the current active tab. If a match is returned it will populate the popup page with found match or matches if multiple is found.
