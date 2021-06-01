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

var qna_details_server = new Schema({
    branch: String,
    branch_code: String,
    test_catagory: String,
    question_type: String,
    question_catagory: String,
    subject: String,
    src: String
}, {
    collection: 'qna_details'
});


var connect = mongoose.createConnection(process.env.QNA_SESSION, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true });
var qna_details_model = connect.model('qna_details_model', qna_details_server);



/*
app.get('/exam', (req, res) => {
    var branch = "Electronics and Communication"
    var branch_code = "ECE"
    var test_catagory = "GATE 2021 ECE EXAM"
    // apti till 5 is 1 mark and rest is 2 mark 
    // tech till 25 is 1 mark and rest is 2 mark
    qna_details_model.find({ test_catagory: test_catagory }, function(err, result) {
        var apti_dump = JSON.stringify(
            [{ question_type: "MCQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_1.jpg" },
                { question_type: "MCQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_2.jpg" },
                { question_type: "MSQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_3.jpg" },
                { question_type: "MSQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_4.jpg" },
                { question_type: "NAT1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_5.jpg" },
                { question_type: "NAT2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_6.jpg" }
            ]);
        var tech_dump = JSON.stringify(
            [{ question_type: "MCQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_1.jpg" },
                { question_type: "MCQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_2.jpg" },
                { question_type: "MSQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_3.jpg" },
                { question_type: "MSQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_4.jpg" },
                { question_type: "NAT1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_5.jpg" },
                { question_type: "NAT2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_6.jpg" }
            ]);
        res.render("exam.ejs", { branch: branch, branch_code: branch_code, test_catagory: test_catagory, apti_dump: apti_dump, tech_dump: tech_dump })
    })
})

app.get('/login', (req, res) => {
    var username = "Sameer";
    var test_catagory = "FULL SUBJECT TEST";
    res.render("login.ejs", { username: username, test_catagory: test_catagory });
})

*/

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

/*
app.get('/exam', (req, res) => {
    var branch = "Electronics and Communication"
    var branch_code = "ECE"
    var test_catagory = "GATE 2021 ECE EXAM"
    qna_details_model.find({ test_catagory: "GATE 2021 ECE EXAM" }, function(err, result) {
        var apti_dump_MCQ1 = [];
        var apti_dump_MCQ2 = [];
        var tech_dump_MCQ1 = [];
        var tech_dump_MCQ2 = [];
        var tech_dump_MSQ1 = [];
        var tech_dump_MSQ2 = [];
        var tech_dump_NAT1 = [];
        var tech_dump_NAT2 = [];
        for (var i = 0; i < result.length; i++) {
            if (result[i].question_type == 'apti') {

            }
        }
        /*var apti_dump = JSON.stringify(
            [{ question_type: "MCQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_1.jpg" },
                { question_type: "MCQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_2.jpg" },
                { question_type: "MSQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_3.jpg" },
                { question_type: "MSQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_4.jpg" },
                { question_type: "NAT1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_5.jpg" },
                { question_type: "NAT2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/apti_6.jpg" }
            ]);
        var tech_dump = JSON.stringify(
            [{ question_type: "MCQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_1.jpg" },
                { question_type: "MCQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_2.jpg" },
                { question_type: "MSQ1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_3.jpg" },
                { question_type: "MSQ2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_4.jpg" },
                { question_type: "NAT1", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_5.jpg" },
                { question_type: "NAT2", src: "https://raw.githubusercontent.com/projectsetu/qnagate202x/main/gate_final_full_2021_ece/tech_6.jpg" }
            ]);
        res.render("exam.ejs", { branch: branch, branch_code: branch_code, test_catagory: test_catagory, apti_dump: apti_dump, tech_dump: tech_dump })*/
/*    })
})*/

function paymentfinal(name, mobile, email, transactionid, amount) {
    receipt.config.currency = '₹';
    receipt.config.width = 100;
    receipt.config.ruler = '-';

    const output = receipt.create([{
            type: 'text',
            value: [
                'GATE202X TEST SERIES',
                sagar_email,
                'https://gate202x.ml/payment'
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
                { item: 'GATE SIMULATOR 2021 (1 Month)', qty: 1, cost: amount * 100 },
            ]
        },
        { type: 'empty' },
        { type: 'text', value: 'Subject to payment approval, Username and Password will be provided.' },
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
        { type: 'text', value: 'Thank you for shopping at GATE202X Have a Good Day !!!' }
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
        subject: 'GATE202X PAYMENT RECEIPT - ' + transactionid,
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