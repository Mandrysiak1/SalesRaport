var state = {
    packages: [],
    email : {

    },
    // message: "",
    // topic: "",
    przesylka: {},
    deliveryMethod : '',
    orderId: ''
};

const AlertType = {
    Success: 'success',
    Fail: 'danger',
    Info: 'info'
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

    const myJson="success";
    let data = {};

    if(myJson === "success"){
        let row = document.getElementById(package.package_id);
        row.parentNode.removeChild(row);

        let message = 'Pomyślnie usunięto przesyłkę o numerze ' + package.package_id + '.';
        alert(AlertType.Success, message);
        
    }else if(myJson === "fail"){
        let message = 'Nie udało się usunąć przesyłki o numerze ' + package.package_id + '.';
        alert(AlertType.Fail, message);
        console.log("niedziała")
    }
    
    
}

function createPackageListItemAndAppend(package) {
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
    button.addEventListener('click', function() {
        removePackageFromList(package.courier_package_nr)
    });
    button.innerHTML = '<i class="bi bi-dash"></i>';
    li.appendChild(button);
    packageList.appendChild(li);
}

function addPackageToList(package) {
    let alreadyInArray = state.packages.some(pkg => pkg.courier_package_nr === package.courier_package_nr) ? true : false;       
    if(!alreadyInArray) 
    {
        createPackageListItemAndAppend(package);
    
        let packageData = {
            'package_id': package.package_id,
            'courier_code': package.courier_code,
            'package_number': package.package_number,
            'courier_package_nr': package.courier_package_nr
        };
        state.packages.push(packageData);
        let message = 'Pomyślnie dodano etykietę przesyłki o numerze ' + package.courier_package_nr + '.';
        alert(AlertType.Success, message);
    } 
    else {
        let message = 'Nie udało się dodać etykiety przesyłki ' + package.courier_package_nr + ' - jest ona już dodana do listy.';
        alert(AlertType.Fail, message);
    }
        
    console.log(state);
}

function removePackageFromList(courier_package_nr) {
    let packageId = courier_package_nr;
    let liSource = document.getElementById("li_" + packageId);
    state.packages  = state.packages.filter(package => package.courier_package_nr !== packageId);
    console.log("removeFromList", state);
    liSource.outerHTML = "";

    if(state.packages.length === 0) {
        let emptyMessage = document.getElementById('labels-empty');
        emptyMessage.style.display = "block";
    }
}

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
            state.deliveryMethod = input.options[input.selectedIndex].text;
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
    state.przesylka.data = values;

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

async function createPackage()
{
    const response = await fetch('/shipments/create', {
        method: 'POST',
        body: JSON.stringify(state),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const myJson = await response.json();
    console.log("myJson: ", myJson)

    let data = {}
    if(myJson === "success"){
        // let row = document.getElementById(package.package_id);
        // row.parentNode.removeChild(row);
        data.type = 'success';
        data.header = 'Sukces!';
        //data.message = 'Pomyślnie usunięto przesyłkę o numerze ' + package.package_id + '.';
        data.icon = 'bi-exclamation-triangle-fill';
        
    }else if(myJson === "fail"){
        data.type = 'danger';
        data.header = 'Wystąpił błąd.'
       // data.message = 'Nie udało się usunąć przesyłki o numerze ' + package.package_id + '.';
        data.icon = 'bi-check-circle-fill';
        console.log("niedziała")
    }
    alert(data);

}

window.onload = async function() {
    console.log('Func launched');
    // let deliveryMethod = document.getElementById('delivery-method-span').textContent;
    // state.deliveryMethod = deliveryMethod;
    // document.getElementById('delivery-method-span').textContent = deliveryMethod;


    let orderId = document.getElementById('order-id-span').textContent.replace('#', '');
    state.orderId = orderId;

    let allegroTabBtn = document.getElementById('allegro-btn');
    allegroTabBtn.addEventListener('click',async function() {
        getNewPackageFieldValues('allegro');
         await createPackage()
    });

    document.getElementById('dhl-btn').addEventListener('click',async function() {
        getNewPackageFieldValues('dhl');
         await createPackage()
        
    });

    document.getElementById('inpost-btn').addEventListener('click',async function() {
        getNewPackageFieldValues('inpost');
         await createPackage()
    });

    document.getElementById('paczkomaty-btn').addEventListener('click', async function() {
        getNewPackageFieldValues('paczkomaty');
         await createPackage()
    });
//     document.getElementById('shopee-btn').addEventListener('click', function() {
//         getShopeeFieldValues();
//     });
}


