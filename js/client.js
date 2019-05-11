
$(document).ready(function(){
    
    var appUsers = [];
    var socket = io('https://nodesample201.herokuapp.com');
    
    socket.on('connect', function(){
        console.log('connected');
    });
    
    /*socket.on('myevent', function(data){
        console.log('myevent triggered. Data received : \n');
        console.log(data);
    });*/
    
    socket.on('appUserUpdate', function(data){
        //console.log('myevent triggered. Data received : \n');
        //console.log(data);
        appUsers.push(data);
        addUser(data);
    });
    
    socket.on('disconnect', function(){
        console.log('disconnected');
    });
    
    /*Swal.fire({
        title: 'Loading page contents',
        allowOutsideClick: () => false,
        onOpen: () => {
            Swal.showLoading();
        }
    });*/
    
    setTimeout(()=>{
        if(Swal.isLoading()){
            Swal.close();
        }
        setUserNick();
    }, 10000);
    
    function setUserNick(){
        Swal.fire({
            title: 'Enter your nickname',
            input: 'text',
            inputValue: inputValue,
            showCancelButton: false,
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter a valid nickname'
                } else {
                    if(nickname in appUsers){
                        Swal.fire({
                            type: 'success',
                            type: 'Welcome back, '+nickname,
                            allowOutsideClick: () => false,
                            showConfirmButton: false,
                            timer: 1000, //dismiss after 2 seconds
                        });
                    } else {
                        //send back user nick to server for adding it to queue
                        socket.emit('addUser', nickname);
                        Swal.fire({
                            type: 'success',
                            title: 'Welcome, '+nickname,
                            allowOutsideClick: () => false,
                            showConfirmButton: false,
                            timer: 1000, //dismiss after 2 seconds
                        });
                    }
                    return nickname;
                }
              }
        });
        
        var nickname = prompt("Please enter your nickname", "");
        if (nickname != null && nickname.trim() != '') {
            if(nickname in appUsers){
                alert("Welcome back, "+nickname );
            } else {
                //send back user nick to server for adding it to queue
                socket.emit('addUser', nickname);
                alert("Welcome, "+nickname );
            }
        }
    }
    
    function addUser(user) {
        var usersList = document.getElementById("usersList");
        var userNode = document.createElement("li");
        userNode.innerHTML = user;
        usersList.appendChild(userNode);
    }
    
    function postMessage() {
        var message = document.getElementById("message");
        document.getElementById("messages").appendChild(document.createTextNode(message.value));
        document.getElementById("messages").appendChild(document.createElement("br"));
        document.getElementById("messages").appendChild(document.createElement("br"));
        message.value = "";
    }
    
    function checkUser() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState === 4 && xhttp.status === 200) {
                //document.getElementById("demo").innerHTML = this.responseText;
                //alert("response : "+xhttp.responseText);
                console.log("response : "+xhttp.responseText);
                const responseJson = JSON.parse(xhttp.responseText);
                responseJson.users.forEach(user => addUser(user));
            }
        };
        xhttp.open("GET", "https://nodesample201.herokuapp.com/checkUser", false);
        xhttp.send();
    }

});