// import 
require ('dotenv').config();
const mongoose= require('mongoose');
const express = require('express');

const app = express();

const PORT = process.env.PORT || 4000;



//database connectio 
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true,serverSelectionTimeoutMS: 30000,});
const db = mongoose.connection;
db.on("error",(error)=>console.log(error));
db.once("open", ()=> console.log("connected to the database!"));

// for user routes
const userRoute = require('./routes/userRoute')
app.use('/',userRoute);

// for admin routes
const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute);

// for admin routes
const administratorRoute = require('./routes/administratorRouter')
app.use('/administrator',administratorRoute);

app.listen(PORT,function () {
    console.log("server is runnig......");

})
