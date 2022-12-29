const express = require('express')
const app = express()
const cron = require('node-cron');
const request = require('supertest');
const open = require('open')

var bodyParser = require('body-parser')



require('dotenv').config({ path: __dirname + '/crid.env' })

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));

app.get('/',async (  req,res) =>{
    console.log("here")
    console.log(req.query.orderid)
    res.send("hi")
})
app.use(express.urlencoded());


app.get('/raport', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/prowizje', (req, res) => {
  let margin = 0;
  let marginThreshold = 1;
  let marginConst = -1;

  let data = {
    margin: margin,
    marginThreshold: marginThreshold,
    marginConst: marginConst
  };
  
  res.render('index', {
    data: data
  });
});


cron.schedule('00 59 * * * *', function() {
    console.log('running addTASK ');
  
    request(app)
  .get('/orders/add')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log('call done');
  });
  });

  cron.schedule('0 0 5,17 * * *', function() {
    console.log('Recalculating prestashop prices');
    request(app)
  .get('/wholesaler/updatePresta')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log('call done');
  });
  });

  cron.schedule('0 0 6,18 * * *', function() {
    console.log('Recalculating allegro prices');
    request(app)
  .get('/wholesaler/login')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log('call done');
  });
  });


  cron.schedule('00 18 * * 0', function() {
    console.log('Running getTask');
    request(app)
  .post('/orders/get')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log('call done');
  });
  });

const ordersRouter = require("./routes/orders")
const shimpents = require("./routes/shipments")
const shimpentsRender = require("./routes/shipmentsRender")
const wholesaler = require("./routes/wholesaler")


app.use("/orders", ordersRouter)
app.use("/shipments",shimpents)
app.use("/render",shimpentsRender)
app.use("/wholesaler",wholesaler)

module.exports.app = app

const Port = process.env.PORT  || 8080

const server = app.listen(Port,() => console.log(`Server start on port: ${Port}`))

