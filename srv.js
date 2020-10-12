//Al libraries we will require on this server connection file
const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//Require config file
const config = require('./config/config.js');

//Specify port from config file
const PORT = process.env.PORT;

//Start express app
const app = express();

//Initialize project to use mongoose:
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
//Use static files from Public(html, css, js, etc)
app.use('/', express.static(path.join(__dirname, 'public')));
//Use fileUpload to upload files later
app.use(fileUpload());
//Use routes for all requests done on Frontend
app.use(require('./routes/routes'));

//DB Connection and connecting to server  on specified port
mongoose.connect(process.env.URLDB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => { //Connection successfull
    console.log("Connected to database");
    https.createServer({ //Create https server with certificates (Generated with OpenSSL)
        key: fs.readFileSync('localhost-key.pem'),
        cert: fs.readFileSync('localhost.pem')
    }, app).listen(PORT, function() { //Run server
        console.log("My https server listening on port " + PORT + "...");
    });
}).catch((err) => { //Conection failure
    console.log("Not connected to database", err);
});