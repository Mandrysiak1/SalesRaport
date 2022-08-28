const express = require('express')
const router = express.Router()
const axios = require('axios')
const { ConsoleMessage } = require('puppeteer')
router.use(require('body-parser').json());

const { getOrderDetails, checkIfCod, getInsuranceValue } = require('./functions');



router.post('/create', async (req, res) => {
  console.log("req",req.body.przesylka )

  let orderID = req.body.orderId
  //let deliveryMethod = req.body.deliveryMethod
  let deliveryMethod = 'Allegro DPD'
  let cod = req.body.przesylka.data.find(el => el.name === 'cod').value
  let insurance = req.body.przesylka.data.find(el => el.name === 'insurance').value
  // let contents = req.body.przesylka.find(el => el.name === 'contents').value
  // let refnumber = req.body.przesylka.find(el => el.name === 'refnumber').value
  let packageSize = '';
  if((req.body.przesylka.data.find(el => el.name === 'size')) != undefined)
  {
    packageSize = req.body.przesylka.data.find(el => el.name === 'size').value
  }
  let dimensions = req.body.przesylka.dimensions;
  // console.log("oid: " + order_id)
  // console.log("paczkomatSize " + req.body.przesylka[0].value)
   console.log("devMethod " + deliveryMethod)
  // console.log("cod " + cod)
  // console.log("insurance " + insurance)

  let resp = await addPackage(orderID, packageSize, dimensions, deliveryMethod, cod, insurance)

  console.log(resp)

  res.json(resp);

})



router.post('/remove', async (req, res) => {

  let package_id = req.body.package_id
  let package_number = req.body.package_number
  let courier_code = req.body.courier_code

  let response = await removePackage(courier_code, package_id, package_number)

  console.log(courier_code, package_number, package_id)

  res.json(response);

})


async function addPackage(orderID, packageSize, dimensions, deliveryMethod, cod, insurance) {

  try {

    await markOrderWithStar(orderID)

    let res = await createPackages(orderID, packageSize, dimensions, deliveryMethod, cod, insurance)

    await unmarkOrderWithStar(orderID)

    return res
  } catch (exception) {
    console.log(exception)
    return "fail"
  } finally {
    await unmarkOrderWithStar(orderID)
  }



}



async function createPackages(orderID, packageSize, dimensions, deliveryMethod, cod, insurance) {

  if (deliveryMethod === 'Allegro DPD') {
    return await sendAllegroCourier(orderID, deliveryMethod, dimensions, cod, insurance)
  } else if (deliveryMethod === 'Allegro UPS') {
    return await sendAllegroCourier(orderID, deliveryMethod, dimensions, cod, insurance)
  } else if (deliveryMethod === 'Allegro DPD z granicę') {
    return await sendAllegroCourier(orderID, deliveryMethod, dimensions, cod, insurance)
  } else if (deliveryMethod === 'Allegro One Punkt (One Kurier)') {
    return await sendAllegroCourier(orderID, deliveryMethod, dimensions, cod, insurance)
  } else if (deliveryMethod === 'Allegro One Box (One Kurier)') {
    return await sendAllegroCourier(orderID, deliveryMethod, dimensions, cod, insurance)
  } else if (deliveryMethod === 'Paczkomaty 24/7 - Przesyłka standardowa') {
    return await sendInpostPaczkomat(orderID, packageSize, cod, insurance)
  } else if (deliveryMethod === 'Allegro Paczkomaty 24/7 InPost') {
    return await sendAllegroInpost(orderID, packageSize, cod, insurance)
  } else if (deliveryMethod === 'Allegro miniKurier24 Inpost') {
    return await sendAllegroInpost(orderID, packageSize, cod, insurance)
  } else if (deliveryMethod === 'Allegro Kurier24 Inpost') {
    return await sendAllegroInpost(orderID, packageSize, cod, insurance)
  } else if (deliveryMethod === 'Przesyłka kurierska standardowa') {
    return await sendInpostCourier(orderID, dimensions, cod, insurance)
  } else {
    console.log("tu")
    return "fail"
  }

}

async function sendAllegroInpost(orderID, packageSize, cod, insurance) {
  let fields = []

  fields.push(
    { id: "service", value: "detect_new" },
    { id: "size_type", value: packageSize },
    { id: "insurance", value: insurance }
  )
  if (cod != '') {
    fields.push({ id: "cod", value: cod })
  }

  let params = {
    "order_id": orderID,
    "courier_code": "paczkomaty",
    "fields": fields,
  };

  let data = {
    'method': 'createPackage',
    'parameters': JSON.stringify(params)
  };
  var res = await axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

  console.log(res.data)

  return res.data.status === 'SUCCESS' ? "success" : "fail"

}

