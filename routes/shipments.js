const express = require('express')
const router = express.Router()
const axios = require('axios')
const e = require('express')


router.get('/add', async (req, res) => {

  let orderID = 52505013

  let order_id = req.body.order_id

  addPackage(orderID)

  res.send("test");

})

router.get('/remove', async (req, res) => {

  let package_id = req.body.package_id
  let package_number = req.body.package_number
  let courier_code = req.body.courier_code

  let response = removePackage(package_id, package_number, courier_code)

  res.json(response.data.status);

})

router.get('/getPackages', async (req, res) => {

  let orderID = 52175215

  let orderPackages = await getOrderPackages(orderID)

  var tempadd = []

  for (let index = 0; index < orderPackages.packages.length; index++) {

    tempadd.push(orderPackages.packages[index].package_id)

  }

  console.log(orderPackages)


  let orderPackagesDetails = await getOrderPackagesDetails(tempadd)

  for (let index = 0; index < Object.keys(orderPackagesDetails.packages_history).length; index++) {

    let objindex = Object.keys(orderPackagesDetails.packages_history)[index]

    for (let inner_index = 0; inner_index < orderPackagesDetails.packages_history[objindex].length; inner_index++) {

      const element = orderPackagesDetails.packages_history[objindex][inner_index];

      console.log(element)
    }

  }

  res.send("ok")

})

router.get('/execute', async (req, res) => {

  let orderID = 52505013

  //mark package with "api" in extrafield1
  //create all nessesery packages
  //unmark package
  //move order to proper category
  //send emails

  let orderDetails = await getOrderDetails(orderID)




  console.log(orderDetails)




  //await markOrderWithStar(orderID)
  // await createPackages(orderID,orderDetails)
  //await unmarkOrderWithStar(orderID)
  //await moveOrderToProperCategory(orderID,orderDetails.order_source)
  //await sendEmail(orderID)

  res.send("ok")

})


async function addPackage(order_id) {

  let orderDetails = await getOrderDetails(orderID)
  createPackages(order_id, orderDetails)

}



async function removePackage(courier_code, package_id, package_number) {

  let params = {
    "courier_code": courier_code,
    "package_id": package_id,
    "package_number": package_number
  };

  let data = {
    'method': 'deleteCourierPackage',
    'parameters': JSON.stringify(params)
  };

  res = await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })

  return res
}

async function getOrderPackages(orderID) {
  let params = {
    "order_id": orderID,
  };

  let data = {
    'method': 'getOrderPackages',
    'parameters': JSON.stringify(params)
  };
  resp = await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })

  return resp.data
}

async function getOrderPackagesDetails(orderIDs) {

  let params = {
    "package_ids": orderIDs,
  };

  let data = {
    'method': 'getCourierPackagesStatusHistory',
    'parameters': JSON.stringify(params)
  };
  resp = await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })

  return resp.data

}

async function createPackages(orderID, orderDetails) {

  //check what type of courier
  //if allegro check "courier" -create array
  //if paczkomaty get size from Form
  //if kurier inpost check
  //if dhl check
  //check if cod, add to "fields", calculate cod value
  //calculate insurance
  //if not paczkomaty prepare "package_fields"

  // checkCourier(fields,orderDetails)

  let fields = []
  let package_fields = []

  checkCourier(fields, orderDetails)
  checkIfCod(fields, orderDetails)
  getInsuranceValue(fields, orderDetails)

  console.log(fields)

  // fields.push(
  //   { id: "courier", value: "9685250" },
  //   { id: "package_type", value: "PACKAGE" },
  //   { id: "insurance", type: 42.85 },
  //   { id: "package_description", value: orderID },
  //   { id: "reference_number", value: orderID },
  //   //{ id: "cod",value:"tbd"}
  // )
  // package_fields.push(
  //   { weight: 2 },
  //   { size_length: 30 },
  //   { size_width: 40 },
  //   { size_height: 50 }
  // )

  // let params = {
  //   "order_id": orderID,
  //   "courier_code": "allegrokurier",
  //   "fields": fields,
  //   "packages": package_fields
  // };

  // let data = {
  //   'method': 'createPackage',
  //   'parameters': JSON.stringify(params)
  // };
  // var initdata = await axios
  //   .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

  // console.log(initdata)



  // // KONFIG INPOST paczkomaty
  //  fields.push(
  //   {id:"service",value:"detect_new"},
  //   {id: "size_type",value:"B", }, 
  //   {id:"insurance",type: 40 },
  //   //{ id: "cod",value:"tbd"}
  //   )

  // let params = {
  //   "order_id":orderID ,
  //   "courier_code":"paczkomaty",
  //   "fields" : fields,
  //   "packages": packages
  // };

  // let data = {
  //   'method': 'createPackage',
  //   'parameters': JSON.stringify(params)
  // };
  // var initdata = await axios
  //   .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

  //   console.log(initdata)


}

