const express = require('express')
const router = express.Router()
const axios = require('axios')


router.get('/get', async (req, res) => {

  let order_id = req.body.order_id

 
    res.send("test");
})


router.get('/execute', async (req,res) =>{

  let orderID = 49514944

  //mark package with "api" in extrafield1

//create all nessesery packages
//unmark package
//move order to proper category
//send emails
 
  await getOrderDetails(orderID)

  // await markOrderWithStar(orderID)
  // await createPackages(orderID)
  // await unmarkOrderWithStar(orderID)

//  await unmarkOrderWithStar(orderID)
//  await moveOrderToProperCategory(orderID)
//  await sendEmail(orderID)

res.send("ok")

})

async function createPackages(orderID)
{

  let fields = []
  let package_fields = []

  fields.push(
  {id:"courier", value:"9685250"},
  {id:"package_type",value:"PACKAGE"},
  {id:"insurance",type: 42.85 },
  {id:"package_description", value:orderID},
  {id:"reference_number",value:orderID}
  )
  package_fields.push(
    {weight:2},
    {size_length:30},
    {size_width:40},
    {size_height:50}
  )

  let params = {
    "order_id":orderID ,
    "courier_code":"allegrokurier",
    "fields" : fields,
    "packages": package_fields
  };

  let data = {
    'method': 'createPackage',
    'parameters': JSON.stringify(params)
  };
  var initdata = await axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

    console.log(initdata)



    // KONFIG INPOST
    // fields.push({id:"service",value:"detect_new"},{id: "size_type",value:"B", }, {id:"insurance",type: 40 })

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

async function markOrderWithStar(orderID){

  let params = {
    "order_id": orderID,
    "extra_field_1":"api"
  };

  let data = {
    'method': 'setOrderFields',
    'parameters': JSON.stringify(params)
  };
   await axios
   .post('https://api.baselinker.com/connector.php', data, {
     headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

}

async function unmarkOrderWithStar(orderID){

  let params = {
    "order_id": orderID,
    "extra_field_1":""
  };

  let data = {
    'method': 'setOrderFields',
    'parameters': JSON.stringify(params)
  };
   await axios
   .post('https://api.baselinker.com/connector.php', data, {
     headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })

}

async function getOrderDetails(orderID)
{
  let params = {
    "order_id": orderID,
  };

  let data = {
    'method': 'getOrders',
    'parameters': JSON.stringify(params)
  };
 let info =   await axios
   .post('https://api.baselinker.com/connector.php', data, {
     headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })


     console.log(info.data.orders[0].products)

}

async function sendEmail()
{



}

module.exports = router