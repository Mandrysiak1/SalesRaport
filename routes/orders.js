const express = require('express')

const router = express.Router()

const axios = require('axios');
var mysql = require('mysql');
const { response } = require('express');
const { Console } = require('console');
const e = require('express');


var nodemailer = require('nodemailer');


const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const { triggerAsyncId } = require('async_hooks');


router.get('/get',(req,res) => {

  var con = mysql.createConnection({
    host: "mariadb105.server179088.nazwa.pl",
    user: "server179088_raportyBL",
    password: process.env.DATABASE_PASSWORD,
    database: "server179088_raportyBL"
  });


  var d = new Date();
  d.setDate(d.getDate() - 1);
  var datastamp =  Math.floor(d.getTime() / 1000)

  var sql = "select product_name, sku, product_id ,count(*) as total from orders where timestamp > ? group by product_id "
  var valuse = [
    [datastamp]
  ] 


  con.query(sql,[valuse], function (err, result) {
    if (err) throw err;

    var productIDs = [];

    result.forEach(element => {
      if(!productIDs.includes(element))
      productIDs.push(element.product_id)

    })


    console.log("prids: " +productIDs.length)

    let params = {
      "inventory_id": 4745,
      "products" : productIDs
  };
  let data = {
      'method': 'getInventoryProductsData',
      'parameters': JSON.stringify(params)
  };
  axios
  .post('https://api.baselinker.com/connector.php', data ,{headers:{"X-BLToken":process.env.BASELINKER_API_KEY,'Content-Type': 'multipart/form-data'}})
        .then(res => {
        
    
          productIDs.forEach(element =>{

            if(res.data.products[element])
          {
            console.log(res.data.products[element].prices[4494])
            console.log(res.data.products[element].text_fields.extra_field_4240)


          }     

           

          })

          

        
        })
        .catch(error => {
          console.error(error);
        });




 
  });















//     axios
//     .post('https://api.baselinker.com/connector.php', data ,{headers:{"X-BLToken":process.env.BASELINKER_API_KEY,'Content-Type': 'multipart/form-data'}})
//      .then(res => {

//           var d = new Date();
//           d.setDate(d.getDate() - 30);
//           var datastamp =  Math.floor(d.getTime() / 1000)

//           var sql = "select product_name, sku, product_id ,count(*) as total from orders where timestamp > ? group by product_id "
//           var valuse = [
//             [datastamp]
//           ]

//           con.query(sql,[valuse], function (err, result) {
//             if (err) throw err;
            
//             var arrayData = [];

//             result.forEach(element => {


//                 let arr = [element.product_name,element.sku,element.total,"-"]
//                 if(res.data.products[element.product_id])
//                 {
//                     arr[3] = res.data.products[element.product_id].stock.bl_5662
//                 }
//                 arrayData.push(arr)
//                 arrayData.sort(sortFunction);


//             });
              
//            var dateObj = new Date();
//            var month = dateObj.getUTCMonth() + 1; //months from 1-12
//            var day = dateObj.getUTCDate();
//            var year = dateObj.getUTCFullYear();
//            var hours = dateObj.getHours();
//            var minutes = dateObj.getMinutes();
             
//            newdate = day + "_" + month + "_" + year + "_" + hours + "_"+ minutes;        
//            let doc = new PDFDocument({ margin: 30, size: 'A4' });
//            doc.pipe(fs.createWriteStream("./raport_" + newdate+".pdf"));

//            const tableArray = {
//             headers: ["Nazwa", "SKU", "Sprzedane", "W Magazynie"],
//             rows: arrayData
//           };

//              doc.table( tableArray, {
//                 prepareHeader: () => doc.font(`${__dirname}/arial.ttf`).fontSize(8),
//                 prepareRow: (row, indexColumn, indexRow, rectRow) => {
//                 doc.font(`${__dirname}/arial.ttf`).fontSize(8);
//                 indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? 'blue' : 'green'), 0.15);
//               },
//               });
//              doc.end();


//              var mail = nodemailer.createTransport({
//                 service: 'gmail',
//                 auth: {
//                   user: 'family24raports@gmail.com',
//                   pass: process.env.EMAIL_PASSWORD
//                 }
//               });

//               var mailOptions = {
//                 from: 'givemesomething9@gmail.com',
//                 to: 'andrysiakmaciejj@gmail.com',
//                 subject: 'Raport sprzedaży',
//                 text: 'Raport sprzedaży',
//                 attachments: [
//                    { filename: 'raport_' + newdate+'.pdf', path: './raport_' + newdate+'.pdf'}
//                 ]
//               };
               
//               mail.sendMail(mailOptions, function(error, info){
//                 if (error) {
//                   console.log(error);
//                 } else {
//                   console.log('Email sent: ' + info.response);
//                 }
//               });

//     });


  
     
// })
// .catch(error => {
//   console.error(error);
// });

res.send("xd");

});


