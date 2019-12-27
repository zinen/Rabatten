const debug = false
/**
 * Debug function used for development.
 * @param {any} input - Any data type to log to the console.
 */
function debuglog (input) { // eslint-disable-line
  if (debug) {
    console.log(input)
  }
}

/**
 * Common shared data
 */
const DiscountServices = { // eslint-disable-line
  forbrugsforeningen: [{
    name: 'Forbrugsforeningen',
    arrayName: 'array_forbrugsforeningen',
    databaseURL: 'https://cdn.jsdelivr.net/gh/zinen/rabatten-scraper@latest/dist/forbrugsforeningen.json',
    homepage: 'http://forbrugsforeningen.dk'
  }],
  logbuy: [{
    name: 'LogBuy',
    arrayName: 'array_logbuy',
    databaseURL: 'https://cdn.jsdelivr.net/gh/zinen/rabatten-scraper@latest/dist/logbuy.json',
    homepage: 'http://logbuy.com'
  }],
  coop: [{
    name: 'Coop partner fordele',
    arrayName: 'array_coop',
    databaseURL: 'https://cdn.jsdelivr.net/gh/zinen/rabatten-scraper@latest/dist/coop.json',
    homepage: 'https://partnerfordele.coop.dk/'
  }]
}
