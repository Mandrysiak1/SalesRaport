const express = require('express')

const router = express.Router()

const axios = require('axios');
var mysql = require('mysql');
const { response } = require('express');
const { Console } = require('console');
const e = require('express');

const fs = require("fs");
const PDFDocument = require("pdfkit-table");


router.get('/get',(req,res) => {

    let params = {
        "inventory_id": 4745,
        "page" : 1
    };
    let data = {
        'method': 'getInventoryProductsStock',
        'parameters': JSON.stringify(params)
    };
    axios
    .post('https://api.baselinker.com/connector.php', data ,{headers:{"X-BLToken":"3005243-3013293-7NMX38KMPB6S5AGQ87WAQ0KE8D735MPWRET1I8AWQ7BNNS7KOQ577X03CYIPMNZM",'Content-Type': 'multipart/form-data'}})
     .then(res => {

        var con = mysql.createConnection({
            host: "mariadb105.server179088.nazwa.pl",
            user: "server179088_raportyBL",
            password: "s^KctNDiWK8!&S",
            database: "server179088_raportyBL"
          });

          var sql = "select product_name, sku, product_id ,count(*) as total from orders group by product_id"
          con.query(sql, function (err, result) {
            if (err) throw err;
            
             var arrayData = [];

            result.forEach(element => {


                let arr = [element.product_name,element.sku,element.total,"-"]
                if(res.data.products[element.product_id])
                {
                    arr[3] = res.data.products[element.product_id].stock.bl_5662
                }

                arrayData.push(arr)

                arrayData.sort(sortFunction);


            });
          
           console.log(arrayData)

           let doc = new PDFDocument({ margin: 30, size: 'A4' });
           doc.pipe(fs.createWriteStream("./document.pdf"));

           const tableArray = {
            headers: ["Nazwa", "SKU", "Sprzedane", "W Magazynie"],
            rows: arrayData
          };

             doc.table( tableArray, {
                prepareHeader: () => doc.font(`${__dirname}/arial.ttf`).fontSize(8),
                prepareRow: (row, indexColumn, indexRow, rectRow) => {
                doc.font(`${__dirname}/arial.ttf`).fontSize(8);
                indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? 'blue' : 'green'), 0.15);
              },
              });
             doc.end();

    });


  
     
})
.catch(error => {
  console.error(error);
});

res.send("xd");

});
function sortFunction(a, b) {
    if (a[2] === b[2]) {
        return 0;
    }
    else {
        return (a[2] > b[2]) ? -1 : 1;
    }
}


router.get('/add', (req,res) => {


    var d = new Date();
    d.setHours(d.getHours() - 10);

    var datastamp =  Math.floor(d.getTime() / 1000)


    let params = {
        "date_confirmed_from": datastamp,
        "get_unconfirmed_orders": false,
    };
    let data = {
        'method': 'getOrders',
        'parameters': JSON.stringify(params)
    };
    axios
    .post('https://api.baselinker.com/connector.php', data ,{headers:{"X-BLToken":"3005243-3013293-7NMX38KMPB6S5AGQ87WAQ0KE8D735MPWRET1I8AWQ7BNNS7KOQ577X03CYIPMNZM",'Content-Type': 'multipart/form-data'}})
    .then(response => {

    //   console.log(`statusCode: ${res.status}`);
    //   console.log(res);
        //console.log(res.data.[res.data.orders.length-1]);
        var con = mysql.createConnection({
            host: "mariadb105.server179088.nazwa.pl",
            user: "server179088_raportyBL",
            password: "s^KctNDiWK8!&S",
            database: "server179088_raportyBL"
          });

          var data = []
          var sql = "SELECT orderID FROM orders"
          con.query(sql, function (err, result) {
            if (err) throw err;

            result.forEach(element => {
                data.push(Number.parseInt(element.orderID));
            });
            // data.push(result);
            //console.log(data);

            for (let index = 0; index < response.data.orders.length; index++) {
      
               // console.log(response.data.orders[index])
                var timestamp = response.data.orders[index].date_confirmed;
                var orderID = Number.parseInt(response.data.orders[index].order_id);
                
        

                for (let i = 0; i < response.data.orders[index].products.length; i++) {
                 
                    var productID =  response.data.orders[index].products[i].product_id
                    var productName = response.data.orders[index].products[i].name
                    var sku = response.data.orders[index].products[i].sku
                    //console.log(sku)
                  //  console.log(timestamp)
        
                    //console.log(data);
                    if(!data.includes(orderID))
                    {
                        var sql = "INSERT INTO orders (orderID,product_id,product_name, sku, timestamp ) VALUES ( ?)"
                        var valuse = [
                            [orderID],
                            [productID],
                            [productName],
                            [sku],
                            [timestamp]
                           
                          
                       
                        ]
                        con.query(sql,[valuse], function (err, result) {
                          if (err) throw err;
                        });
                    }
               
                }
        
             }
          });

    
        
        res.send("xd");
     
    })
    .catch(error => {
      console.error(error);
    });

})

module.exports = router