var fs = require('fs')

const packageVersion = process.env.npm_package_version
console.log('Node.js package version: ' + packageVersion)
const file = 'src/manifest.json'

/**
 * Updates the manifest inside /src/ folder to
 * match the version stated in package.json
 */
function updateManifest () {
  let data = fs.readFileSync(file, 'utf-8')
  data = JSON.parse(data)
  console.log('Chrome extention manifest version: ' + data.version)
  if (packageVersion !== data.version) {
    data.version = packageVersion
    data = JSON.stringify(data, null, 2)
    fs.writeFileSync(file, data, 'utf-8')
    console.log('\x1b[33mWrite to manifest complete, data: \x1b[0m' + packageVersion)
  } else {
    console.log('\x1b[32mNo need to update manifest version\x1b[0m')
  }
}

updateManifest()
