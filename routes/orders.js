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
  d.setDate(d.getDate() - 30);
  var datastamp =  Math.floor(d.getTime() / 1000)

  var sql = "select product_name, sku, product_id ,count(*) as total from orders where timestamp > ? group by product_id "
  var valuse = [
    [datastamp]
  ] 


  con.query(sql,[valuse], function (err, result) {
    if (err) throw err;

    var productIDs = [];

    result.forEach(element => {
      //console.log("tego: " + element.product_id)
      if(!productIDs.includes(element) && !(typeof element.product_id === 'string' && element.product_id.length === 0) )
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
        
    
          //productIDs.forEach(element =>{

            //console.log(res.data.products[element])
            // console.log(res.data.products[element].prices[4494])
            // console.log(res.data.products[element].text_fields.extra_field_4240)
            // console.log(res.data.products[element].text_fields.extra_field_5072)
            // console.log(res.data.products[element].stock.bl_5662)
            
            var selectedProducts = [];

           // console.log(result.);

             result.forEach(element_res => {
              
             // if((typeof res.data.products[element] === 'undefined')) return

           //  console.log(element.total)

             //console.log(res.data.products[element.product_id].stock[bl_5662])

            
           
              
             if(res.data.products[element_res.product_id]){

              if(element_res.total > res.data.products[element_res.product_id].stock.bl_5662 ){
               // console.log(res.data.products[element.product_id].stock.bl_5662)
                selectedProducts.push(element_res)
                
              }

             }

            })
  

            var dataArr = []
            console.log ("sp: " +selectedProducts.length)

            selectedProducts.forEach(element => {

              if(res.data.products[element.product_id]){


         

              let product_name = res.data.products[element.product_id].text_fields.name
              let sku = res.data.products[element.product_id].sku
              let sold = 0

              result.forEach(el => {
                //console.log(el.product_id)
                if(el.product_id == element.product_id)
                {
                  sold = el.total
                }
              })

             // console.log(result.find(el => Number.parseInt(el.product_id) === element.product_id))
              
              let in_stock= res.data.products[element.product_id].stock.bl_5662
              let price = res.data.products[element.product_id].prices[4494]
              let buy_price = res.data.products[element.product_id].text_fields.extra_field_5072
              let margin = ((price - buy_price)/ price * 100).toFixed(2);
              let vendor = res.data.products[element.product_id].text_fields.extra_field_4240 


              let arr = []
               arr = [product_name,sku,sold,in_stock,price,buy_price,margin,vendor]
                              // if(res.data.products[element.product_id])
                              // {
                              //     arr[3] = res.data.products[element.product_id].stock.bl_5662
                              // }
                              // arrayData.push(arr)
                              // arrayData.sort(sortFunction);

                dataArr.push(arr)
              }
            })

                  
          
          console.log("da: "+dataArr.length)
       
          var vendorArr = []
          dataArr.forEach(row => {
              if(!vendorArr.includes(row[7]))
              {
                vendorArr.push(row[7])
              }
          })
        

        
          var filenames = []

          vendorArr.forEach(vendor => {

            let arr = []
            dataArr.forEach(rows => {
              if(rows[7] == vendor)
              {
                arr.push(rows)
              }
              
            })

           var dateObj = new Date();

           var month = dateObj.getUTCMonth() + 1; //months from 1-12
           var day = dateObj.getUTCDate();
           var year = dateObj.getUTCFullYear();
           var hours = dateObj.getHours();
           var minutes = dateObj.getMinutes();
             
           newdate = day + "_" + month + "_" + year + "_" + hours + "_"+ minutes + "_" + vendor;        

           filenames.push(newdate);
           
           let doc = new PDFDocument({ margin: 30, size: 'A4' });
           doc.pipe(fs.createWriteStream("./raport_" + newdate+".pdf"));

           const tableArray = {
            headers: ["Nazwa","sku","sprzedanych","w magazynie", "cena", "cena zakupu", "marża", "dostawca"],
            rows: arr
          };

             doc.table( tableArray, {

              //  width: 500,
                // x: 150,
              columnsSize: [200,75,50,50,50,50,50,50], 

                prepareHeader: () => doc.font(`${__dirname}/arial.ttf`).fontSize(8),
                prepareRow: (row, indexColumn, indexRow, rectRow) => {
                doc.font(`${__dirname}/arial.ttf`).fontSize(8);
                indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? 'blue' : 'green'), 0.15);
              },
              });
             doc.end();


             

          })

          var dateObj = new Date();

          var month = dateObj.getUTCMonth() + 1; //months from 1-12
          var day = dateObj.getUTCDate();
          var year = dateObj.getUTCFullYear();
          var hours = dateObj.getHours();
          var minutes = dateObj.getMinutes();
            
          newdate = day + "_" + month + "_" + year + "_" + hours + "_"+ minutes + "_zbiorczy";        
        
          let doc1 = new PDFDocument({ margin: 30, size: 'A4' });
          doc1.pipe(fs.createWriteStream("./raport_" + newdate+".pdf"));

          const tableArray = {
           headers: ["Nazwa","sku","sprzedanych","w magazynie", "cena", "cena zakupu", "marża", "dostawca"],
           rows: dataArr
         };

            doc1.table( tableArray, {

              columnsSize: [200,75,50,50,50,50,50,50], 

               prepareHeader: () => doc1.font(`${__dirname}/arial.ttf`).fontSize(8),
               prepareRow: (row, indexColumn, indexRow, rectRow) => {
               doc1.font(`${__dirname}/arial.ttf`).fontSize(8);
               indexColumn === 0 && doc1.addBackground(rectRow, (indexRow % 2 ? 'blue' : 'green'), 0.15);
             },
             });
            doc1.end();


                         var mail = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'family24raports@gmail.com',
                  pass: process.env.EMAIL_PASSWORD
                }
              });

              // final_filenames =[]
              // final_filepaths =[]

              var attachments = []

              filenames.forEach(element => {
               // let str = day + "_" + month + "_" + year + "_" + hours + "_"+ minutes + element; 

                let x = new Object();
                x.filename ='raport_' + element+'.pdf'
                x.path = './raport_' + element+'.pdf'
                attachments.push(x)
              })



  



             

             // let str = day + "_" + month + "_" + year + "_" + hours + "_"+ minutes + "zbiorczy"; 
              //final_filenames.push('raport_' + str+'.pdf', './raport_' + str+'.pdf')
              
              var mailOptions = {
                from: 'givemesomething9@gmail.com',
                to: 'andrysiakmaciejj@gmail.com',
                subject: 'Raport sprzedaży',
                text: 'Raport sprzedaży',
                attachments: attachments
              };
               
              mail.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });




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