function checkCourier(fields, orderDetails) {


  if (orderDetails.orders[0].order_source === 'allegro') {
    if (orderDetails.orders[0].delivery_method === 'Allegro Paczkomaty InPost') {
      //ok
    } else if (orderDetails.orders[0].delivery_method === 'Allegro miniKurier24 InPost') {
      //ok
    } else if (orderDetails.orders[0].delivery_method === 'Allegro Kurier DPD'
      || orderDetails.orders[0].delivery_method === 'Allegro Kurier DPD pobranie'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie DPD Pickup'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie DPD Pickup pobranie'
      || orderDetails.orders[0].delivery_method.toString().includes("Allegro Kurier DPD")) {

      if (orderDetails.orders[0].delivery_country_code === 'PL') {
        //ID = 9685250

      } else if (orderDetails.orders[0].delivery_country_code !== 'PL') {
        //ID = 11436059
      } else {

      }


    } else if (orderDetails.orders[0].delivery_method === 'Allegro One Box') {

    } else if (orderDetails.orders[0].delivery_method === 'Allegro Kurier UPS') {
      //ID = 9685251


    } else if (orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie UPS') {

    } else {
      //TODO:
    }

  } else if (orderDetails.orders[0].order_source === 'shopee') {

  } else if (orderDetails.orders[0].order_source === 'empik') {

    if (orderDetails.orders[0].delivery_method === 'KURIER') {

    } else if (orderDetails.orders[0].delivery_method === 'Paczkomaty InPost') {

    } else if (orderDetails.orders[0].delivery_method === 'Kurier - płatność za pobraniem') {

    } else {
      //TODO:
    }

  } else if (orderDetails.orders[0].order_source === 'morele') {

    if (orderDetails.orders[0].delivery_method === 'Przesyłka kurierska') {

    } else if (orderDetails.orders[0].delivery_method === 'Paczkomaty InPost') {



    } else {
      //TODO:
    }

  } else if (orderDetails.orders[0].order_source === 'ceneo') {

    if (orderDetails.orders[0].delivery_method === 'Paczkomaty InPost, Płatność z góry,Przesyłka, Paczkomat płatność z góry') {

    } else if (orderDetails.orders[0].delivery_method === 'Kurier InPost, Płatność z góry,Przesyłka kurierska') {

    } else if (orderDetails.orders[0].delivery_method === 'Kurier - płatność za pobraniem') {

    } else {
      //TODO:
    }



  } else {
    //TOOD:
  }



}

function checkIfCod(fields, orderDetails) {

  console.log(orderDetails.orders[0])
  if (orderDetails.orders[0].payment_method_cod === '0') /// ????
  {
    return fields;
  } else {

    let codValue = 0

    for (let i = 0; i < orderDetails.orders[0].products.length; i++) {
      var quantity = orderDetails.orders[0].products[i].quantity
      var price = orderDetails.orders[0].products[i].price_brutto

      codValue += (quantity * price)
    }

    codValue += orderDetails.orders[0].delivery_price
    return fields.push({ id: "cod", value: codValue.toFixed(2) })

  }

}

function getInsuranceValue(fields, orderDetails) {
  let insuranceValue = 0

  for (let i = 0; i < orderDetails.orders[0].products.length; i++) {
    var quantity = orderDetails.orders[0].products[i].quantity
    var price = orderDetails.orders[0].products[i].price_brutto

    insuranceValue += (quantity * price)
  }

  return fields.push({ id: "insurance", value: insuranceValue.toFixed(2) })

}

async function markOrderWithStar(orderID) {

  let params = {
    "order_id": orderID,
    "extra_field_1": "api"
  };

  let data = {
    'method': 'setOrderFields',
    'parameters': JSON.stringify(params)
  };
  await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })

}

async function unmarkOrderWithStar(orderID) {

  let params = {
    "order_id": orderID,
    "extra_field_1": ""
  };

  let data = {
    'method': 'setOrderFields',
    'parameters': JSON.stringify(params)
  };
  await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })

}

async function getOrderDetails(orderID) {
  let params = {
    "order_id": orderID,
  };

  let data = {
    'method': 'getOrders',
    'parameters': JSON.stringify(params)
  };
  let info = await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })


  return info.data

}

async function sendEmail() {



}

async function moveOrderToProperCategory(orderID, orderSource) {

  let statusID = getCategoryStatus(orderSource)

  let params = {
    "order_id": orderID,
    "status_id": statusID
  };

  let data = {
    'method': 'setOrderStatus',
    'parameters': JSON.stringify(params)
  };
  let info = await axios
    .post('https://api.baselinker.com/connector.php', data, {
      headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' }
    })


  console.log(info.status)
}

async function getCategoryStatus(orderSource) {
  return sourceToCategoryArray[orderSource];
}


const sourceToCategoryArray = { "allegro": 161878, "shopee": 173349, "empik": 193321, "morele": 194350, "cenoe": 239827 }

module.exports = router