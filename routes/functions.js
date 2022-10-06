const axios = require('axios');
const e = require('express');


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
  function getRawInsuranceValue(orderDetails) {
   
    let insuranceValue = 0
  
    for (let i = 0; i < orderDetails.orders[0].products.length; i++) {
      var quantity = orderDetails.orders[0].products[i].quantity
      var price = orderDetails.orders[0].products[i].price_brutto
  
      insuranceValue += (quantity * price)
    }
  
    return insuranceValue.toFixed(2)
  
  }

  function getDefaultShipmentMethod(orderDetails)
  {
    console.log("ODER OSURCE: "  +  orderDetails.orders[0].order_source)

    if (orderDetails.orders[0].order_source === 'empik') {

      if (orderDetails.orders[0].delivery_method === 'KURIER' || orderDetails.orders[0].delivery_method === 'Kurier - płatność za pobraniem' ) {
        return {tab:'inpost',value:'Przesyłka kurierska standardowa'}
      }else if(orderDetails.orders[0].delivery_method === 'Paczkomaty InPost')
      {
        return {tab:'paczkomaty',value:'Paczkomaty 24/7 - Przesyłka standardowa'}
      }else{
        return {tab:'idk',value: 'idk_from_empik'}
      }
    
    }else if(orderDetails.orders[0].order_source === 'morele'){

      if (orderDetails.orders[0].delivery_method === 'Przesyłka kurierska') {
        return {tab:'inpost',value:'Przesyłka kurierska standardowa'}
      }else if(orderDetails.orders[0].delivery_method === 'Paczkomaty InPost'){
        return {tab:'paczkomaty',value:'Paczkomaty 24/7 - Przesyłka standardowa'}
      }else{
        return {tab:'idk',value: 'idk_from_morele'}
      }

    }else if(orderDetails.orders[0].order_source === 'ceneo'){
      if (orderDetails.orders[0].delivery_method === 'Kurier InPost, Płatność z góry,Przesyłka kurierska' || orderDetails.orders[0].delivery_method === 'Kurier InPost, Płatność przy odbiorze,Przesyłka kurierska pobraniowa' ) {
        return {tab:'inpost',value:'Przesyłka kurierska standardowa'}
      }else if(orderDetails.orders[0].delivery_method === 'Paczkomaty InPost, Płatność z góry,Przesyłka, Paczkomat płatność z góry'){
        return {tab:'paczkomaty',value:'Paczkomaty 24/7 - Przesyłka standardowa'}
      }else{
        return {tab:'idk',value: 'idk_from_ceneo'}
      }
    
    }else if(orderDetails.orders[0].order_source === 'allegro')
    {
      if (orderDetails.orders[0].delivery_method === 'Allegro Kurier DPD'
      || orderDetails.orders[0].delivery_method === 'Allegro Kurier DPD pobranie'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie DPD Pickup'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie DPD Pickup pobranie'
      || orderDetails.orders[0].delivery_method.toString().includes("Allegro Kurier DPD")) {

        if (orderDetails.orders[0].delivery_country_code === 'PL') {
          return {tab:'allegro',value:'Allegro DPD'}
        }else if(orderDetails.orders[0].delivery_country_code !== 'PL'){
          return {tab:'allegro',value:'Allegro DPD za granice'}
        }

        
      }else if (orderDetails.orders[0].delivery_method === 'Allegro Kurier UPS' 
      || orderDetails.orders[0].delivery_method === 'Allegro Kurier UPS pobranie'
      || orderDetails.orders[0].delivery_method === 'Allegro Odbiór w Punkcie UPS'){
        return {tab:'allegro',value:'Allegro UPS'}
      }else if(orderDetails.orders[0].delivery_method === 'Allegro One Box'){
        return {tab:'allegro',value:'Allegro One Box (One Kurier)'}
      }else if(orderDetails.orders[0].delivery_method === 'Allegro One Punkt'){
        return {tab:'allegro',value:'Allegro One Punkt (One Kurier)'}
      }else if (orderDetails.orders[0].delivery_method === 'Allegro Paczkomaty InPost'){
        return {tab:'paczkomaty',value:'Allegro Paczkomaty 24/7 InPost'}
      }else if (orderDetails.orders[0].delivery_method === 'Allegro miniKurier24 InPost' || orderDetails.orders[0].delivery_method === 'Allegro miniKurier24 InPost pobranie'){
        return {tab:'paczkomaty',value:'Allegro miniKurier24 InPost'}
      }else if (orderDetails.orders[0].delivery_method === 'Allegro Kurier24 InPost' || orderDetails.orders[0].delivery_method === 'Allegro Kurier24 InPost pobranie'){
        return {tab:'paczkomaty',value:'Allegro Kurier24 InPost'}
      }else{
        return {tab:'idk',value: 'idk_from_allegro'}
      }
    }else if(orderDetails.orders[0].order_source === 'shop'){

      if (orderDetails.orders[0].delivery_method === 'Przesyłka kurierska InPost Kurier Standard') {
        return {tab:'inpost',value:'Przesyłka kurierska standardowa'}
      }else if (orderDetails.orders[0].delivery_method === 'Przesyłka kurierska InPost Kurier Standard-Płatność za pobraniem') {
        return {tab:'inpost',value:'Przesyłka kurierska standardowa'}
      }else if(orderDetails.orders[0].delivery_method === 'Przesyłka paczkomatowa - standardowa'){
        return {tab:'paczkomaty',value:'Paczkomaty 24/7 - Przesyłka standardowa'}
      }else{
        return {tab:'idk',value: 'idk_from_shop'}
      }
    }
    else{
      return {tab:'idk',value: 'idk'}
    }

  }

  module.exports = {
    getOrderDetails : getOrderDetails,
    getOrderPackagesDetails : getOrderPackagesDetails,
    getOrderPackages:getOrderPackages,
    getInsuranceValue: getInsuranceValue,
    getRawInsuranceValue: getRawInsuranceValue,
    getDefaultShipmentMethod:getDefaultShipmentMethod,
    checkIfCod : checkIfCod
  }

