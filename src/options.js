/* global debuglog, chrome, DiscountServices */
debuglog('Options: scrip is running!')

function formCreate () {
  chrome.storage.sync.get('memberships', function (arraylist) {
    const list = arraylist.memberships || []
    const container = document.getElementById('check-list')
    for (const key in DiscountServices) {
      const newP = document.createElement('p')
      const newLabel = document.createElement('label')
      newLabel.className = 'check-container'
      newLabel.innerText = key
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = false
      if (list.includes(key)) {
        checkbox.checked = true
      }
      checkbox.name = key
      const newA = document.createElement('a')
      newA.href = DiscountServices[key][0].homepage
      newA.innerText = '[link]'
      const newspan = document.createElement('span')
      newspan.className = 'checkmark'
      newLabel.appendChild(checkbox)
      newLabel.appendChild(newspan)
      newP.appendChild(newLabel)
      newP.appendChild(newA)
      container.appendChild(newP)
    }
  })
}
formCreate()

function formSave () {
  const checkboxes = document.getElementsByTagName('input')
  const services = []
  // Loop through all checked checkboxes
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked === true) {
      services.push(checkboxes[i].name)
    }
  }
  chrome.storage.sync.set({ memberships: services })
  chrome.runtime.sendMessage({ getDiscounts: true })
};

function textareaCreate () {
  chrome.storage.sync.get('domainfilter', function (arraylist) {
    const list = arraylist.domainfilter || []
    let text = ''
    for (const item of list) {
      text += item + ','
    }
    text = text.slice(0, -1)
    document.getElementById('domainFilter').value = text
  })
}
textareaCreate()

function textareaSave () {
  let textarea = document.getElementById('domainFilter').value
  textarea = textarea.replace(/[\n\r]/g, ',') // reaplace newline with comma
  textarea = textarea.split(',').map(s => s.trim()) // Split and trim array
  for (let i = textarea.length - 1; i >= 0; i--) {
    const dotCount = (textarea[i].match(/./g) || []).length
    if (dotCount === 0) {
      textarea.splice(i, 1)
      continue
    }
    if (dotCount > 1) {
      textarea[i] = textarea[i].replace(/^\w+:?\/\/w?w?w?\.?([^/]+)\/?.*$/, '$1').split('.') // Rremoves www and everything after domian name
      if (textarea[i][textarea[i].length - 1] === 'uk') {
        // Fix for uk domains, cant handel domain suffixes with only ".uk" but will handle domains like ".co.uk"
        textarea[i] = textarea[i].slice(-3).join('.')
      } else {
        textarea[i] = textarea[i].slice(-2).join('.')
      }
    }
  }
  chrome.storage.sync.set({ domainfilter: textarea })
}

// Save the options on click
document.getElementById('optionsSubmit').onclick = function () {
  formSave()
  textareaSave()
  chrome.storage.sync.set({ version: (chrome.runtime.getManifest()).version })
  window.close()
}
debuglog('Options: scrip end.')
