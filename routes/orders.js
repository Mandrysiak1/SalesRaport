const express = require('express')
const router = express.Router()
const axios = require('axios')
const mysql = require(`mysql-await`);
var nodemailer = require('nodemailer');
var { log, logI, logD, logE, logConfig } = require('override-console-log');
const fs = require("fs");
const PDFDocument = require("pdfkit-table");
router.use(require('body-parser').json());

var raportDays = 14;

var connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    host: "mariadb105.server179088.nazwa.pl",
    user: "server179088_raportyBL",
    password: process.env.DATABASE_PASSWORD,
    database: "server179088_raportyBL"
  }); // Recreate the connection, since
  // the old one cannot be reused.

  connection.connect(function (err) {              // The server is either down
    if (err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

router.get('/addall', async (req, res) => {

  await processGet()
  res.send("Addall");
})

router.post('/get', async (req, res) => {

  handleDisconnect()

  console.log("Data from rq: " + req.body.days)
  raportDays = req.body.days == null ? raportDays : req.body.days

  var allFilenames = [];

  connection.on(`error`, (err) => {
    console.error(`Connection error ${err.code}`);
  });




  var d = new Date();
  d.setDate(d.getDate() - raportDays);
  var datastamp = Math.floor(d.getTime() / 1000)

  var selectedProducts = [];
  var allProducts = [];
  var productIDs = [];

  let init_params = {
    "inventory_id": 4745,
  };

  let init_data = {
    'method': 'getInventoryProductsStock',
    'parameters': JSON.stringify(init_params)
  };
  var initdata = await axios
    .post('https://api.baselinker.com/connector.php', init_data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })


  var initlenght = Object.keys(initdata.data.products).length
  for (let index = 0; index < initlenght; index++) {

    let product = initdata.data.products[Object.keys(initdata.data.products)[index]]

    if (product.stock.bl_5662 === 0) {
      productIDs.push(product.product_id)
      var obj = new Object()
      obj.product_id = product.product_id
      obj.timestamp = 0;
      obj.timestamp = await getLastPurchase(product.product_id, connection)

      selectedProducts.push(obj)
    }
  }

  var sql = "select product_name, sku, product_id, MAX(timestamp) as timestamp ,count(*) as total from orders where timestamp > ? group by sku "
  var valuse = [
    [datastamp]
  ]

  let sql_result = await connection.awaitQuery(sql, [valuse])
  connection.end()

  for (let element of sql_result) {

    //fixing broken orders to get allpossible IDs
    if (element.product_id === "") {
      element.product_id = await getID(element.sku)
    }

    if (!productIDs.includes(element))
      productIDs.push(element.product_id)

  }



  let params = {
    "inventory_id": 4745,
    "products": productIDs
  };

  let data = {
    'method': 'getInventoryProductsData',
    'parameters': JSON.stringify(params)
  };


  axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
    .then(res => {

      sql_result.forEach(element_res => {

        if (res.data.products[element_res.product_id]) {

          allProducts.push(element_res)

          if (element_res.total > res.data.products[element_res.product_id].stock.bl_5662
            && !selectedProducts.some(item => (item.product_id.toString() === element_res.product_id.toString()))) {

            selectedProducts.push(element_res)

          }
        }

      })

      var dataArrAll = []

      allProducts.forEach(element => {

        if (res.data.products[element.product_id]) {

          let product_name = res.data.products[element.product_id].text_fields.name
          let sku = res.data.products[element.product_id].sku
          let ean = res.data.products[element.product_id].ean
          let temp_timestamp = element.timestamp
          let a = new Date(temp_timestamp * 1000)


          var month = ((a.getUTCMonth() + 1) < 10 ? '0' : '') + (a.getUTCMonth() + 1); //months from 1-12
          var day = ((a.getUTCDate()) < 10 ? '0' : '') + a.getUTCDate()
          var year = a.getUTCFullYear();
          let timestamp = day + "." + month + "." + year;
          let sold = 0
          sql_result.forEach(el => {

            if (el.product_id == element.product_id) {
              sold = el.total
            }
          })

          let in_stock = res.data.products[element.product_id].stock.bl_5662
          let price = res.data.products[element.product_id].prices[4494]
          let buy_price = (Number.parseFloat(res.data.products[element.product_id].text_fields.extra_field_5072)).toFixed(2)
          let margin = ((price - buy_price * 1.23) / price * 100).toFixed(2);
          let vendor = res.data.products[element.product_id].text_fields.extra_field_4240

          let arr = []
          arr = [product_name, sku + "\n" + ean, sold, in_stock, price, buy_price, margin, vendor, timestamp]
          dataArrAll.push(arr)
        }
      })

      dataArrAll.sort(sortFunction)


      var dataArrSelected = []

      selectedProducts.forEach(element => {

        if (res.data.products[element.product_id]) {

          let isActive = res.data.products[element.product_id].text_fields.extra_field_4588
          let isBundle = res.data.products[element.product_id].text_fields.extra_field_4690

          if (isBundle != null && isActive != null) {
            if (isActive.toLowerCase() === "tak" && isBundle.toLowerCase() === "nie") {
              let product_name = res.data.products[element.product_id].text_fields.name
              let sku = res.data.products[element.product_id].sku
              let ean = res.data.products[element.product_id].ean
              let temp_timestamp = element.timestamp

              temp_timestamp = temp_timestamp === null ? 0 : temp_timestamp;

              let timestamp = 0
              if (temp_timestamp != 0) {
                let a = new Date(temp_timestamp * 1000)

                var month = ((a.getUTCMonth() + 1) < 10 ? '0' : '') + (a.getUTCMonth() + 1); //months from 1-12
                var day = ((a.getUTCDate()) < 10 ? '0' : '') + a.getUTCDate()

                var year = a.getUTCFullYear();
                timestamp = day + "." + month + "." + year;
              } else {
                timestamp = "przed 08.05.2022"
              }

              let sold = 0

              sql_result.forEach(el => {

                if (el.product_id == element.product_id) {
                  sold = el.total
                }
              })

              let in_stock = res.data.products[element.product_id].stock.bl_5662
              let price = res.data.products[element.product_id].prices[4494]
              let buy_price = (Number.parseFloat(res.data.products[element.product_id].text_fields.extra_field_5072)).toFixed(2)
              let margin = ((price - buy_price * 1.23) / price * 100).toFixed(2);
              let vendor = res.data.products[element.product_id].text_fields.extra_field_4240

              let arr = []
              arr = [product_name, sku + "\n" + ean, sold, in_stock, price, buy_price, margin, vendor, timestamp]
              dataArrSelected.push(arr)
            } else {
              // console.log(product_name = res.data.products[element.product_id].text_fields.name + " isActive: " + isActive)
            }
          }


        }
      })

      var vendorArr = []

      dataArrSelected.forEach(row => {
        console.log(row)

        if (row[7] !== undefined) {
          if (!vendorArr.includes(row[7].toLowerCase())) {
            vendorArr.push(row[7].toLowerCase())
          }
        } else {
          if (!vendorArr.includes("nieznany")) {
            vendorArr.push("nieznany")
            row[7] = "nieznany";
          }
        }


      })

      vendorArr.forEach(vendor => {
        let selectedVendorData = []

        dataArrSelected.forEach(rows => {

          if (rows[7].toLowerCase() == vendor.toLowerCase()) {
            selectedVendorData.push(rows)
          }
        })

        selectedVendorData.sort(sortFunction)
        createPDF(vendor, selectedVendorData.sort(sortFunction), allFilenames)

      })

      dataArrSelected.sort(sortfunctionVendor)

      createPDF("zbiorczy", dataArrSelected, allFilenames)
      createPDF("ogólny", dataArrAll, allFilenames)

      var attachments = []

      allFilenames.forEach(element => {
        let x = new Object();
        x.filename = 'raport_' + element + '.pdf'
        x.path = './raport_' + element + '.pdf'
        attachments.push(x)
      })

      sendMail(attachments)

    })
    .catch(error => {
      console.error(error);
    });

  res.send("OK");

});


router.get('/add', (req, res) => {

  handleDisconnect()

  var d = new Date();
  d.setHours(d.getHours() - 2);

  var datastamp = Math.floor(d.getTime() / 1000)


  let params = {
    "date_confirmed_from": datastamp,
    "get_unconfirmed_orders": false,
  };
  let data = {
    'method': 'getOrders',
    'parameters': JSON.stringify(params)
  };
  axios
    .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
    .then(response => {

      var data = []
      var sql = "SELECT orderID FROM orders"
      connection.query(sql, function (err, result) {
        if (err) throw err;

        result.forEach(element => {
          data.push(Number.parseInt(element.orderID));
        });

        for (let index = 0; index < response.data.orders.length; index++) {

          var timestamp = response.data.orders[index].date_confirmed;
          var orderID = Number.parseInt(response.data.orders[index].order_id);


          for (let i = 0; i < response.data.orders[index].products.length; i++) {

            var productID = response.data.orders[index].products[i].product_id
            var productName = response.data.orders[index].products[i].name
            var sku = response.data.orders[index].products[i].sku
            var quantity = response.data.orders[index].products[i].quantity


            for (let index = 0; index < quantity; index++) {

              if (!data.includes(orderID)) {
                console.log("Added: " + productName + " sku: " + sku + "orderID: " + orderID);

                var sql = "INSERT INTO orders (orderID,product_id,product_name, sku, timestamp ) VALUES ( ?)"
                var valuse = [
                  [orderID],
                  [productID],
                  [productName],
                  [sku],
                  [timestamp]
                ]
                connection.query(sql, [valuse], function (err, result) {
                  if (err) throw err;

                  //connection.end()
                });
              }
            }
          }
        }
      });
      //connection.end()
      res.send("Add");

    })
    .catch(error => {
      console.error(error);
      //connection.end()
    });

})
function sendMail(attachments) {
  var dateObj = new Date();

  var month = ((dateObj.getUTCMonth() + 1) < 10 ? '0' : '') + (dateObj.getUTCMonth() + 1); //months from 1-12
  var day = ((dateObj.getUTCDate()) < 10 ? '0' : '') + dateObj.getUTCDate()

  var year = dateObj.getUTCFullYear();
  var hours = (dateObj.getHours() < 10 ? '0' : '') + dateObj.getHours()
  var minutes = (dateObj.getMinutes() < 10 ? '0' : '') + dateObj.getMinutes()
  let newdate = day + "." + month + "." + year + " godzina: " + hours + ":" + minutes
  var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'family24raports@gmail.com',
      pass: process.env.EMAIL_PASSWORD
    }
  });
  var maillist = [
    'andrysiakmaciejj@gmail.com',
    'akrzypkowska@kubartech.pl',
    'family24.akrzypkowska@gmail.com',
    'gkrzypkowski@kubartech.pl'
  ];

  var mailOptions = {
    from: 'givemesomething9@gmail.com',
    to: maillist,
    subject: 'Raport sprzedaży ' + newdate,
    text: 'Raport sprzedaży z dnia ' + newdate,
    attachments: attachments
  };

  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}
