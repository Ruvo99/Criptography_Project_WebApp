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
const zlib = require('zlib');

const AppendInitVect = require('./appendInitVect');

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
        //console.log(userDB);
        // Authentication token
        let token = jwt.sign({
            usuario: userDB,
        }, process.env.SEED_AUTENTICACION, {
            expiresIn: process.env.CADUCIDAD_TOKEN
        });
        res.json({
            ok: true,
            usuario: userDB,
            token
        });
        //QR code generation for authentication

    });
});

app.post('/register', function(req, res) {
    let body = req.body;
    let str = "Code for user " + body.nombre + " on Upload System";
    let secret = speakeasy.generateSecret({
        name: str
    });
    //Create new user
    let user = new User({
        email: body.email,
        name: body.nombre,
        psw: bcrypt.hashSync(body.password, 10),
        secret: secret.ascii
    });
    //Save user information on DB
    user.save((err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err,
            });
        }
        //Send qrcode to frontend
        qrcode.toDataURL(secret.otpauth_url, function(err, data) {
            if (err) {
                throw err;
            } else {
                res.json({
                    ok: true,
                    user: userDB,
                    urlQR: data
                });
            }
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
    let str = "Code for user " + body.nName + " on Upload System";
    //Generate new secret
    let secret = speakeasy.generateSecret({
        name: str
    });
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
                    "psw": bcrypt.hashSync(body.nPass, 10),
                    "secret": secret.ascii
                }
            }, function(err, rslt) { //Send all data to frontend
                qrcode.toDataURL(secret.otpauth_url, function(err, data) {
                    if (err) {
                        throw err;
                    } else {
                        res.json({
                            ok: true,
                            urlQR: data
                        });
                    }
                });
            });
        }
    });
});

app.post('/encryption', function(req, res) {
    // Generate a secure, pseudo random initialization vector.
    const initVect = crypto.randomBytes(16);
    // Generate a cipher key from the password.
    const encryptionKey = fs.readFileSync('keys/encriptionKey.pem');
    const readStream = fs.createReadStream('public/files/' + req.body.file);
    const gzip = zlib.createGzip();
    const cipher = crypto.createCipheriv('aes256', encryptionKey, initVect);
    const appendInitVect = new AppendInitVect(initVect);
    // Create a write stream with a different file extension.
    const writeStream = fs.createWriteStream('public/files/' + req.body.file + '.enc');
    readStream
        .pipe(gzip)
        .pipe(cipher)
        .pipe(appendInitVect)
        .pipe(writeStream);
    fs.unlinkSync('public/files/' + req.body.file);
    res.send("File Encrypted");
});

app.post('/decryption', function(req, res) {
    const readInitVect = fs.createReadStream('public/files/' + req.body.file, { end: 15 });

    // Wait to get the initVect.
    let initVect;
    readInitVect.on('data', (chunk) => {
        initVect = chunk;
    });
    let errors = 0;
    // Once we’ve got the initialization vector, we can decrypt the file.
    readInitVect.on('close', () => {
        const encryptionKey = fs.readFileSync('keys/encriptionKey.pem');
        const readStream = fs.createReadStream('public/files/' + req.body.file, { start: 16 });
        const decipher = crypto.createDecipheriv('aes256', encryptionKey, initVect);
        const unzip = zlib.createUnzip();
        const writeStream = fs.createWriteStream('public/files/' + req.body.file + '.unenc');


        readStream
            .pipe(decipher).on('error', err => {
                console.log(err);
                errors = 1;
                console.log(errors);

            })
            .pipe(unzip).on('error', err => {
                console.log(err);
                errors = 2;
                console.log(errors);

            })
            .pipe(writeStream).on('error', err => {
                console.log(err);
                errors = 3;
                console.log(errors);
            });
        writeStream.on('open', function() {
            var filename = 'public/files/' + req.body.file.replace(".enc", "").replace(".unenc", "");
            fs.rename('public/files/' + req.body.file + '.unenc', filename, function(err) {
                if (err) throw err;
                console.log('Errors: ', errors);
                fs.unlinkSync('public/files/' + req.body.file);
                res.send("File Decrypted");
            });
        });
    });

});

module.exports = app;