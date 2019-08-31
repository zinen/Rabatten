# Rabatten

Rabat husker, et hurtigt klik og du kan se om du kan få rabat på siden
Start med at vælge de sider du får rabat via. Herefter ser du en poup i toppen af skærmen med info omkring rabat på de forskellige hjemmeside som du kan få rabat på.

For mere info, klik på ikonet øverst i højre hjørne når en blå indikator viser at der er rabat på siden.

[Available in the chrome webshop](https://chrome.google.com/webstore/detail/rabatten/ekaaoiehoehhfffifhgclflhjjkppdnc/).

## How the extension works

### Options page
In the options page, you define which services you want to see your discounts from. And you can specify filters on domains you don’t want to see the discount banner on.
Options are saved in chrome synchronized storage and thus made available to you'r other installations. 
*This requires a google account being logged in to chrome else options are only saved localy.*

### Background page
The background page is activated when new options are saved or new start of the browser. Once triggered, it will download the database with discounts for the services chosen on options page. 

The background page also enables the content script to send data to popup page.

### Content script
The content script will fire on each site you visit, looking for a match between the site and your activated services. It is fired only at `document_end` meaning it will be the lasts priority to load on each site. Once a match is found the match is made visible to the user via a top banner on the sites content. The data of the match is also shared with background page, to be used later for the popup page.

### Popup page
The popup page starts by asking the background if a match is stored for the current active tab. If a match is returned it will populate the popup page with found match or matches if multiple is found.
