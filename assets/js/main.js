var state = {
    packages: [],
    email : {

    },
    // message: "",
    // topic: "",
    przesylka: []
};

const alertContainer = document.getElementById('alerts')
const toastElList = document.querySelectorAll('.toast')
const toastList = [...toastElList].map(toastEl => new bootstrap.Toast(toastEl, "show"))

const alert = (data) => {
  const wrapper = document.createElement('div');

//   wrapper.innerHTML = [
//     `<div class="alert alert-${data.type} alert-dismissible" role="alert">`,
//     `   <h4 class="alert-heading"><i class="bi ${data.icon}"></i> ${data.header}</h4>`,
//     `   <div>${data.message}</div>`,
//     '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
//     '</div>'
//   ].join('');

  wrapper.innerHTML = [
    `<div class="toast toast-${data.type} show" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true">`,
    `   <div class="toast-header">`,
    `       <i class="bi ${data.icon}"></i>`,
    `       <strong class="me-auto">${data.header}</strong>`,
    `       <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>`,
    `   </div>`,
    `   <div class="toast-body">`,
    `       ${data.message}`,
    `   </div>`,
    `</div>`
  ].join('');
  
  let toast = new bootstrap.Toast(wrapper);
  toast.show();
  alertContainer.append(wrapper);
  
}

// const alertTrigger = document.getElementById('liveAlertBtn')
// if (alertTrigger) {
//   alertTrigger.addEventListener('click', () => {
//     alert('Nice, you triggered this alert message!', 'success')
//   })
// }

async function deletePackage(package) {

    let packageData = {
        'package_id': package.package_id,
        'courier_code': package.courier_code,
        'package_number': package.package_number
    };

    
    console.log(packageData);
    // const response = await fetch('/shipments/remove', {
    //     method: 'POST',
    //     body: JSON.stringify(packageData),
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // });
    
    // const myJson = await response.json();

    //myJson = "success"
    //myJson = "fail"

    const myJson="fail";
    let data = {};

    if(myJson === "success"){
        // let row = document.getElementById(package.package_id);
        // row.parentNode.removeChild(row);
        data.type = 'success';
        data.header = 'Sukces!';
        data.message = 'Pomyślnie usunięto przesyłkę o numerze ' + package.package_id + '.';
        data.icon = 'bi-exclamation-triangle-fill';
        
    }else if(myJson === "fail"){
        data.type = 'danger';
        data.header = 'Wystąpił błąd.'
        data.message = 'Nie udało się usunąć przesyłki o numerze ' + package.package_id + '.';
        data.icon = 'bi-check-circle-fill';
        console.log("niedziała")
    }
    alert(data);
    
}

function addPackageToList(package) {


    let alreadyInArray = state.packages.some(pkg => pkg.courier_package_nr === package.courier_package_nr) ? true : false;       
    if(!alreadyInArray) {
        if(state.packages.length === 0) {
            let emptyMessage = document.getElementById('labels-empty');
            emptyMessage.style.display = "none";
        }
    
        let packageList = document.getElementById('labels-list');
    
        let li = document.createElement('li');
        li.classList.add('labels-list__element');
        li.appendChild(document.createTextNode(package.courier_package_nr + " "));
    
        li.setAttribute('id', "li_" + package.courier_package_nr);
    
        let button = document.createElement('button');
        button.classList.add('btn', 'btn-danger', 'btn-sm');
        // button.setAttribute("onclick", "removePackageFromList(event, this)")
        // button.setAttribute("onclick", "removePackageFromList("+package.courier_package_nr.toString()+")")
        // button.onclick = "removePackageFromList(package.courier_package_nr)";

        button.addEventListener('click', function() {
            removePackageFromList(package.courier_package_nr)
        });

        button.innerHTML = '<i class="bi bi-dash"></i>';
        li.appendChild(button);
    
        packageList.appendChild(li);
    
        state.packages.push(package);
    }
        
    console.log(state);
}

