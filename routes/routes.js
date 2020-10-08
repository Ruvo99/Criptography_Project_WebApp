const express = require('express');
const fs = require('fs');

//Required for security and moving files
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const globby = require('globby');
const qrcode = require('qrcode');
let jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const dateTime = require('date-time');

//Require all models from /models
const User = require('../models/user');
const Logins = require('../models/logins');
//Express app
const app = express();


app.post('/login', function(req, res) {
    //Save body from the response
    let body = req.body;

    User.findOne({ email: body.email }, (errorFound, userDB) => {
        if (errorFound) {
            return res.status(500).json({
                ok: false,
                err: errorFound
            });
        }
        // Verify user existance 
        if (!userDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "No such user found, try again"
                }
            });
        }
        // Verify password given with the password stored in DB
        if (!bcrypt.compareSync(body.password, userDB.psw)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "Incorrect user or password, try again"
                }
            });
        }
        //Once we assured the user exists, generate secret for 2FA
        //console.log(userDB);
        let secret = speakeasy.generateSecret({
            name: "Code for user of Upload System"
        });
        //QR code generation for authentication
        qrcode.toDataURL(secret.otpauth_url, function(err, data) {
            if (err) {
                throw err;
            } else {
                // Authentication token
                let token = jwt.sign({
                    usuario: userDB,
                }, process.env.SEED_AUTENTICACION, {
                    expiresIn: process.env.CADUCIDAD_TOKEN
                });
                // Save the secret's ascii for verification of 6 digit code
                let AsciiSTR = "";
                AsciiSTR = secret.ascii;
                res.json({
                    ok: true,
                    usuario: userDB,
                    urlQR: data,
                    asciiSTR: AsciiSTR,
                    token
                });
            }
        });
    });
});

app.post('/register', function(req, res) {
    let body = req.body;
    //Create new user
    let user = new User({
        email: body.email,
        name: body.nombre,
        psw: bcrypt.hashSync(body.password, 10)
    });
    //Save user information on DB
    user.save((err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err,
            });
        }
        res.json({
            ok: true,
            user: userDB
        });
    });
});

app.post('/upload', function(req, res) {
    //When there is no files after pressing the upload button
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    //Save the file and the name of the file for upload
    let sampleFile = req.files.sampleFile;
    let fileName = sampleFile.name;
    //Move the file
    sampleFile.mv('public/files/' + fileName, function(err) {
        if (err)
            return res.status(500).send(err);
        else {
            //Generate signature
            let privKey = fs.readFileSync('keys/privateKey.pem', 'utf-8');

            let docToSign = fs.readFileSync('public/files/' + fileName);

            let signer = crypto.createSign('RSA-SHA256');
            signer.write(docToSign);
            signer.end();

            let signature = signer.sign(privKey, 'base64');

            fs.writeFileSync('public/signedfiles/signedDoc__' + fileName, signature);

            run().catch(error => console.error(error.stack));
            //Generate QR code
            async function run() {
                const res = await qrcode.toDataURL(signature);

                fs.writeFileSync('public/QR_Codes/QRCode_' + fileName + '.html', `<img src="${res}">`);
            } //Refresh page
            res.redirect('/home.html');
        }
    });
});

app.get('/files', async function(req, res) {
    let paths = await globby(['public/files/']);
    const Newpath = paths.map(function(x) {
        return x.replace('public/files/', '');
    });
    res.send(Newpath);
});

app.post('/verify', function(req, res) {
    //console.log(req.body.name);

    let nameDoc = req.body.name;

    let publKey = fs.readFileSync('keys/publicKey.pem', 'utf-8');

    let signatured2 = fs.readFileSync('public/signedfiles/signedDoc__' + nameDoc, 'utf-8');

    let docToSign = fs.readFileSync('public/files/' + nameDoc);

    // Verifier for the documents we uploaded
    let verifier = crypto.createVerify('RSA-SHA256');
    verifier.write(docToSign);
    verifier.end();

    // result = false or true, depending on the integrity of the file (modified/not modified)
    let result = verifier.verify(publKey, signatured2, 'base64');
    //console.log('Digital Signature Verification : ' + result);
    if (result == false) {
        return res.status(250).send('Failure');
    } else {
        return res.status(200).send('Success!');
    }
});

app.post('/verify6Digits', function(req, res) {
    let body = req.body;
    //Generate actual time of login
    let DATE = dateTime();
    let verified = speakeasy.totp.verify({
        secret: body.asciiSTR,
        encoding: 'ascii',
        token: body.digits6Code
    });

    if (verified == true) {
        //Save login information based on logins schema 
        let login = new Logins({
            name: body.name,
            email: body.mail,
            date: DATE
        });
        login.save((err, log) => {
            if (err) {
                console.log(err);
            }
        });
    }
    //Send to frontend the verification status
    res.json({
        verif: verified
    });
});

app.get('/userLogins', function(req, res) {
    let body = req.body;
    //Look for the logins in DB and send them to frontend
    Logins.find((erro, logins) => {
        if (erro) {
            return res.status(500).json({
                ok: false,
                err: erro
            });
        }
        res.json({
            logins
        });
    });
});

app.post('/edit', function(req, res) {
    //Save body from the response
    let body = req.body;
    //Find the user on the DB
    User.findOne({ email: body.actualEmail }, (errorFound, userDB) => {
        if (errorFound) {
            return res.status(500).json({
                ok: false,
                err: errorFound
            });
        }
        // Verify user existance 
        if (!userDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "No such user found, try again"
                }
            });
        } else { //We update if we find the user
            User.updateOne({ email: body.actualEmail }, {
                $set: {
                    "email": body.nEmail,
                    "name": body.nName,
                    "psw": bcrypt.hashSync(body.nPass, 10)

                }
            }, function(err, rslt) { //Send all data to frontend
                res.json({
                    ok: true,
                    email: body.nEmail,
                    nombre: body.nName,
                    contraseña: body.nPass
                })
            })
        }
    });
});

module.exports = app;