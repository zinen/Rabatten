const debug = false;
function debuglog(input) {
  if (debug) {
    console.log(input);
  }
}
const DiscountServices = {
  "forbrugsforeningen": [
    {
      "arrayName": "array_forbrugsforeningen",
      "databaseURL": "https://cdn.jsdelivr.net/gh/zinen/Rabatten@latest/forbrugsforeningen.js",
      "homepage": "http://forbrugsforeningen.dk"
    },
  ], "logbuy": [
    {
      "arrayName": "array_logbuy",
      "databaseURL": "https://cdn.jsdelivr.net/gh/zinen/Rabatten@latest/logbuy.js",
      "homepage": "http://logbuy.com"
    },
  ],
}