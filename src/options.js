console.log('Options: script is running!')

/**
 * Makes a checklist from content of array.
 */
function formCreate () {
  chrome.storage.sync.get('memberships', function (arrayList) {
    const list = arrayList.memberships || []
    const container = document.getElementById('check-list')
    for (const key in DiscountServices) {
      const newP = document.createElement('p')
      const newLabel = document.createElement('label')
      newLabel.className = 'check-container'
      newLabel.innerText = DiscountServices[key].name
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = list.includes(key) === true
      checkbox.name = key
      const newA = document.createElement('a')
      newA.href = DiscountServices[key].homepage
      newA.innerText = '[link]'
      const newSpan = document.createElement('span')
      newSpan.className = 'checkmark'
      newLabel.appendChild(checkbox)
      newLabel.appendChild(newSpan)
      newP.appendChild(newLabel)
      newP.appendChild(newA)
      container.appendChild(newP)
    }
  })
}
formCreate()

/**
 * Saves checked and uncheck values to synchronized storage.
 */
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
}

/**
 * Fills the textarea with data from synchronized storage.
 */
function textareaCreate () {
  chrome.storage.sync.get('domainfilter', function (arrayList) {
    const list = arrayList.domainfilter || []
    document.getElementById('domainFilter').value = list.join(', ')
    document.getElementById('domainFilter').value += ', '
  })
}
textareaCreate()

/**
 * Saves the entered data textarea to synchronized storage.
 */
function textareaSave () {
  let textarea = document.getElementById('domainFilter').value
  textarea = textarea.replace(/[\n\r]/g, ',') // replaced newline with comma
  textarea = textarea.split(',').map(s => s.trim()) // Split and trim array
  for (let i = textarea.length - 1; i >= 0; i--) {
    const dotCount = (textarea[i].match(/./g) || []).length
    if (dotCount === 0) {
      textarea.splice(i, 1)
      continue
    } else if (dotCount > 1) {
      textarea[i] = textarea[i].replace(/^\w+:?\/\/(?:www\.)?\.?([^/]+)\/?.*$/, '$1').split('.') // Removes www and everything after domain name
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

/**
 * Initiate the different save functions on click.
 */
document.getElementById('optionsSubmit').onclick = function () {
  formSave()
  textareaSave()
  chrome.storage.sync.set({ version: (chrome.runtime.getManifest()).version })
  window.close()
}
console.log('Options: script end.')
