const express = require('express')
const axios = require('axios')
const fetch = require('node-fetch')
const csv = require('csv-parser')
const fs = require('fs')
const { cache } = require('ejs')
const { response } = require('express')

const router = express.Router()


var clientID = "b889493ad9f5475589913ed85f27aa43"
var clientSecret = "aob8tISmc2a8wXR0xiqVCGRwX3AepG8dWKgJZ2eK2rHLPQfhnnfexM45D5n1Uyz0"
var device_code = 'HXWX1IZzdbLKDs1GHY8JmHIWgBi05CcD'
var access_token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjU4ODQ2MjcsInVzZXJfbmFtZSI6IjQxMjgxOTM0IiwianRpIjoiZGY4MTA1M2YtZjIzZC00NWFjLTgzODUtODljYWY2MDNmMDVmIiwiY2xpZW50X2lkIjoiYjg4OTQ5M2FkOWY1NDc1NTg5OTEzZWQ4NWYyN2FhNDMiLCJzY29wZSI6WyJhbGxlZ3JvOmFwaTpvcmRlcnM6cmVhZCIsImFsbGVncm86YXBpOnByb2ZpbGU6d3JpdGUiLCJhbGxlZ3JvOmFwaTpzYWxlOm9mZmVyczp3cml0ZSIsImFsbGVncm86YXBpOmJpbGxpbmc6cmVhZCIsImFsbGVncm86YXBpOmNhbXBhaWducyIsImFsbGVncm86YXBpOmRpc3B1dGVzIiwiYWxsZWdybzphcGk6c2FsZTpvZmZlcnM6cmVhZCIsImFsbGVncm86YXBpOmJpZHMiLCJhbGxlZ3JvOmFwaTpvcmRlcnM6d3JpdGUiLCJhbGxlZ3JvOmFwaTphZHMiLCJhbGxlZ3JvOmFwaTpwYXltZW50czp3cml0ZSIsImFsbGVncm86YXBpOnNhbGU6c2V0dGluZ3M6d3JpdGUiLCJhbGxlZ3JvOmFwaTpwcm9maWxlOnJlYWQiLCJhbGxlZ3JvOmFwaTpyYXRpbmdzIiwiYWxsZWdybzphcGk6c2FsZTpzZXR0aW5nczpyZWFkIiwiYWxsZWdybzphcGk6cGF5bWVudHM6cmVhZCIsImFsbGVncm86YXBpOm1lc3NhZ2luZyJdLCJhbGxlZ3JvX2FwaSI6dHJ1ZX0.hVvrJT9uj-rKeh-xBws1T1d3F71wSPa-6BJhMRxVkRsZU5RVvLIdBtldCuW58IGG9ADDODOHAJYBv-zT_gPO4JVwej7mLisj-gaJp6Dew023B-E_tg5kRjXDV8ncCLwEBfC2T9O8C2KAINY4CHns7otNewm8zO7-d2DYuRFnDf-P15qSHlzrNCDBsRTJqeSnQSutAwrzxGmwZzr_nh2G6qngpfHjYFF-HUgQVyEWtAhodLLZ5ExjShMY-bucw-5hUu25VZ905l6TIwiy2Q2rDJYLyUaGn9LdU-chM72j9n1TI8Mf_zhoc8AgvH79GGDi_tBQKvGa1lrhm1d2XBovdQ'
var refreshToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiI0MTI4MTkzNCIsInNjb3BlIjpbImFsbGVncm86YXBpOm9yZGVyczpyZWFkIiwiYWxsZWdybzphcGk6cHJvZmlsZTp3cml0ZSIsImFsbGVncm86YXBpOnNhbGU6b2ZmZXJzOndyaXRlIiwiYWxsZWdybzphcGk6YmlsbGluZzpyZWFkIiwiYWxsZWdybzphcGk6Y2FtcGFpZ25zIiwiYWxsZWdybzphcGk6ZGlzcHV0ZXMiLCJhbGxlZ3JvOmFwaTpzYWxlOm9mZmVyczpyZWFkIiwiYWxsZWdybzphcGk6YmlkcyIsImFsbGVncm86YXBpOm9yZGVyczp3cml0ZSIsImFsbGVncm86YXBpOmFkcyIsImFsbGVncm86YXBpOnBheW1lbnRzOndyaXRlIiwiYWxsZWdybzphcGk6c2FsZTpzZXR0aW5nczp3cml0ZSIsImFsbGVncm86YXBpOnByb2ZpbGU6cmVhZCIsImFsbGVncm86YXBpOnJhdGluZ3MiLCJhbGxlZ3JvOmFwaTpzYWxlOnNldHRpbmdzOnJlYWQiLCJhbGxlZ3JvOmFwaTpwYXltZW50czpyZWFkIiwiYWxsZWdybzphcGk6bWVzc2FnaW5nIl0sImFsbGVncm9fYXBpIjp0cnVlLCJhdGkiOiJkZjgxMDUzZi1mMjNkLTQ1YWMtODM4NS04OWNhZjYwM2YwNWYiLCJleHAiOjE2NzM2MTc0MjcsImp0aSI6IjkwYjNmYmRiLTc2YjctNDYxYi1hZGJiLWU2OTJlNzFlODk1YyIsImNsaWVudF9pZCI6ImI4ODk0OTNhZDlmNTQ3NTU4OTkxM2VkODVmMjdhYTQzIn0.szEo_oGMcPJnumkOBIyOgSXDw9-m7j0crSZwUGgcZ2rUdz5YpvVXSF5bmUHqr9kUM4brNBNtGCXPPPd-Q_zeDmt1BzbfSoY8zfeydYMpb2_YcskgLagTMWakfCd1Ct_NSwfjtMvPEF1VSsgjlCt7yQGzpAq6fn_L-FyTyIYr_RPm7fw0LTOQYd4RzPsE4e-EWDIfb0QD6n0A8MvS3IKfi7sH9KT1JucruuCMHgCSBXZEsTnRhDZg0jDsscdhxKF-b1P5OgB9hcyi1ZQL4ReHLmewqiHRRgu1ycrpTpFVkK1-LePEzImZ8_PeYOVL2cQrPjo8QX9kF8rENTOMLFBB0Q' 

  router.get('/login', async (req, res) => {

   await readCSV()
   
    
  })


  async function readCSV()
  {
    const results = [];
    csv();
    csv(['Name', 'Age']);

    fs.createReadStream('export.csv')
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log(results);

    });
  }

  async function login() {
 
    try {
      

    // let params = {
    //   "order_id": orderID,
    //   "status_id": statusID
    // };
  
    // let data = {
    //   'method': 'setOrderStatus',
    //   'parameters': JSON.stringify(params)
    // };

    var url = 'https://allegro.pl/auth/oauth/device?client_id=b889493ad9f5475589913ed85f27aa43'

    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(response => response.json()).then((data) => console.log(data)).catch(function(error) {
      console.log(error);
  });

    // let info = await axios
    //   .get('https://allegro.pl/auth/oauth/authorize', {
    //     headers: { "basic": Buffer.from(clientID + ':' + clientSecret).toString("base64")}
    //   })
  
    //   console.log("co to juet asjest ?" + info.body());
    // } catch (error) {
    //   console.log( error)
    // }
  }catch(error){
    console.log( error )
  }
 

  async function refreshToken()
  {

  }

    

  }



  async function calculateFee()
  {

    data = {"offer": {
      "name": "Przykładowa oferta",
      "category": {
          "id": "79419"
      },
      "product": null,
      "parameters": [
          {
              "id": "11323",
              "valuesIds": [
                  "11323_246514"
              ],
              "values": [],
              "rangeValue": null
          },
          {
              "id": "223489",
              "valuesIds": [],
              "values": [
                  "Autor"
              ],
              "rangeValue": null
          },
          {
              "id": "223541",
              "valuesIds": [
                  "223541_491585"
              ],
              "values": [],
              "rangeValue": null
          },
          {
              "id": "223545",
              "valuesIds": [],
              "values": [
                  "Sample"
              ],
              "rangeValue": null
          },
          {
              "id": "245669",
              "valuesIds": [],
              "values": [
                  "9780000000057"
              ],
              "rangeValue": null
          },
          {
              "id": "74",
              "valuesIds": [],
              "values": [
                  "2015"
              ],
              "rangeValue": null
          },
          {
              "id": "7773",
              "valuesIds": [
                  "7773_2"
              ],
              "values": [],
              "rangeValue": null
          }
      ],
      "customParameters": null,
      "ean": "9780000000057",
      "description": {
          "sections": [
              {
                  "items": [
                      {
                          "type": "TEXT",
                          "content": "<p>Pzykładowy opis</p>"
                      }
                  ]
              }
          ]
      },
      "compatibilityList": null,
      "tecdocSpecification": null,
      "images": [
          {
              "url": "https://a.allegroimg.allegrosandbox.pl/original/116421/ece7111d4b8fbbc4662ab92f84ce"
          }
      ],
      "sellingMode": {
          "format": "BUY_NOW",
          "price": {
              "amount": "50",
              "currency": "PLN"
          },
          "startingPrice": null,
          "minimalPrice": null,
          "netPrice": null
      },
      "tax": null,
      "stock": {
          "available": 1,
          "unit": "UNIT"
      },
      "publication": {
          "duration": null,
          "status": "ACTIVE",
          "startingAt": null,
          "endingAt": null,
          "endedBy": null,
          "republish": false
      },
      "delivery": {
          "shippingRates": {
              "id": "17221a3c-f4cf-4e47-953a-8e125013b014"
          },
          "handlingTime": "PT336H",
          "additionalInfo": "",
          "shipmentDate": null
      },
      "payments": {
          "invoice": "NO_INVOICE"
      },
      "discounts": null,
      "afterSalesServices": {
          "impliedWarranty": {
              "id": "f86078a6-9f42-4b76-9696-1e5c0646a60a"
          },
          "returnPolicy": {
              "id": "47101223-7236-4201-9779-316e6d10af2a"
          },
          "warranty": null
      },
      "additionalServices": null,
      "sizeTable": null,
      "fundraisingCampaign": null,
      "promotion": {
          "emphasized": true,
          "bold": false,
          "highlight": false,
          "departmentPage": false,
          "emphasizedHighlightBoldPackage": false
      },
      "location": {
          "countryCode": "PL",
          "province": "WIELKOPOLSKIE",
          "city": "Poznań",
          "postCode": "66-166"
      },
      "external": null,
      "attachments": [],
      "contact": null,
      "validation": {
          "errors": [],
          "warnings": [],
          "validatedAt": "2020-12-04T09:31:07.684Z"
      },
      "createdAt": "2020-10-01T05:44:23.000Z",
      "updatedAt": "2020-12-04T09:31:08.925Z"
  }}


    try {

      var url = 'https://api.allegro.pl/pricing/offer-fee-preview'
    
      fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json',
          'Authorization': 'Bearer '+ access_token,
          'Accept-Language': 'PL'
      },
        body: JSON.stringify(data)
      }).then(response => response.json()).then((data) => console.log(data.commissions))
    
    
    }catch(error){
      console.log("xd" +  error )
    }
  }

  async function login2() {

    try {

    clientID = "b889493ad9f5475589913ed85f27aa43"
    clientSecret = "aob8tISmc2a8wXR0xiqVCGRwX3AepG8dWKgJZ2eK2rHLPQfhnnfexM45D5n1Uyz0"
  
    // let params = {
    //   "order_id": orderID,
    //   "status_id": statusID
    // };
  
    // let data = {
    //   'method': 'setOrderStatus',
    //   'parameters': JSON.stringify(params)
    // };
  
    var device_code = 'HXWX1IZzdbLKDs1GHY8JmHIWgBi05CcD'
    var url = 'https://allegro.pl/auth/oauth/token?grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=HXWX1IZzdbLKDs1GHY8JmHIWgBi05CcD'
  
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(response => response.json()).then((data) => console.log(data)).catch(function(error) {
      console.log(error);
  });
  
  
  }catch(error){
    console.log( error )
  }
  
  }

  module.exports = router