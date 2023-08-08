var state = {
    packages: [],
    email : {},
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

const trackingStatuses = ["Unknown", "Courier label created", "Shipped", "Not delivered", "Out for delivery", "Delivered", "Return", "Aviso", "Waiting at point", "Lost", "Canceled", "On the way"]

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

async function deletePackage(packageId) {
    console.log(packageId)
    console.log(orderPackages.packages)
    let package = orderPackages.packages.find(package => Number.parseInt(package.package_id) === Number.parseInt(packageId));

    let packageData = {
        'package_id': package.package_id,
        'courier_code': package.courier_code,
        'package_number': package.package_number
    };

    
    console.log(packageData);
    const response = await fetch('/8080/shipments/remove', {
        method: 'POST',
        body: JSON.stringify(packageData),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    let myJson = await response.json();
    myJson = myJson.status.toLowerCase();
    

    // //myJson = "success"
    // //myJson = "fail"

    // const myJson="success";
    let data = {};
    console.log('myjson_???',myJson);
    if(myJson === "success"){
        let row = document.getElementById(package.package_id);
        row.parentNode.removeChild(row);

        let message = 'Pomyślnie usunięto przesyłkę o numerze ' + package.package_id + '.';
        alert(AlertType.Success, message);
        
    }else if(myJson === "fail" || myJson === "error"){
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

function addPackageToList(packageId) {
    let package = orderPackages.packages.find(package => Number.parseInt(package.package_id) === Number.parseInt(packageId));
    console.log('orderpackages in addpkgtolist', orderPackages);
    console.log('orderpackages in addpkgtolist', orderPackages.packages);
    console.log('package in addPackageToList', package);
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

async function sendEmail() {
    let preloader = document.getElementById('email-preloader');
    preloader.style.display = "inline-block";
    let messageTextarea = document.getElementById('email-message');
    let topicInput = document.getElementById('email-topic');
    let moveToCategoryCheck = document.getElementById('email-move');
    let receiversInput = document.getElementById('email-receivers');
    let receivers = receiversInput.value.replaceAll(' ', '').split(',');

    state.email = {
        message: messageTextarea.value,
        topic: topicInput.value,
        moveToCategory: moveToCategoryCheck.checked,
        receivers: receivers
    }
    //console.log(state);

    const response = await fetch('/8080/shipments/email', {
        method: 'POST',
        body: JSON.stringify(state),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    let myJson = await response.json();

    console.log("myJsonXD wot",myJson)
    console.log('state', state);

    myJson = myJson.status.toLowerCase();

    if(myJson === 'success') {
        let message = 'Pomyślnie wysłano e-mail.';
        alert(AlertType.Success, message);
    } else {
        let message = 'Nie udało się wysłać wiadomości';
        alert(AlertType.Fail, message);
    }
    preloader.style.display = "none";
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
    let preloader = document.getElementById('package-preloader');
    preloader.style.display = "inline-block";

    const response = await fetch('/8080/shipments/create', {
        method: 'POST',
        body: JSON.stringify(state),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const myJson = await response.json();
    const responseStatus = myJson.status.toLowerCase();
    const error_status = myJson.errorCode;
    const package = myJson.package;
    const packages = myJson.packages;

    console.log(myJson);

    // const responseStatus = 'success';
     console.log("myError: ", error_status)


    

    let message = '';

    if(responseStatus === "success" && error_status == null){
        // let row = document.getElementById(package.package_id);
        // row.parentNode.removeChild(row);

        message = 'Pomyślnie utworzono przesyłkę o numerze ' + package.courier_package_nr + '.';
        console.log('stare', orderPackages);
        
        orderPackages.packages = packages;

        console.log('nowe', orderPackages);


        let tbdy = document.querySelector('#packages tbody');
        tbdy.innerHTML = '';

        for (let pkg of packages) {
            let tbl = document.querySelector('#packages .table tbody');
            let row = tbl.insertRow();
            row.setAttribute('id', pkg.package_id);
            row.insertCell().appendChild(document.createTextNode('data'));
            row.insertCell().appendChild(document.createTextNode(pkg.courier_code));
            let a = document.createElement('a');
            let linkText = document.createTextNode(pkg.courier_package_nr);
            a.appendChild(linkText);
            a.title = pkg.courier_package_nr;
            a.href = pkg.tracking_url;
            row.insertCell().appendChild(a);
            row.insertCell().appendChild(document.createTextNode(trackingStatuses[pkg.tracking_status]));
        
            let deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'me-1');
            deleteButton.setAttribute('type', 'button');
            deleteButton.addEventListener('click', function() {
                console.log(pkg);
                deletePackage(pkg.package_id);
                // console.log("deletePackage");
            });
            deleteButton.innerHTML = '<i class="bi bi-trash-fill"></i>';
    
            let addButton = document.createElement('button');
            addButton.classList.add('btn', 'btn-success', 'btn-sm');
            addButton.setAttribute('type', 'button');
            addButton.addEventListener('click', function() {
                console.log(pkg);
                addPackageToList(pkg.package_id);
                // console.log("addPackage");
            });
            addButton.innerHTML = '<i class="bi bi-plus"></i>';
    
            let buttonCell = row.insertCell();
            buttonCell.appendChild(deleteButton);
            buttonCell.appendChild(addButton);
        }

        
        alert(AlertType.Success, message);
    }else if(responseStatus === "success" && error_status != null){

        message = 'Nie udało się utworzyć przesyłki. ';
        message += myJson.errorMsg;
 
         console.log("niedziała")
         alert(AlertType.Fail, message);
    }
    else if(responseStatus === "fail"){
       message = 'Nie udało się utworzyć przesyłki. ';
       message += myJson.errorMsg;

        console.log("niedziała")
        alert(AlertType.Fail, message);
    }
    
    preloader.style.display = "none";
}

window.onload = async function() {
    console.log('Func launched');
    console.log('orderPackages', orderPackages);


    orderPackages = JSON.parse(orderPackages);
    
    console.log('orderPackagesparse', orderPackages);
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


