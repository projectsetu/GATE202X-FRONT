var express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var ejs = require('ejs');
const PORT = process.env.PORT || 5000;

const app = express()
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));


app.get('/payment', (req, res) => {
    res.send("hello world") 
})


app.listen(PORT, function() { console.log('Server Started !!!') });