async function sendInpostPaczkomat(orderID, packageSize, cod, insurance) {
  let fields = []

  fields.push(
    { id: "service", value: "inpost_locker_standard" },
    { id: "size_type", value: packageSize },
    { id: "services_additional", value: "email" },
    { id: "insurance", value: insurance }
  )
  if (cod != '') {
    fields.push({ id: "cod", value: cod })
  }

  let params = {
    "order_id": orderID,
    "courier_code": "paczkomaty",
    "fields": fields,
  };

  let data = {
    'method': 'createPackage',
    'parameters': JSON.stringify(params)
  };
  var res = await axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

  console.log(res.data)

  return res.data.status === 'SUCCESS' ? "success" : "fail"
}

async function sendInpostCourier(orderID, dimensions, cod, insurance) {

  let weight = dimensions.find(el => el.dimension === 'weight').value
  let length = dimensions.find(el => el.dimension === 'weight').lengh
  let width = dimensions.find(el => el.dimension === 'width').value
  let height = dimensions.find(el => el.dimension === 'height').value
  let fields = []
  let package_fields = []
  fields.push(
    { id: "service", value: "inpost_courier_standard" },
    { id: "package_description", value: orderID },
    { id: "services_additional", value: "email" },
    { id: "insurance", value: insurance }
  )
  if (cod != '') {
    fields.push({ id: "cod", value: cod })
  }

  package_fields = [
    {
      "weight": weight,
      "size_length": length,
      "size_width": width,
      "size_height": height,
      "size_custom": 0
    }]

  let params = {
    "order_id": orderID,
    "courier_code": "inpostkurier",
    "fields": fields,
    "packages": package_fields
  };

  let data = {
    'method': 'createPackage',
    'parameters': JSON.stringify(params)
  };
  var res = await axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

  console.log(res.data)

  return res.data.status === 'SUCCESS' ? "success" : "fail"
}

async function sendAllegroCourier(orderID, deliveryMethod, dimensions, cod, insurance) {

  let weight = dimensions.find(el => el.dimension === 'weight').value
  let length = dimensions.find(el => el.dimension === 'weight').lengh
  let width = dimensions.find(el => el.dimension === 'width').value
  let height = dimensions.find(el => el.dimension === 'height').value

  let id = getAllegroID(deliveryMethod)

  let fields = []
  let package_fields = []
  
  fields.push(
    { id: "courier", value: id },
    { id: "package_type", value: "PACKAGE" },
    { id: "package_description", value: orderID },
    { id: "reference_number", value: orderID },
    { id: "insurance", value: insurance }
  )
  if (cod != '') {
    fields.push({ id: "cod", value: cod })
  }
  package_fields.push(
    { weight: weight },
    { size_length: length },
    { size_width: width },
    { size_height: height }
  )

  let params = {
    "order_id": orderID,
    "courier_code": "allegrokurier",
    "fields": fields,
    "packages": package_fields
  };

  let data = {
    'method': 'createPackage',
    'parameters': JSON.stringify(params)
  };
  var res = await axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

  console.log(res.data)

  return res.data.status === 'SUCCESS' ? "success" : "fail"
}

async function getAllegroID(deliveryMethod) {

  if (deliveryMethod === 'Allegro DPD') {

    return 9685250

  } else if (deliveryMethod === 'Allegro UPS') {

    return 9685251

  } else if (deliveryMethod === 'Allegro DPD z granicę') {

    return 11436059

  } else if (deliveryMethod === 'Allegro One Punkt (One Kurier)') {

    return 17630959

  } else if (deliveryMethod === 'Allegro One Box (One Kurier)') {

    return 17630958
  } else return -1



}
async function removePackage(courier_code, package_id, package_number) {

  console.log(courier_code, package_number, package_id)


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


  return res.data.status === 'SUCCESS' ? "success" : "fail"
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

async function sendEmail() {



}
async function moveOrderToProperCategory(orderID, orderSource) {

  console.log("orderSource from moveorder: " + orderSource)
  let statusID = getCategoryStatus(orderSource)
  console.log("statusID from moveorder: " + statusID)

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


  console.log("status changes: " + info.status)
}

function getCategoryStatus(orderSource) {
  return sourceToCategoryArray[orderSource];
}
const sourceToCategoryArray = { "allegro": 161878, "shopee": 173349, "empik": 193321, "morele": 194350, "ceneo": 239827 }

module.exports = router