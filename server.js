
const express = require('express')
const app = express()
const cron = require('node-cron');
const request = require('supertest');
const open = require('open')

require('dotenv').config({ path: './crid.env' })

app.get('/',async (  req,res) =>{
    console.log("here")
    console.log(req.query.orderid)
 
    
    res.send("hi")
})

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

  cron.schedule('0 10 * * *', function() {
    console.log('Running getTask');
    request(app)
  .get('/orders/get')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log('call done');
  });
  });

const ordersRouter = require("./routes/orders")

app.use("/orders", ordersRouter)
const Port = process.env.PORT  || 8080
app.listen(Port,() => console.log(`serwer start ${Port}`))