function removePackageFromList(courier_package_nr) {
    console.log(courier_package_nr);
    let packageId = courier_package_nr;
    let liSource = document.getElementById("li_" + packageId);
    // target = target || window.event;
    // let eventSource = target.target || target.srcElement;
    // let liSource = eventSource.parentNode.parentNode;
    // let packageId = liSource.id;

    state.packages  = state.packages.filter(package => package.courier_package_nr !== packageId);
    console.log("removeFromList", state);

    // liSource.parentNode.removeChild(liSource);
    liSource.outerHTML = "";

    if(state.packages.length === 0) {
        let emptyMessage = document.getElementById('labels-empty');
        emptyMessage.style.display = "block";
    }
}

// function removePackageFromList(target) {
//     target = target || window.event;
//     let eventSource = target.target || target.srcElement;
//     let liSource = eventSource.parentNode.parentNode;
//     let packageId = liSource.id;

//     state.packages  = state.packages.filter(package => package.courier_package_nr !== packageId);
//     console.log("removeFromList", state);

//     liSource.parentNode.removeChild(liSource);

//     if(state.packages.length === 0) {
//         let emptyMessage = document.getElementById('labels-empty');
//         emptyMessage.style.display = "block";
//     }
// }

function sendEmail() {
    let messageTextarea = document.getElementById('email-message');
    let topicInput = document.getElementById('email-topic');
    state.email = {
        message: messageTextarea.value,
        topic: topicInput.value
    }
    console.log(state);
}
function getShopeeFieldValues(){
   //TODO: state.przesylka = {packageId : ???}
   console.log("shopee")
}
function getNewPackageFieldValues(type) {
    let selector = '#' + type + '-tab-pane .form__input';
    let inputFields = document.querySelectorAll(selector);
    let values = [];
    for (let inputField of inputFields) {
        let input = inputField.getElementsByClassName('przesylki-input')[0];
        if(input && input.classList.contains('form-select')) {
            values.push({name: input.id.split('-')[0], value: input.options[input.selectedIndex].text});
        } else if (input && input.classList.contains('form-control')) {
            values.push({name: input.id.split('-')[0], value: input.value});
        }
    }

    //get radios
    selector = '#' + type + '-tab-pane .form__input--radios';
    let radioGroups = document.querySelectorAll(selector);
    for (let radioGroup of radioGroups) {
        let radios = radioGroup.getElementsByClassName('przesylki-radio');
        for (let radio of radios) {
            if(radio.checked) {
                values.push({name: 'size', value: radio.value});
            }
        }
    }
    state.przesylka = values;

    //get package dimensions
    selector = '#dimensions .dimension__input';
    let dimensionInputFields = document.querySelectorAll(selector);
    let dimensions = [];
    for (let dimensionInputField of dimensionInputFields) {
        let dimensionInput = dimensionInputField.getElementsByClassName('dimension-input')[0];
        dimensions.push({
            value: dimensionInput.value,
            dimension: dimensionInput.id.split('-')[1]
        });
    }

    state.przesylka.dimensions = dimensions;
    console.log(state)
}

window.onload = function() {
    console.log('Func launched');
    let deliveryMethod = document.getElementById('delivery-method-span').textContent;
    state.deliveryMethod = deliveryMethod;

    let allegroTabBtn = document.getElementById('allegro-btn');
    allegroTabBtn.addEventListener('click', function() {
        getNewPackageFieldValues('allegro');
    });

    document.getElementById('dhl-btn').addEventListener('click', function() {
        getNewPackageFieldValues('dhl');
    });

    document.getElementById('inpost-btn').addEventListener('click', function() {
        getNewPackageFieldValues('inpost');
    });

    document.getElementById('paczkomaty-btn').addEventListener('click', function() {
        getNewPackageFieldValues('paczkomaty');
    });
//     document.getElementById('shopee-btn').addEventListener('click', function() {
//         getShopeeFieldValues();
//     });
}


