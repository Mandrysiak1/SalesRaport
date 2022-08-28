const express = require('express')
const router = express.Router()
const axios = require('axios')
const { ConsoleMessage } = require('puppeteer')
router.use(require('body-parser').json());

const {getOrderDetails,checkIfCod,getInsuranceValue} = require('./functions'); 
const { response } = require('express');



router.get('/add', async (req, res) => {

 // let orderID = 52505013
  
 let order_id = req.body.order_id
 let PaczkomatSize = req.body.paczkomatSize
 let deliveryMethod = req.body.deliveryMethod

  addPackage(orderID,PaczkomatSize,deliveryMethod)

  res.send("test");

})



router.post('/remove', async (req, res) => {

  let package_id = req.body.package_id
  let package_number = req.body.package_number
  let courier_code = req.body.courier_code

  let response = await removePackage(courier_code,package_id, package_number )

  console.log(courier_code,package_number,package_id)

  res.json(response);

})

router.get('/execute', async (req, res) => {

  let orderID = 54239464


  //mark package with "api" in extrafield1
  //create all nessesery packages
  //unmark package
  //move order to proper category
  //send emails

  let PaczkomatSize = "B"
 
  let orderDetails = await getOrderDetails(orderID)
  console.log(orderDetails)
  await markOrderWithStar(orderID)
  await createPackages(orderID,orderDetails,PaczkomatSize)
  await unmarkOrderWithStar(orderID)
  await moveOrderToProperCategory(orderID,orderDetails.orders[0].order_source)

  res.send("ok")

})


async function addPackage(orderID,PaczkomatSize,deliveryMethod) {

  let orderDetails = await getOrderDetails(orderID)

  orderDetails.orders[0].delivery_method = deliveryMethod
  
  await markOrderWithStar(orderID)
  
  await createPackages(orderID,orderDetails,PaczkomatSize)
  
  await unmarkOrderWithStar(orderID)

}



