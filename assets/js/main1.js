var state = {
  data: [],
  highestIndex: 0,
  totalRows: 0
}

const columns = 6;
const labels = ["min", "max", "value", "percent"];

const AlertType = {
  Success: 'success',
  Fail: 'danger',
  Info: 'info'
}

function addRow(id = '', values = {}) {
  console.log(state);
  let table = document.querySelector('#margin-table tbody');
  if(table) {
    state.highestIndex += 1;
    state.totalRows += 1;

    let newRow = table.insertRow();
    if(id === '')
      newRow.id = 'row-' + state.highestIndex;
    else
      newRow.id = 'row-' + id;
  
    // add cell with id number
    let numberCell = newRow.insertCell(0);
    let index = id !== '' ? id : state.highestIndex;
    numberCell.outerHTML = "<th scope='row'>" + index + "</th>";
    
    // add cells with input values
    for (let i = 1; i < columns - 1; i++) {
      let newCell = newRow.insertCell(i);
      let input = document.createElement('input');
      input.type = "number";
      input.classList.add('form-control', 'form-control-sm');
      // if(values[labels[i - 1]] !== undefined && values[labels[i - 1]] >= 0) {
      if(values[labels[i - 1]] !== undefined) {
        input.value = values[labels[i - 1]];
        console.log('input.value');
      } else {
        input.placeholder = labels[i - 1];
        console.log("input.placeholder");
      }
      // input.placeholder = values[labels[i - 1]] !== undefined ? values[labels[i - 1]] : labels[i - 1];
        
      input.id = id !== '' ? labels[i - 1] + '-' + id : labels[i - 1] + '-' + state.highestIndex;
      newCell.appendChild(input);
    }
  
    // add cell with buttons
    let actionCell = newRow.insertCell(columns - 1);
    let button = document.createElement('button');
    button.classList.add('btn', 'btn-danger', 'btn-sm', 'remove');
    button.addEventListener('click', function(event) {
      // remove Node from DOM
      let targetElement = event.target;
      let targetElementRow = targetElement.closest('tr');
      let id = targetElementRow.id.split('-')[1] - 1;
      targetElementRow.parentNode.removeChild(targetElementRow);
      state.totalRows -= 1;
      if(id >= state.totalRows) {
        let rows = document.querySelectorAll('tbody tr');
        let lastRow = rows[rows.length - 1];
        if(lastRow)
          state.highestIndex = parseInt(lastRow.id.split('-')[1])
        else 
          state.highestIndex = 0;
      } 

      //delete data from state
      // let id = targetElementRow.id.split('-')[1] - 1;
      // console.log('id', id);
      // state.data.splice(id, 1);
      // state.totalRows -= 1;
      // console.log(state);
    });
    button.innerHTML = '<i class="bi bi-trash-fill"></i>';
    actionCell.appendChild(button);
  } else {
    console.error('Found no table to append new row to!');
  }
}

async function getData() {
  let preloader = document.getElementById('form-preloader');
  preloader.style.display = "inline-block";
  let table = document.getElementById('margin-table');
  if(table) {
    let rows = table.querySelectorAll('tbody tr');
    let dataRows = [];
    for (let row of rows) {
      let inputs = row.querySelectorAll('input');
      let dataRow = [];
      for (let input of inputs) {
        let label = input.id.split('-')[0];
        let id = input.id.split('-')[1]
        let value = input.value;
        console.log('value', value);
        let dataObj = {
          type: label,
          value: value
        }
        dataRow.push(dataObj);
      }
      dataRows.push(dataRow);
    }
    state.data = dataRows;
    console.log(state);

  } else {
    console.error('Found no table to append new row to!');
  }

  try {
    const response = await fetch('/wholesaler/setConfiguration', {
      method: 'post',
      body: JSON.stringify(state),
      headers: {
          'Content-Type': 'application/json'
      }
    });
    let myJson = await response.json();

  } catch (error) {

    message = "Zrobione"

    alert(AlertType.Success, message);
  
    preloader.style.display = "none";
  }

  let message = JSON.stringify(state)
  alert(AlertType.Success, message);
  preloader.style.display = "none";
}



async function calculateMargin() {
  let preloader = document.getElementById('calculate-preloader');
  preloader.style.display = "inline-block";

  try {
    const response = await fetch('/wholesaler/login', {
      method: 'get',
      headers: {
          'Content-Type': 'application/json'
      }
    });
    let myJson = await response.json();

  } catch (error) {

    message = "Zrobione"

    alert(AlertType.Success, message);
  
    preloader.style.display = "none";
  }

  message = "Zrobione"

  alert(AlertType.Success, message);

  preloader.style.display = "none";
}

async function sendFormData() {
  let preloader = document.getElementById('form-preloader');
  preloader.style.display = "inline-block";

  let formInputs = document.querySelectorAll('.form-control');
  for (let input of formInputs) {
    let value = input.value;
    let property = input.id.split('-')[1];
    state[property] = value;
  }
  console.log(state);

  const response = await fetch('/wholesaler/setConfiguration', {
    method: 'POST',
    body: JSON.stringify(state),
    headers: {
        'Content-Type': 'application/json'
    }
  });

  let myJson = await response.json();

  let message = JSON.stringify(state)
  alert(AlertType.Success, message);
  
  preloader.style.display = "none";
}

const alertContainer = document.getElementById('alerts')
const alert = (alertType, message) => {
    let data = {};
    data.message = message;
    switch(alertType) {
        case AlertType.Success:
            data.type = alertType;
            data.icon = 'bi-check-circle-fill';
            data.header = 'Sukces!';
            break;
        case AlertType.Fail:
            data.type = alertType;
            data.icon = 'bi-exclamation-triangle-fill';
            data.header = 'Wystąpił błąd.';
            break;
        default:
            data.type = alertType;
            data.icon = 'bi-info-circle-fill';
            data.header = 'Informacja.';
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="toast toast-${data.type} text-bg-${data.type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">`,
        `   <div class="toast-header border-0 pb-0">`,
        `       <i class="bi ${data.icon} text-bg-${data.type}"></i>`,
        `       <strong class="me-auto text-bg-${data.type} px-1"> ${data.header}</strong>`,
        `       <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>`,
        `   </div>`,
        `   <div class="toast-body pt-1">`,
        `       ${data.message}`,
        `   </div>`,
        `</div>`
    ].join('');
  
  let toast = new bootstrap.Toast(wrapper);
  toast.show();
  alertContainer.append(wrapper);
}

function launchTableRows() {
  if(periodsData && periodsData.length > 0) {
    // state.highestIndex = periodsData.length;
    // state.totalRows = periodsData.length;
    for(let periodData of periodsData) {
      // console.log(periodData);
      // addRow(periodData.id, [periodData.min, periodData.max, periodData.value, periodData.percent]);
      addRow(periodData.id + 1, periodData);
    }
  }
}

window.onload = function() {
  console.log(periodsData);
  periodsData = JSON.parse(periodsData);
  launchTableRows();
};