const debug = true
function debuglog (input) { // eslint-disable-line
  if (debug) {
    console.log(input)
  }
}
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