function createPDF(alias, data, allFilenames) {

  var dateObj = new Date();

  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();
  var hours = (dateObj.getHours() < 10 ? '0' : '') + dateObj.getHours()
  var minutes = (dateObj.getMinutes() < 10 ? '0' : '') + dateObj.getMinutes()

  let newdate = day + "_" + month + "_" + year + "_" + hours + "_" + minutes + "_" + alias;


  let doc = new PDFDocument({ margin: 30, size: 'A4' });

  doc.pipe(fs.createWriteStream("./raport_" + newdate + ".pdf"));

  allFilenames.push(newdate)

  const tableArray = {
    headers: [
      { label: "Nazwa produktu", headerAlign: "center" },
      { label: "SKU/EAN", headerAlign: "center" },
      { label: "Ilość sprzedanych", align: "center", headerAlign: "center" },
      { label: "Ilość w magazynie", align: "center", headerAlign: "center" },
      { label: "Cena sprzedaży brutto (zł)", align: "center", headerAlign: "center" },
      { label: "Cena zakupu netto (zł)", align: "center", headerAlign: "center" },
      { label: "Marża (%)", align: "center", headerAlign: "center" },
      { label: "Dostawca", align: "center", headerAlign: "center" },
      { label: "Ostatnia sprzedaż", align: "center", headerAlign: "center" }

    ],
    rows: data
  };

  doc.table(tableArray, {

    columnsSize: [160, 65, 40, 40, 40, 40, 40, 50, 50],

    prepareHeader: () => doc.font(`${__dirname}/arial.ttf`).fontSize(8),
    prepareRow: (row, indexColumn, indexRow, rectRow) => {
      doc.font(`${__dirname}/arial.ttf`).fontSize(8);
      indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? '#7f827e' : '#e0e6df'), 0.15);
    },
  });
  doc.end();
}

