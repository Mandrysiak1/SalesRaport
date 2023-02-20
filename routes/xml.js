const express = require('express')
const router = express.Router()
const axios = require('axios')
const fs = require('fs')

router.get('/xml', async (req, res) => {

    var arr = []


      
    await getAllProductsInfo()

    res.send("Addall");
})


async function getAllProductsInfo()
{
    var productID = []
 
            wholedata = []

            let params = {
                "inventory_id": 4745,
            };
        
            let data = {
                'method': 'getInventoryProductsList',
                'parameters': JSON.stringify(params)
            };
        
        
            let res = await axios
                .post('https://api.baselinker.com/connector.php', data, {
                    headers: {
                        "X-BLToken": process.env.BASELINKER_API_KEY,
                        'Content-Type': 'multipart/form-data'
                    }
                })
               
             var productIDs = Object.keys(res.data.products)

             getAlldata(productIDs)
            



    
}


async function getAlldata(productIDs)
{
    let params = {
        "inventory_id": 4745,
        "products": productIDs
    };

    let data = {
        'method': 'getInventoryProductsData',
        'parameters': JSON.stringify(params)
    };


    let res = await axios
        .post('https://api.baselinker.com/connector.php', data, {
            headers: {
                "X-BLToken": process.env.BASELINKER_API_KEY,
                'Content-Type': 'multipart/form-data'
            }
        })
    

        //console.log(objectToXml(res.data.products))

        fs.writeFile(
            "./test.xml", 
            objectToXml(res.data.products), 
            function(error) {
              if (error) {
                console.log(error);
              } else {
                console.log("The file was saved!");
              }
            }
          ); 
}




function objectToXml(obj) {
    var xml = '';
  
    for (var prop in obj) {
      debugger;
      if (!obj.hasOwnProperty(prop)) {
        continue;
      }
  
      if (obj[prop] == undefined)
        continue;
  
      xml += "<" + prop + ">";
      if (typeof obj[prop] == "object") {
        if (obj[prop].constructor === Array) {
          for (var i = 0; i < obj[prop].length; i++) {
            xml += '<item>';
            xml += objectToXml(new Object(obj[prop][i]));
            xml += "</item>";
          }
        } else {
          xml += objectToXml(new Object(obj[prop]));
        }
      } else {
        xml += obj[prop];
      }
      xml += "</" + prop + ">";
    }
  
    return xml;
  }


module.exports = router