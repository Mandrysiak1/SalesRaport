
const express = require('express')
const app = express()


app.get('/', (req,res) =>{
    console.log("here")
    res.send("hi")
})

const ordersRouter = require("./routes/orders")

app.use("/orders", ordersRouter)
const Port = 8080
app.listen(Port,() => console.log(`serwer start ${Port}`))

// var http = require('http');
// http.createServer(function (req, res) {
// console.log("serwer start")
//     res.writeHead(200, {'Content-Type': 'text/plain'});
// res.end('Hello World !');

// }).listen(8080);