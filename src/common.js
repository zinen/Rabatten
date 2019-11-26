const debug = false
// Debug function used for development
// input - Any data type to log to the console
function debuglog (input) { // eslint-disable-line
  if (debug) {
    console.log(input)
  }
}

// Common data share with other .js
const DiscountServices = { // eslint-disable-line
  forbrugsforeningen: [
    {
      arrayName: 'array_forbrugsforeningen',
      databaseURL: 'https://cdn.jsdelivr.net/gh/zinen/Rabatten@latest/forbrugsforeningen.json',
      homepage: 'http://forbrugsforeningen.dk'
    }
  ],
  logbuy: [
    {
      arrayName: 'array_logbuy',
      databaseURL: 'https://cdn.jsdelivr.net/gh/zinen/Rabatten@latest/logbuy.json',
      homepage: 'http://logbuy.com'
    }
  ]
}
