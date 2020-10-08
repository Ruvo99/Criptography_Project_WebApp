//Submit buttons from Index
let registerbtn = document.getElementById("registerbtn");
let loginbtn = document.getElementById("loginbtn");
let checkbtn = document.getElementById("checkbtn");

/* EVENT LISTENERS FOR SUBMIT BUTTONS */
registerbtn.addEventListener("click", function(event) {
    let obj = {
        email: document.getElementById("registerEmail").value,
        nombre: document.getElementById("registerName").value,
        password: document.getElementById("registerPsw").value,
    }
    register(obj);
    event.preventDefault();
});

loginbtn.addEventListener("click", function(event) {
    let obj = {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPsw").value,
    }
    login(obj);
    event.preventDefault();
});

checkbtn.addEventListener("click", function(event) {
    let digits6 = document.getElementById("6DigitCode").value
    let obj = {
        asciiSTR: localStorage.ascii,
        digits6Code: digits6,
        mail: localStorage.email,
        name: localStorage.usuario
    }
    verify6Digits(obj);
    event.preventDefault();
});


/* HTTP REQUESTS TO BACKEND */

function register(datos) {
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('POST', `https://localhost:3030/register`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send([JSON.stringify(datos)]);
    // 5. Once the server answers...
    xhr.onload = function() {
        if (xhr.status != 200) {
            alert('User with this mail already exists, try another one\n' + xhr.statusText);
        } else if (xhr.status == 200) {
            alert('\n User registered successfuly');
            window.location.href = "../index.html";
        }
    };

}

function verify6Digits(datos) {
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('POST', `https://localhost:3030/verify6Digits`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send([JSON.stringify(datos)]);
    // 5. Once the server answers...
    xhr.onload = function() {
        if (xhr.status != 200) {
            alert('Error, try again\n' + xhr.statusText);
        } else if (xhr.status == 200) {
            let res = JSON.parse(xhr.responseText);
            if (res.verif == true) {
                alert('\n Login successful');
                window.location.href = "./home.html";
            } else {
                alert('\n 6 digit code is incorrect, try again');
            }
        }
    }
}

function login(datos) {
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('POST', `https://localhost:3030/login`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send([JSON.stringify(datos)]);
    // 5. Once the server answers...
    xhr.onload = function() {
        if (xhr.status != 200) {
            alert('Error\n' + xhr.statusText);
        } else if (xhr.status == 200) {
            let res = JSON.parse(xhr.responseText);
            localStorage.setItem("usuario", res.usuario.name);
            localStorage.setItem("urlQR", res.urlQR);
            localStorage.setItem("ascii", res.asciiSTR);
            localStorage.setItem("email", res.usuario.email);
            document.getElementById("authenticatorForm").setAttribute("style", "display: block");
            document.getElementById("QRCodeImg").setAttribute("src", localStorage.urlQR);
        }
    };
}