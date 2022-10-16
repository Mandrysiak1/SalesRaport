const express = require('express')
const axios = require('axios')
const fetch = require('node-fetch')
const https = require('https');
const csv = require('csv-parser')
const fs = require('fs')
const mysql = require(`mysql-await`);

const { cache } = require('ejs')
const { response } = require('express');
const { error } = require('console');
const { resolve } = require('path');

const router = express.Router()


var clientID = "b889493ad9f5475589913ed85f27aa43"
var clientSecret = "aob8tISmc2a8wXR0xiqVCGRwX3AepG8dWKgJZ2eK2rHLPQfhnnfexM45D5n1Uyz0"
var device_code = 'HXWX1IZzdbLKDs1GHY8JmHIWgBi05CcD'
var access_token = ''
var refreshToken = '' 

  router.get('/login', async (req, res) => {

   await updateLoginData()
   await refreshTokenfun()
   await updateLoginData()
  // console.log("at ",access_token)
  // console.log("rt ",refreshToken)
   await idk() 
   res.send("eo");

    
  })


  async function getCSV()
  {
    let url ='https://panel-d.baselinker.com/offers_export.php?hash=3013293029fa3b612a3311b4273b4c603185a32'
    https.get(url,(res) => {
        // Image will be stored at this path
        const path = `${__dirname}/export.csv`; 
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish',() => {
            filePath.close();
            console.log('Download Completed'); 
        })
    })
  }

  async function readCSV()
  {
    const results = [];

    const path = `${__dirname}/export.csv`; 

    fs.createReadStream(path)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        let arr= []
        for (let index = 0; index < results.length; index++) {
            arr.push([parseInt(results[index].products_id),parseInt(results[index].category_id)])
            
        }
        console.log(arr);

        var con = mysql.createConnection({
            host: "mariadb105.server179088.nazwa.pl",
            user: "server179088_raportyBL",
            password: process.env.DATABASE_PASSWORD,
            database: "server179088_raportyBL"
          });
    
          var truncateSQL = 'TRUNCATE ProductsAllegro'

          let truncate = await con.awaitQuery(truncateSQL)


          var sql = "INSERT IGNORE INTO ProductsAllegro(ProductID,CategoryID) VALUES ?"
     
          con.query(sql, [arr], function (error, result) {
            if( error){
                console.log(error)
              }
              con.end()

              console.log(result)
          });

        
    });


   

   
 

    



  }

  async function idk(){
    var con = mysql.createConnection({
        host: "mariadb105.server179088.nazwa.pl",
        user: "server179088_raportyBL",
        password: process.env.DATABASE_PASSWORD,
        database: "server179088_raportyBL"
      });

      var sql = 'SELECT DISTINCT ProductID, CategoryID FROM `ProductsAllegro`'
     
      
      let sqlresp = await con.awaitQuery(sql)

      let wholedata = []

      for (let element of sqlresp) {
            
          wholedata.push(new Object ({productID: element.ProductID,categoryID: element.CategoryID}))

      }

      console.log("XD",wholedata)
    let params = {
        "inventory_id": 38747,
        "products": wholedata.map(a => a.productID)
      };
    
      let data = {
        'method': 'getInventoryProductsData',
        'parameters': JSON.stringify(params)
      };
    
    
    let res  = await axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
      
        for (let element of sqlresp) {
            if(res.data.products[element.ProductID]){

                var obj = wholedata.find(e =>e.productID === element.ProductID);

                if(obj && res.data.products[element.ProductID].prices){
                 
                 obj.wholesalerPrice = res.data.products[element.ProductID].prices[4494]
                 obj.allegroPrice =parseFloat(await asyncCall(obj.categoryID, obj.wholesalerPrice / 1.23)) 
                 console.log(obj)
                }
               // console.log(await asyncCall(obj.categoryID, obj.wholesalerPrice / 1.23))
       
            }
      
        }

}




async function chuj(categoryID,offerValue){
    try {
        let res = asyncCall(categoryID,offerValue)
    } catch (error) {
        console.log(error)
    }
}

 async function asyncCall(categoryID, offerValue) {


   return  new Promise((resolve, reject) => {
        setTimeout(() => {
      

            data = {"offer": {
                "name": "Przykładowa oferta",
                "category": {
                    "id": parseInt(categoryID)
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
                "ean": null,
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
                        "amount":parseInt( offerValue),
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
                    "validatedAt": "2022-12-04T09:31:07.684Z"
                },
                "createdAt": "2022-10-01T05:44:23.000Z",
                "updatedAt": "2022-12-04T09:31:08.925Z"
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
                }).then((response) =>{ if(response.status === 200) return response.json(); else reject(response)}).then((data) => { resolve(data.commissions[0].fee.amount);})
              
              
              }catch(error){
                reject(error)
              }




        }, 0);
      })

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
 
  }


  async function refreshTokenfun()
  {
    try {
        let resp =await axios
        .post('https://allegro.pl/auth/oauth/token?grant_type=refresh_token&refresh_token=' +
        refreshToken, {}, { headers: {
            Authorization: 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded' }})
       

            console.log(resp.status)

        //console.log("xd",resp.data.access_token,resp.data.refresh_token)
        await saveLoginData(resp.data.access_token,resp.data.refresh_token)

    } catch (error) {
        console.log(error)
    }
  }


 async function saveLoginData(access_tokenx,refreshTokenx)
  {

    var con = mysql.createConnection({
        host: "mariadb105.server179088.nazwa.pl",
        user: "server179088_raportyBL",
        password: process.env.DATABASE_PASSWORD,
        database: "server179088_raportyBL"
      });

      var truncateSQL = 'TRUNCATE AccessData'

      let truncate = await con.awaitQuery(truncateSQL)


      var sql = "INSERT INTO AccessData(id,access_token,refresh_token,client_id,client_secret) VALUES (?)"
      var values = [
        [1],
        [access_tokenx],
        [refreshTokenx],
        [clientID],
        [clientSecret]
      ]
      con.query(sql, [values], function (error, result) {
        if( error){
            console.log(error)
          }
          con.end()

          console.log(result)
      });

  }

  async function updateLoginData()
  {
    var con = mysql.createConnection({
        host: "mariadb105.server179088.nazwa.pl",
        user: "server179088_raportyBL",
        password: process.env.DATABASE_PASSWORD,
        database: "server179088_raportyBL"
      });
    var sql = "select refresh_token, access_token from AccessData where id = 1"
  
    let sql_result = await con.awaitQuery(sql)

    refreshToken = sql_result[0].refresh_token

    access_token = sql_result[0].access_token

  }

  async function login2() {

    try {
 
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