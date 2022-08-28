const express = require('express')
const router = express.Router()
const { ConsoleMessage } = require('puppeteer')

const {getOrderDetails,getOrderPackages,getOrderPackagesDetails} = require('./functions') 

const trackingStatuses = ["Unknown", "Courier label created", "Shipped", "Not delivered", "Out for delivery", "Delivered", "Return", "Aviso", "Waiting at point", "Lost", "Canceled", "On the way"]



router.get('/:id', async (req, res) => {
    // let orderID = 52761486
    // let orderID = 53295197
   //let orderID = 54117102
   // let orderID = 54267460

    orderID = id
    let orderDetails =  await getOrderDetails(orderID)
  
    // console.log(orderDetails)
    // console.log(orderDetails.orders[0].products);
  
  
    let orderPackages =  await getOrderPackages(orderID)
  
    var tempadd = []
  
    for (let index = 0; index < orderPackages.packages.length ; index++) {
  
      tempadd.push (orderPackages.packages[index].package_id)
      
    }
  
    console.log(orderPackages)
   
  
    let orderPackagesDetails = await getOrderPackagesDetails(tempadd)
    if(orderPackagesDetails.packages_history && orderPackagesDetails.packages_history.length > 0 ){

        for (let index = 0; index < Object.keys(orderPackagesDetails.packages_history).length ; index++) {
        let objindex = Object.keys(orderPackagesDetails.packages_history)[index]
        for (let inner_index = 0; inner_index < orderPackagesDetails.packages_history[objindex].length; inner_index++) {
            const element = orderPackagesDetails.packages_history[objindex][inner_index];
            console.log(element);
        } 
        }
    }else{

    }
  
   // console.log(orderPackagesDetails);
  
  
    for(let i = 0 ; i < orderPackages.packages.length; i++) {
      let obj = orderPackagesDetails.packages_history;

      

      if(obj && obj.length === 0) {
        orderPackages.packages[i].data_nadania = new Date(orderPackages.packages[i].tracking_status_date * 1000);
      } else {
        orderPackages.packages[i].data_nadania = new Date(orderPackagesDetails.packages_history[Object.keys(orderPackagesDetails.packages_history)[i]][0].tracking_status_date * 1000);
      }
      orderPackages.packages[i].status = trackingStatuses[orderPackages.packages[i].tracking_status];
      orderPackages.packages[i].package_number = orderPackages.packages[i].courier_package_nr;
    }
  
   // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
   // console.log(orderPackages);
    
    // if()
  
    res.render('shipments', {
      orderDetails: orderDetails.orders[0],
      defaultShipmentMethod : {}
      //cod:
      //insurance:
      orderPackages: orderPackages,
      deletePackage: "deletePackage"
    });
  });

  module.exports = router