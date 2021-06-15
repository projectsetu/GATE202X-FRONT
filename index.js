var express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var ejs = require('ejs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const PORT = process.env.PORT || 5000;
require('dotenv').config();
var moment = require('moment');
const nodemailer = require('nodemailer');
const receipt = require('receipt');
var key = process.env.KEY;
var encryptor = require('simple-encryptor')(key);
var fs = require('fs')
var url = require('url');


const app = express()
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

var admin_email = encryptor.decrypt(process.env.ADMINEMAIL);
var sagar_email = encryptor.decrypt(process.env.SAGAREMAIL);
var sagar_pass = encryptor.decrypt(process.env.SAGARPASSWORD);



var payment_details_server = new Schema({
    name: String,
    email: String,
    mobile: Number,
    transactionid: String,
    amount: Number,
    date: String
}, {
    collection: 'payment_details'
});

var connect = mongoose.createConnection(process.env.PAYMENT_SESSION, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true });
var payment_details_model = connect.model('payment_details_model', payment_details_server);


app.get('/', (req, res) => {
    res.render("welcome.ejs")
})

app.get('/payment', (req, res) => {
    var requrl = url.format({
        protocol: req.protocol,
        host: req.get('host')
    })
    res.render("payment.ejs", { smallupi: requrl + '/smallupi', largeupi: requrl + '/largeupi' })
})


app.post('/paymentinfo', urlencodedParser, function(req, res) {
    var date = moment().format('MMMM Do YYYY, h:mm:ss a');
    var response = {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        transactionid: req.body.transactionid,
        amount: req.body.amount,
        date: date
    }
    payment_details_model.create(response, function(err, result) {
        console.log(result)
        if (err) {
            res.send(JSON.stringify({ status: false }))
        } else {
            var receipt = paymentfinal(req.body.name, req.body.mobile, req.body.email, req.body.transactionid, req.body.amount);
            adminpayment(response)
            res.send(JSON.stringify({ status: true, receipt: receipt }))
        }
    })
})


app.get('/smallupi', function(req, res) {
    var image1 = 'upi_small.jpg';
    var base64Img = require('base64-img');
    var imageData1 = base64Img.base64Sync(image1);
    var base64Data = imageData1.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    var img = Buffer.from(base64Data, 'base64');
    if (req.headers["sec-fetch-dest"] == "image") {
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        res.end(img);
    } else {
        res.send('Error 404 : Requested resource does not exists')
    }
});

app.get('/largeupi', function(req, res) {
    var image1 = 'upi_large.jpg';
    var base64Img = require('base64-img');
    var imageData1 = base64Img.base64Sync(image1);
    var base64Data = imageData1.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    var img = Buffer.from(base64Data, 'base64');
    if (req.headers["sec-fetch-dest"] == "image") {
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        res.end(img);
    } else {
        res.send('Error 404 : Requested resource does not exists')
    }
});


function paymentfinal(name, mobile, email, transactionid, amount) {
    receipt.config.currency = '₹';
    receipt.config.width = 100;
    receipt.config.ruler = '-';

    const output = receipt.create([{
            type: 'text',
            value: [
                'O2Plus Android App',
                sagar_email,
                'https://o2plus.ml/payment'
            ],
            align: 'center'
        },
        { type: 'empty' },
        {
            type: 'properties',
            lines: [
                { name: 'Name', value: name },
                { name: 'Phone Number', value: mobile },
                { name: 'Order Number', value: transactionid },
                { name: 'Date', value: moment().format('MMMM Do YYYY, h:mm:ss a') + ' (GMT) ' }
            ]
        },
        {
            type: 'table',
            lines: [
                { item: 'Cloud Automation Service (30 days)', qty: 1, cost: amount * 100 },
            ]
        },
        { type: 'empty' },
        { type: 'text', value: 'Subject to payment approval, 30 days of serverless cloud automation will be provided' },
        { type: 'empty' },
        {
            type: 'properties',
            lines: [
                { name: 'Amount Paid', value: 'INR ' + Math.floor(amount) + ".00" },
                { name: 'Amount Returned', value: 'INR 00.00' }
            ]
        },
        { type: 'empty' },
        { type: 'text', value: 'Receipt sent to your email.' },
        { type: 'text', value: 'Thank you for shopping at O2Plus Have a Good Day !!!' }
    ]);

    let mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: sagar_email,
            pass: sagar_pass
        }
    });


    let mailDetails = {
        from: sagar_email,
        to: email,
        subject: 'O2Plus PAYMENT RECEIPT - ' + transactionid,
        text: output
    };

    mailTransporter.sendMail(mailDetails, function(err, data) {
        if (err) {
            console.log('Error Occurs');
        } else {
            console.log('Email sent successfully');
        }
    });
    return output
}

function adminpayment(info_load) {

    let mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: sagar_email,
            pass: sagar_pass
        }
    });


    let mailDetails = {
        from: sagar_email,
        to: admin_email,
        subject: 'New Payment Information ',
        text: JSON.stringify(info_load)
    };

    mailTransporter.sendMail(mailDetails, function(err, data) {
        if (err) {
            console.log('Error Occurs');
        } else {
            console.log('Email sent successfully');
        }
    });
}

app.listen(PORT, function() { console.log('Server Started !!!') });