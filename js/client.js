//var testMsg;

$(document).ready(function () {

    var appUsers = [];
    var userNick = "";
    var socket = io();

    socket.on('connect', function () {
        console.log('connected');
    });

    /* socket.on('myEvent', function (data) {
        console.log('myEvent received');
        console.log(data);
    }); */

    socket.on('appUserUpdate', function (user) {
        //console.log("appUserUpdate event received : "+user);
        appUsers.push(user.toLowerCase());
        //console.log("Updated users : "+appUsers.join());
        addUser(user);
    });

    /*socket.on("broadcastedChatMessage", function (message) {
        //console.log("BroadcastedChatMessage : "+data);
        $("#messages").append(message.replace(/<(\/)?user>/g, "<$1b>"));
    });*/

    socket.on("appMessageUpdate", function (message) {
        //console.log("BroadcastedChatMessage : "+data);
        const msgKey = arrayBufferToString(message.key);
        const msgValue = arrayBufferToString(message.value); 
        //console.log("appMessageUpdate_key : "+msgKey+"\t\tappMessageUpdate_value : "+msgValue);
        //testMsg = message;
        //console.log(testMsg);
        $("#messages").append(msgValue.replace(/<(\/)?user>/g, "<$1b>"));
    });

    $("#postMessage").click(function () {
        const message = new Date().toLocaleString() + "<br/>" + "<user>" + userNick + "</user>: " + $("#message").val() + "<br/><br/>";
        $("#message").val('');
        socket.emit("chatMessage", message);
    });

    Swal.fire({
        title: 'Prepping up UI please wait',
        allowOutsideClick: () => false,
        onOpen: () => {
            Swal.showLoading();
        }
    });

    setTimeout(() => {
        Swal.close();
        setupUserNick();
    }, 5000);

    function setupUserNick() {
        //console.log("appUsers till this point"+appUsers.join());
        Swal.fire({
            title: 'Enter your nickname',
            input: 'text',
            inputValue: '',
            allowOutsideClick: false,
            showCancelButton: false,
            inputValidator: (nickname) => {
                if (!nickname || nickname.trim() == '') {
                    return 'Please enter a valid nickname';
                } else {
                    if ($.inArray(nickname.toLowerCase(), appUsers) != -1) {
                        showGreetMessage("Welcome back, " + nickname);
                    } else {
                        //send back user nick to server for adding it to queue
                        socket.emit('addUser', nickname);
                        showGreetMessage("Welcome, " + nickname);
                    }
                    userNick = nickname;
                    return nickname;
                }
            }
        });
    }

    function showGreetMessage(message) {
        Swal.fire({
            type: 'success',
            title: message,
            allowOutsideClick: () => false,
            showConfirmButton: false,
            timer: 1000, //dismiss after 2 seconds
        });
    }

    function addUser(user) {
        $("#usersList").append("<li>" + user + "</li>");
    }

    function arrayBufferToString(buffer) {
        const byteArray=new Uint8Array(buffer);
        let byteString = "";
        byteArray.forEach(byteVal => byteString+=String.fromCodePoint(byteVal));
        return byteString;
    }

});