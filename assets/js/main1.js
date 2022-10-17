var state = {
  margin: -1,
  marginThreshold: -1,
  marginConst: -1
}

const AlertType = {
  Success: 'success',
  Fail: 'danger',
  Info: 'info'
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