const axios = require('axios')


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


  module.exports = {
    getOrderDetails : getOrderDetails,
    getOrderPackagesDetails : getOrderPackagesDetails,
    getOrderPackages:getOrderPackages,
  }