function sortFunction(a, b) {
  if (a[2] === b[2]) {
    return 0;
  }
  else {
    return (a[2] > b[2]) ? -1 : 1;
  }
}

function sortfunctionVendor(a, b) {
  if (a[7].toLowerCase() === b[7].toLowerCase()) {
    return sortFunction(a, b);
  }
  else {
    return (a[7].toLowerCase() > b[7].toLowerCase()) ? -1 : 1;
  }
}
async function asyncCall(index, con) {

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      var d = new Date();

      d.setTime(d.getTime() - index * 2 * 60 * 60 * 1000);

      var datastamp = Math.floor(d.getTime() / 1000)

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
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
        .then(response => {
          var data = []
          var sql = "SELECT DISTINCT orderID FROM orders"
          con.query(sql, function (err, result) {
            if (err) throw err;

            result.forEach(element => {
              data.push(Number.parseInt(element.orderID));
            });

            for (let index = 0; index < response.data.orders.length; index++) {

              var timestamp = response.data.orders[index].date_confirmed;
              var orderID = Number.parseInt(response.data.orders[index].order_id);

              for (let i = 0; i < response.data.orders[index].products.length; i++) {

                var productID = response.data.orders[index].products[i].product_id
                var productName = response.data.orders[index].products[i].name
                var sku = response.data.orders[index].products[i].sku
                var quantity = response.data.orders[index].products[i].quantity


                for (let index = 0; index < quantity; index++) {

                  if (!data.includes(orderID)) {
                    console.log("Added: " + productName + " sku: " + sku + "orderID: " + orderID);

                    var sql = "INSERT INTO orders (orderID,product_id,product_name, sku, timestamp ) VALUES ( ?)"
                    var valuse = [
                      [orderID],
                      [productID],
                      [productName],
                      [sku],
                      [timestamp]
                    ]
                    con.query(sql, [valuse], function (err, result) {
                      if (err) throw err;
                      con.end()
                    });
                  }
                }

              }
            }
          });
          resolve()

          console.log("Addall iteratios:  " + index)


        })
        .catch(error => {
          console.error(error);
        });
    }, 1000);
  });

}

async function processGet() {

  handleDisconnect()

  for (let index = 0; index < 12 * 30 * 7; index++) {
    await asyncCall(index, connection)
  }
  connection.end()
}



async function getID(sku) {

  return new Promise((resolve, reject) => {
    setTimeout(() => {

      let params = {
        "inventory_id": 4745,
        "filter_sku": sku
      };

      let data = {
        'method': 'getInventoryProductsList',
        'parameters': JSON.stringify(params)
      };


      axios
        .post('https://api.baselinker.com/connector.php', data, { headers: { "X-BLToken": process.env.BASELINKER_API_KEY, 'Content-Type': 'multipart/form-data' } })
        .then(res => {

          if (res.data.products[(Object.keys(res.data.products)[0])]) {
            resolve(res.data.products[(Object.keys(res.data.products)[0])].id)

          } else {
            resolve()
          }


        })
        .catch(error => {
          console.error(error);
        });

    }, 100);
  });



}

async function getLastPurchase(product_id, con) {

  var sql = "SELECT MAX(timestamp) as timestamp from orders where product_id = ? "
  var valuse = [
    [product_id]
  ]

  let sql_result = await con.awaitQuery(sql, [valuse])

  return sql_result[0].timestamp;
}

module.exports = router