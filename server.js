
const express = require('express')
const app = express()

require('dotenv').config({ path: './crid.env' })
  

app.get('/', (req,res) =>{
    console.log("here")
    res.send("hi")
})

const ordersRouter = require("./routes/orders")

app.use("/orders", ordersRouter)
const Port = process.env.PORT  || 8080
app.listen(Port,() => console.log(`serwer start ${Port}`))