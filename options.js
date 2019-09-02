debuglog('Options: scrip is running!');

function formCreate() {
  chrome.storage.sync.get('memberships', function (arraylist) {
    let list = arraylist.memberships || [];
    let container = document.getElementById('check-list');
    for (let key in DiscountServices) {
      let newP = document.createElement('p');
      let newlabel = document.createElement('label');
      newlabel.className = 'check-container';
      newlabel.innerText = key;
      let checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = false;
      if (list.includes(key)) {
        checkbox.checked = true;
      }
      checkbox.name = key;
      let newa = document.createElement('a');
      newa.href = DiscountServices[key][0].homepage
      newa.innerText = "[link]"
      let newspan = document.createElement('span');
      newspan.className = 'checkmark';
      newlabel.appendChild(checkbox);
      newlabel.appendChild(newspan);
      newP.appendChild(newlabel);
      newP.appendChild(newa);
      container.appendChild(newP);
    }
  });
}
formCreate();

function formSave() {
  let checkboxes = document.getElementsByTagName('input');
  let services = [];
  //Loop through all checked checkboxes
  for (i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked == true) {
      services.push(checkboxes[i].name);
    }
  }
  chrome.storage.sync.set({ memberships: services });
  chrome.runtime.sendMessage({ getDiscounts: true });
};

function textareaCreate() {
  chrome.storage.sync.get('domainfilter', function (arraylist) {
    let list = arraylist.domainfilter || ["facebook.com", "google.com"];
    let text = "";
    for (let item of list) {
      text += item + ","
    }
    text = text.slice(0, -1);
    document.getElementById('domainFilter').value = text
  });
}
textareaCreate();

function textareaSave() {
  let textarea = document.getElementById('domainFilter').value
  textarea = textarea.replace(/[\n\r]/g, ',') //reaplace newline with comma
  textarea = textarea.split(",").map(s => s.trim()); //Split and trim array
  for (let i = textarea.length - 1; i >= 0; i--) {
    let dotCount = (textarea[i].match(/./g) || []).length;
    if (dotCount == 0) {
      textarea.splice(i, 1);
      continue;
    }
    if (dotCount > 1) {
      textarea[i] = textarea[i].replace(/^\w+:?\/\/w?w?w?\.?([^\/]+)\/?.*$/, '$1').split(".") //Rremoves www and everything after domian name
      if (textarea[i][textarea[i].length - 1] == "uk") {
        //Fix for uk domains, cant handel domain suffixes with only ".uk" but will handle domains like ".co.uk"
        textarea[i] = textarea[i].slice(-3).join(".");
      } else {
        textarea[i] = textarea[i].slice(-2).join(".");
      }

    }
  }
  chrome.storage.sync.set({ domainfilter: textarea });
}

//Save the options on click
document.getElementById('optionsSubmit').onclick = function () {
  formSave();
  textareaSave();
  window.close();
}
debuglog('Options: scrip end.');
