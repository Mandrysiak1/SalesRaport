
const express = require('express')
const app = express()
const cron = require('node-cron');
const request = require('supertest');

require('dotenv').config({ path: './crid.env' })

console.log(process.env) // remove this after you've confirmed it working

app.get('/', (req,res) =>{
    console.log("here")
    res.send("hi")
})

cron.schedule('0/2 * * * *', function() {
    console.log('running a task every 2min ');
  
    request(app)
  .get('/orders/add')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log('call done');
  });
  });

  cron.schedule('0 0 * * *', function() {
    console.log('running a task every hour');
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