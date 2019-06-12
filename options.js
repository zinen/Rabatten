debuglog('Options: scrip is running!');

function createForm() {
  chrome.storage.sync.get(['memberships'], function (list) {
    let keeps = list.memberships || [];
    let form = document.getElementById('form');
    for (let key of Object.keys(DiscountServices)) {
      let newlabel = document.createElement('label');
      newlabel.innerText = key;
      let checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      newlabel.className = 'container';
      checkbox.checked = false;//temp set to true, should be false
      if (keeps.includes(key)) {
        checkbox.checked = true;
      }
      checkbox.name = key;
      checkbox.value = key;
      let newa = document.createElement('a');
      newa.href = DiscountServices[key][0].homepage
      newa.innerText = "[link]"
      let newspan = document.createElement('span');
      newspan.className = 'checkmark';
      newlabel.appendChild(checkbox);
      newlabel.appendChild(newspan);
      form.appendChild(newlabel);
      form.appendChild(newa);
      //Add line change
      form.appendChild(document.createElement('br'));
    }
  });
}

createForm();

//Save the options on click
document.getElementById('optionsSubmit').onclick = function () {
  let checkboxes = document.getElementsByTagName('input');
  let services = [];
  //Loop through all checked checkboxes
  for (i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked == true) {
      services.push(checkboxes[i].name);
    }
  }
  chrome.storage.sync.set({ memberships: services });
  window.close();
}
debuglog('Options: scrip end.');