router.get('/add', (req,res) => {


    var d = new Date();
    d.setHours(d.getHours() - 2);

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
    .post('https://api.baselinker.com/connector.php', data ,{headers:{"X-BLToken":process.env.BASELINKER_API_KEY,'Content-Type': 'multipart/form-data'}})
    .then(response => {

        var con = mysql.createConnection({
            host: "mariadb105.server179088.nazwa.pl",
            user: "server179088_raportyBL",
            password: process.env.DATABASE_PASSWORD,
            database: "server179088_raportyBL"
          });

          var data = []
          var sql = "SELECT orderID FROM orders"
          con.query(sql, function (err, result) {
            if (err) throw err;

            result.forEach(element => {
                data.push(Number.parseInt(element.orderID));
            });

            for (let index = 0; index < response.data.orders.length; index++) {
      
                var timestamp = response.data.orders[index].date_confirmed;
                var orderID = Number.parseInt(response.data.orders[index].order_id);
                        

                for (let i = 0; i < response.data.orders[index].products.length; i++) {
                 
                    var productID =  response.data.orders[index].products[i].product_id
                    var productName = response.data.orders[index].products[i].name
                    var sku = response.data.orders[index].products[i].sku
                    var quantity = response.data.orders[index].products[i].quantity
                   
        
                    for (let index = 0; index < quantity; index++) {
                      
                    if(!data.includes(orderID))
                    {
                        console.log("dodano: " + productName + " : " + sku);

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
        
             }
          });
        
        res.send("Add");
     
    })
    .catch(error => {
      console.error(error);
    });

})

function sortFunction(a, b) {
  if (a[2] === b[2]) {
      return 0;
  }
  else {
      return (a[2] > b[2]) ? -1 : 1;
  }
}
 async function asyncCall(index,con)
{

  await new Promise((resolve, reject) => {
    setTimeout(() => {
        var d = new Date();
        // d.setHours(d.getHours() - 2 * index );
        d.setTime(d.getTime() - index * 2 * 60 * 60 * 1000);
      


         var datastamp =  Math.floor(d.getTime() / 1000)
       
         console.log("datastamp: " + datastamp)
       
         let params = {
             "date_confirmed_from": datastamp,
             "get_unconfirmed_orders": false,
         };
         let data = {
             'method': 'getOrders',
             'parameters': JSON.stringify(params)
         };
         axios
         .post('https://api.baselinker.com/connector.php', data ,{headers:{"X-BLToken":process.env.BASELINKER_API_KEY,'Content-Type': 'multipart/form-data'}})
         .then(response => {
       
      
               var data = []
               var sql = "SELECT orderID FROM orders"
               con.query(sql, function (err, result) {
                 if (err) throw err;
                 
                 result.forEach(element => {
                     data.push(Number.parseInt(element.orderID));
                 });
       
                 for (let index = 0; index < response.data.orders.length; index++) {
           
                     var timestamp = response.data.orders[index].date_confirmed;
                     var orderID = Number.parseInt(response.data.orders[index].order_id);
                             
       
                     for (let i = 0; i < response.data.orders[index].products.length; i++) {
                      
                         var productID =  response.data.orders[index].products[i].product_id
                         var productName = response.data.orders[index].products[i].name
                         var sku = response.data.orders[index].products[i].sku
                         var quantity = response.data.orders[index].products[i].quantity
                        
             
                         for (let index = 0; index < quantity; index++) {
                          
                         if(!data.includes(orderID))
                         {
                             console.log("dodano: " + productName + " : " + sku);
       
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
             
                  }
               });
               resolve()

               console.log("wykonano " + index)
             
          
         })
         .catch(error => {
           console.error(error);
         });
    }, 1000);
});
  
}

async function xd()
{
  var con = mysql.createConnection({
    host: "mariadb105.server179088.nazwa.pl",
    user: "server179088_raportyBL",
    password: process.env.DATABASE_PASSWORD,
    database: "server179088_raportyBL"
  });


  for (let index = 0; index < 12 * 35; index++) {

    
    await asyncCall(index,con) 
    

  }
}

router.get('/addall', async (req,res) => {

  await xd()

  res.send("Addall");

})


module.exports = router