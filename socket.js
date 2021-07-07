const e = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const io = require("socket.io")(process.env.PORT || 3333, {
    cors: {
        origin: "*",
    },
});
var app = new express()
const messages = require('./revmsg');
const revmsg = require("./revmsg");
let users = [];
let noactiverusers = []; //offline but msg store aakan with details
const prvmsgs = []; // online allatha usersnu vendi
const msgarray = []
const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
        users.push({ userId, socketId });


};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);

};
var removeByAttr = function(arr, attr, value) {
    var i = arr.length;
    while (i--) {
        if (arr[i] &&
            arr[i].hasOwnProperty(attr) &&
            (arguments.length > 2 && arr[i][attr] === value)) {

            arr.splice(i, 1);

        }
    }
    return arr;
}

const pendingmsg = (recid) => { // for cheking pending msgs
    const revid = noactiverusers.find((noactiverusers) => noactiverusers.to == recid)
    console.log(revid)
    if (revid == undefined) {

        var txt = "user not active"
        return txt
    } else {

        var txt = "user active"
        return txt
    }
}

const getUser = (to, msg, from) => {
    console.log(to)

    const found = users.find((user) => user.userId == to);
    console.log(found)
    if (found == undefined) {
        // !noactiverusers.some((noactiverusers) => noactiverusers.msg === msg) &&
        noactiverusers.push({ to, msg, from })
        console.log(noactiverusers)
        txt = "not active"

        return txt
    } else {

        return found

    }

};




io.on("connection", (socket) => {
    //when ceonnect
    console.log("a user connected.");

    var id
        //take userId and socketId from user 
    socket.on("addUser", (userId) => {

        addUser(userId, socket.id);
        const prevmsg = pendingmsg(userId)
        if (prevmsg == "user not active") {
            var txt = "still not active"
            console.log(txt)
        } else {
            var recid = noactiverusers.find((noactiverusers) => noactiverusers.to == userId)

            if (recid != undefined) {
                var recsockwetid = users.find((user) => user.userId == userId)

                var from = recid.from
                var msg = recid.msg
                var to = recid.to

                prvmsgs.push({ from, msg, to })

                // var MSG = search(to, noactiverusers);
                var MSG = noactiverusers.filter(noactiverusers => noactiverusers.to === to)
                console.log(MSG)

                console.log(from)
                io.to(recsockwetid.socketId).emit("prvmsgs", MSG); // sending prv msgs when user was not online
                id = recid.to
            }

        }
        io.emit("getUsers", users);
        console.log(users)
    });




    //send and get message 
    socket.on("sendMessage", (data) => {
        const rec = getUser(data.to, data.msg, data.from); // to recieve user id of the reciver  

        if (rec == "not active") {
            console.log("hi")
            const found = users.find((user) => user.userId === data.from)
            io.to(found.socketId).emit("getMessage", (rec));
            console.log(rec)


        } else {

            var socketid = users.find(user => user.userId === data.to).socketId; // to get live user s socket id
            console.log(socketid)
            var from = data.from
            var msg = data.msg
            var to = data.to


            io.to(socketid).emit("getMessage", ({ from, msg, to }));
        }

    });

    //when disconnect offline poyal aariyan
    socket.on("disconnect", (data) => {




        console.log("a user disconnected!");
        removeUser(socket.id);
        removeByAttr(noactiverusers, 'to', id)
        io.emit("getUsers", users);


    });
    socket.on("recmsg", async(data) => {
        console.log(data)
            // var result = data.find(obj => {
            //     return obj 
            //   });
        const remsg = new messages({
            msg: data.msg,
            from: data.from,
            to: data.to
        })
        try {
            const savmsg = await remsg.save()
            console.log(savmsg)
        } catch {
            console.log(err)
        }

    });

});



// this.websocketservice.emit("message",this.sendmessage)