async function removePackage(courier_code, package_id, package_number) {

  console.log(courier_code,package_number,package_id)


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





async function createPackages(orderID, orderDetails,PaczkomatSize) {

  let fields = []

  await checkIfCod(fields, orderDetails)
  await getInsuranceValue(fields, orderDetails)
  await checkCourier(orderID,fields,orderDetails,PaczkomatSize)

  console.log(fields)

}

async function checkCourier(orderID, fields, orderDetails, packageSize) {

  let package_fields = []

  if (orderDetails.orders[0].order_source === 'allegro') {

    if (orderDetails.orders[0].delivery_method === 'Allegro Paczkomaty InPost') {
        
      // // KONFIG INPOST paczkomaty
        fields.push(
          {id:"service",value:"detect_new"},
          {id:"size_type",value:packageSize }
          )

        let params = {
          "order_id":orderID ,
          "courier_code":"paczkomaty",
          "fields" : fields,
        };

        let data = {
          'method': 'createPackage',
          'parameters': JSON.stringify(params)
        };
        var initdata = await axios
          .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

          console.log(initdata.data)


    } else if (orderDetails.orders[0].delivery_method === 'Allegro miniKurier24 InPost' 
    || orderDetails.orders[0].delivery_method === 'Allegro miniKurier24 InPost pobranie'
    || orderDetails.orders[0].delivery_method === 'Allegro Kurier24 InPost'
    || orderDetails.orders[0].delivery_method === 'Allegro Kurier24 InPost pobranie' ) {
        fields.push(
          {id:"service",value:"detect_new"},
          {id: "size_type",value:packageSize }
          )

          package_fields.push(
            { weight: 2 },
            { size_length: 30 },
            { size_width: 40 },
            { size_height: 50 }
          )

        let params = {
          "order_id":orderID ,
          "courier_code":"paczkomaty",
          "fields" : fields,
          "packages": package_fields
        };

        let data = {
          'method': 'createPackage',
          'parameters': JSON.stringify(params)
        };
        var initdata = await axios
          .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

          console.log(initdata.data)

    } else if (orderDetails.orders[0].delivery_method === 'Allegro Kurier DPD'
      || orderDetails.orders[0].delivery_method === 'Allegro Kurier DPD pobranie'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie DPD Pickup'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie DPD Pickup pobranie'
      || orderDetails.orders[0].delivery_method.toString().includes("Allegro Kurier DPD")) {

      if (orderDetails.orders[0].delivery_country_code === 'PL') {
        //ID = 9685250
         fields.push(
            { id: "courier", value: "9685250" },
            { id: "package_type", value: "PACKAGE" },
            { id: "package_description", value: orderID },
            { id: "reference_number", value: orderID },
          )
          package_fields.push(
            { weight: 2 },
            { size_length: 30 },
            { size_width: 40 },
            { size_height: 50 }
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
          var initdata = await axios
            .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

          console.log(initdata.data)
          console.log("dpd: " + "PL")


      } else if (orderDetails.orders[0].delivery_country_code !== 'PL') {
          //ID = 11436059
          fields.push(
            { id: "courier", value: "11436059" },
            { id: "package_type", value: "PACKAGE" },
            { id: "package_description", value: orderID },
            { id: "reference_number", value: orderID },
          )
          package_fields.push(
            { weight: 2 },
            { size_length: 30 },
            { size_width: 40 },
            { size_height: 50 }
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
          var initdata = await axios
            .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

          console.log(initdata.data)
      } else {
        console.log("else from allegro DPD")
      }


    } else if (orderDetails.orders[0].delivery_method === 'Allegro One Box') {
      //ID 17630958
      fields.push(
        { id: "courier", value: "17630958" },
        { id: "package_type", value: "PACKAGE" },
        { id: "package_description", value: orderID },
        { id: "reference_number", value: orderID },
      )
      package_fields.push(
        { weight: 2 },
        { size_length: 30 },
        { size_width: 40 },
        { size_height: 50 }
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
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

      console.log(initdata.data)

    }else if(orderDetails.orders[0].delivery_method === 'Allegro One Punkt'){

      fields.push(
        { id: "courier", value: "17630959" },
        { id: "package_type", value: "PACKAGE" },
        { id: "package_description", value: orderID },
        { id: "reference_number", value: orderID },
      )
      package_fields.push(
        { weight: 2 },
        { size_length: 30 },
        { size_width: 40 },
        { size_height: 50 }
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
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

      console.log(initdata.data)


    } else if (orderDetails.orders[0].delivery_method === 'Allegro Kurier UPS'
    || orderDetails.orders[0].delivery_method === 'Allegro Kurier UPS pobranie' 
    || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie UPS') {
      //ID = 9685251

      fields.push(
        { id: "courier", value: "9685251" },
        { id: "package_type", value: "PACKAGE" },
        { id: "package_description", value: orderID },
        { id: "reference_number", value: orderID },
      )
      package_fields.push(
        { weight: 2 },
        { size_length: 30 },
        { size_width: 40 },
        { size_height: 50 }
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
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

      console.log(initdata.data)


    } else if(orderDetails.orders[0].delivery_method === 'Allegro One (UPS)') {
     
      fields.push(
        { id: "courier", value: "11270948" },
        { id: "package_type", value: "PACKAGE" },
        { id: "package_description", value: orderID },
        { id: "reference_number", value: orderID },
      )
      package_fields.push(
        { weight: 2 },
        { size_length: 30 },
        { size_width: 40 },
        { size_height: 50 }
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
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

      console.log(initdata.data)

    }else {
      console.log("ELSE FROM ALLEGRO")
    }

  } else if (orderDetails.orders[0].order_source === 'shopee') {
    let params = {
      "order_id": orderID,
      "courier_code": "shopeelogistic",
    };

    let data = {
      'method': 'createPackage',
      'parameters': JSON.stringify(params)
    };
    var initdata = await axios
      .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

    console.log(initdata.data)

  } else if (orderDetails.orders[0].order_source === 'empik') {


    if (orderDetails.orders[0].delivery_method === 'KURIER' || orderDetails.orders[0].delivery_method === 'Kurier - płatność za pobraniem' ) {


      fields.push(
        {id:"service",value:"inpost_courier_standard"},
        {id: "package_description", value: orderID },
        {id:"services_additional", value: "email"}
        )

        package_fields = [
          { "weight": Number.parseFloat(3.0),
           "size_length": 30 ,
           "size_width": 40 ,
           "size_height": 50 ,
           "size_custom": 0}]

      let params = {
        "order_id":orderID ,
        "courier_code":"inpostkurier",
        "fields" : fields,
        "packages": package_fields
      };

      let data = {
        'method': 'createPackage',
        'parameters': JSON.stringify(params)
      };
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

        console.log(initdata.data)



    } else if (orderDetails.orders[0].delivery_method === 'Paczkomaty InPost') {

          // // KONFIG INPOST paczkomaty
          fields.push(
            {id:"service",value:"inpost_locker_standard"},
            {id:"size_type",value:packageSize }
            )
  
            package_fields = [
              { "weight": Number.parseFloat(3.0),
              "size_length": 30 ,
              "size_width": 40 ,
              "size_height": 50 ,
              "size_custom": 0}]

          let params = {
            "order_id":orderID ,
            "courier_code":"paczkomaty",
            "fields" : fields,
            "packages": package_fields
          };
  
          let data = {
            'method': 'createPackage',
            'parameters': JSON.stringify(params)
          };
          var initdata = await axios
            .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
  
            console.log(initdata.data)

    } else {
        console.log("ELSE FROM EMPIK")
    }

  } else if (orderDetails.orders[0].order_source === 'morele') {

    if (orderDetails.orders[0].delivery_method === 'Przesyłka kurierska') {

      fields.push(
        {id:"service",value:"inpost_courier_standard"},
        {id: "package_description", value: orderID },
        {id:"services_additional", value: "email"}
        )

        package_fields = [
          { "weight": Number.parseFloat(3.0),
           "size_length": 30 ,
           "size_width": 40 ,
           "size_height": 50 ,
           "size_custom": 0}]

      let params = {
        "order_id":orderID ,
        "courier_code":"inpostkurier",
        "fields" : fields,
        "packages": package_fields
      };

      let data = {
        'method': 'createPackage',
        'parameters': JSON.stringify(params)
      };
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

        console.log(initdata.data)


    } else if (orderDetails.orders[0].delivery_method === 'Paczkomaty InPost') {

    // // KONFIG INPOST paczkomaty
    fields.push(
      {id:"service",value:"inpost_locker_standard"},
      {id:"size_type",value:packageSize }
      )

      package_fields = [
        { "weight": Number.parseFloat(3.0),
         "size_length": 30 ,
         "size_width": 40 ,
         "size_height": 50 ,
         "size_custom": 0}]

    let params = {
      "order_id":orderID ,
      "courier_code":"paczkomaty",
      "fields" : fields,
      "packages": package_fields
    };

    let data = {
      'method': 'createPackage',
      'parameters': JSON.stringify(params)
    };
    var initdata = await axios
      .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

      console.log(initdata.data)

    } else {
      console.log("ELSE FROM MORELE")
    }

  } else if (orderDetails.orders[0].order_source === 'ceneo') {

    if (orderDetails.orders[0].delivery_method === 'Paczkomaty InPost, Płatność z góry,Przesyłka, Paczkomat płatność z góry') {

      fields.push(
        {id:"service",value:"inpost_locker_standard"},
        {id:"size_type",value:packageSize }
        )

        package_fields = [
          { "weight": Number.parseFloat(3.0),
           "size_length": 30 ,
           "size_width": 40 ,
           "size_height": 50 ,
           "size_custom": 0}]

  
      let params = {
        "order_id":orderID ,
        "courier_code":"paczkomaty",
        "fields" : fields,
        "packages": package_fields
      };
  
      let data = {
        'method': 'createPackage',
        'parameters': JSON.stringify(params)
      };
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
  
        console.log(initdata.data)

    } else if (orderDetails.orders[0].delivery_method === 'Kurier InPost, Płatność z góry,Przesyłka kurierska' || orderDetails.orders[0].delivery_method === "Kurier InPost, Płatność przy odbiorze,Przesyłka kurierska pobraniowa") {

      fields.push(
        {id:"service",value:"inpost_courier_standard"},
        {id: "package_description", value: orderID },
        {id:"services_additional", value: "email"}
        )

        package_fields = [
          { "weight": Number.parseFloat(3.0),
           "size_length": 30 ,
           "size_width": 40 ,
           "size_height": 50 ,
           "size_custom": 0}]

      let params = {
        "order_id": orderID ,
        "courier_code": "inpostkurier",
        "fields" : fields,
        "packages": package_fields
      };

      let data = {
        'method': 'createPackage',
        'parameters': JSON.stringify(params)
      };
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

        console.log(initdata.data)


    } else if (orderDetails.orders[0].delivery_method === 'Kurier - płatność za pobraniem') {
      fields.push(
        {id:"service",value:"inpost_courier_standard"},
        {id: "package_description", value: orderID },
        {id:"services_additional", value: "email"}
        )

        package_fields = [
          { "weight": Number.parseFloat(3.0),
           "size_length": 30 ,
           "size_width": 40 ,
           "size_height": 50 ,
           "size_custom": 0}]

      let params = {
        "order_id":orderID ,
        "courier_code":"inpostkurier",
        "fields" : fields,
        "packages": package_fields
      };

      let data = {
        'method': 'createPackage',
        'parameters': JSON.stringify(params)
      };
      var initdata = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

        console.log(initdata.data)


    } else {
      console.log("ELSE FROM CENEO")
    }



  } else {
    console.log("ELSE FROM CREATE PACKAGE")

  }



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

  console.log("orderSource from moveorder: " + orderSource )
  let statusID = getCategoryStatus(orderSource)
  console.log("statusID from moveorder: " + statusID )

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