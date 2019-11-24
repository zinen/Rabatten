var fs = require('fs')

const packageVersion = process.env.npm_package_version
console.log('Package version: ' + packageVersion)
const file = 'src/manifest.json'

function readWriteSync () {
  let data = fs.readFileSync(file, 'utf-8')
  data = JSON.parse(data)
  console.log('Manifest version: ' + data.version)
  if (packageVersion !== data.version) {
    data.version = packageVersion
    data = JSON.stringify(data, null, 2)
    fs.writeFileSync(file, data, 'utf-8')
    console.log('\x1b[33mWrite to manifest complete, data :' + packageVersion)
  } else {
    console.log('\x1b[32mNo need to update manifest version')
  }
}

readWriteSync()
