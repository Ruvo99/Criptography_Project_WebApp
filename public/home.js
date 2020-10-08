let editTXT = document.getElementById("edit-user");
let editBTN = document.getElementById("editbtn");

editTXT.text = "Edit " + localStorage.usuario;

/* EVENT LISTENERS */

editBTN.addEventListener("click", function(event) {
    let newEmail = document.getElementById("newEmail").value;
    let newPassword = document.getElementById("newPassword").value;
    let newName = document.getElementById("newName").value;
    let obj = {
        actualEmail: localStorage.email,
        nEmail: newEmail,
        nPass: newPassword,
        nName: newName
    }
    edit(obj);
    event.preventDefault();
})

/* HTML Functions*/

function showfiles(data) {
    var filesList = `<table> 
    <tr>
        <th>Files</th>
        <th>QR Code(Advise: Press CTRL+Click to open on new window)</th>
        <th>Verify</th>
    </tr>
    {{files}}
    </table>`;

    var filesListItem = `<tr>
    <td>{{filename}}</td>
    <td><a href="/QR_Codes/QRCode_{{filename3}}.html">QR Code</a></td>
    <td><button onclick="verify('{{filename2}}')">Verify</button></td>
    <tr>`;
    let filesHTML = '';
    data.map(item => {
        filesHTML += filesListItem.replace('{{filename}}', item).replace('{{filename2}}', item).replace('{{filename3}}', item);
    });
    const tableHTML = filesList.replace('{{files}}', filesHTML);
    document.getElementById('fileTable').innerHTML = tableHTML;
}

function displayLogs(data) {
    let logs = `<table>
        <tr>
            <th>User name</th>
            <th>Email</th>
            <th>Login date-time</th>
        </tr>
        {{loginsTable}}
    </table>`;
    let logsItems = `<tr>
        <td>{{loginName}}</td>
        <td>{{loginEmail}}</td>
        <td>{{loginDate}}</td>
    </tr>`;
    let logsHTML = "";
    data.map(item => {
        logsHTML += logsItems.replace('{{loginName}}', item.name).replace('{{loginEmail}}', item.email).replace('{{loginDate}}', item.date);
    })
    let loginsTableHTML = logs.replace('{{loginsTable}}', logsHTML);
    document.getElementById("loginTABLE").innerHTML = loginsTableHTML;
}

/* HTTP REQUESTS FOR BACKEND */

function edit(datos) {
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('POST', `https://localhost:3030/edit`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send([JSON.stringify(datos)]);
    // 5. Once the server answers...
    xhr.onload = function() {
        if (xhr.status != 200) {
            alert('Something went wrong, try again\n' + xhr.statusText);
        } else if (xhr.status == 200) {
            alert('\n User data saved successfuly, log in again to see changes');
            window.location.href = "../index.html";
        }
    }
}

function viewfiles() {
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('GET', `https://localhost:3030/files`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send();
    // 5. Once the server answers...
    xhr.onload = function() {
        if (xhr.status != 200) {
            alert(xhr.status + ': ' + xhr.statusText + 'Error');
        } else {
            showfiles(JSON.parse(xhr.response));
        }
    }
}
viewfiles();

function verify(data) {
    let filename = {
        name: data,
    };
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('POST', `https://localhost:3030/verify`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send(JSON.stringify(filename));
    // 5. Once the server answers...
    xhr.onload = function() {

        if (xhr.status != 200) {
            alert('\n ' + xhr.responseText);
        } else if (xhr.status == 200) {
            alert('\n ' + xhr.responseText);
        }
    }
}

function logsDisplay() {
    // 1. Create XMLHttpRequest object
    let xhr = new XMLHttpRequest();
    // 2. Configure HTTP Operation
    xhr.open('GET', `https://localhost:3030/userLogins`);
    // 3. Type of data 
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 4. Send request
    xhr.send();
    // 5. Once the server answers...
    xhr.onload = function() {
        if (xhr.status != 200) {
            alert('\n ' + xhr.responseText);
        } else if (xhr.status == 200) {
            let res = JSON.parse(xhr.responseText).logins;
            displayLogs(res);
        }
    }
}
logsDisplay();