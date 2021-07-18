const e = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const fs = require('fs');
const io = require("socket.io")(process.env.PORT || 3333, {
    cors: {
        origin: "*",
    },
});
var app = new express()
const messages = require('./revmsg');
const blockusers = require('./blockeuser')
const muteduser = require('./muteusers')
const register = require('./register')
const { ConnectionStates } = require("mongoose");
// const muteusers = require("./muteusers");
let users = [];
let noactiverusers = []; //offline but msg store aakan with details
const prvmsgs = []; // online allatha usersnu vendi
let blockedarray = []
let mutearray = []
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

var removeblockuser = function(arr, value1, value2) {

    const doc = blockedarray.filter((user) => user.blockedby == value1)
    console.log(doc + "reavhed here?")
    if (doc != "") {
        var blockeduser = doc.find((x) => x.blockeduser == value1).blockeduser

        var blockedby = doc.find((x) => x.blockeduser == value1).blockedby
    }
    const id = blockedarray.indexOf({ "blockeduser": blockeduser, "blockedby": blockedby });
    const ary = blockedarray.splice(id, 1);

    return ary
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

    const doc = blockedarray.filter((user) => user.blockedby == to)
    console.log(doc)
    if (doc != "") {
        var blockeduser = doc.find((x) => x.blockeduser == from).blockeduser

        var blockedby = doc.find((x) => x.blockeduser == from).blockedby
    }
    if (found == undefined) {
        // !noactiverusers.some((noactiverusers) => noactiverusers.msg === msg) &&
        if (blockeduser == from && blockedby == to) {
            console.log("you are blocked")
            txt = "not active"

            return txt
        } else {
            noactiverusers.push({ to, msg, from })
            console.log(noactiverusers)
            txt = "not active"


            return txt
        }
    } else {

        if (blockeduser == from && blockedby == to) {
            console.log("you are blocked")
            txt = "blockeduser"

            return txt
        } else {
            return found
        }


    }

};



var temp
var blockcheck
io.on("connection", (socket) => {
    //when ceonnect
    console.log("a user connected.");

    var id
        //take userId and socketId from user 
    socket.on("addUser", (userId) => {
        blockcheck = userId
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
                // var MSG = noactiverusers.filter(noactiverusers => noactiverusers.to === to)
                console.log(MSG)

                console.log(from)

                const doc = blockedarray.filter((user) => user.blockedby == to)
                console.log(doc)
                if (doc != "") {
                    var blockeduser = doc.find((x) => x.blockeduser == from).blockeduser

                    var blockedby = doc.find((x) => x.blockeduser == from).blockedby
                }
                if (blockeduser == from && blockedby == to) {
                    console.log("you are blocked")
                    txt = "blockeduser"

                    return txt
                } else {
                    var MSG = noactiverusers.filter(noactiverusers => noactiverusers.to === to)
                    io.to(recsockwetid.socketId).emit("prvmsgs", MSG); // sending prv msgs when user was not online
                    id = recid.to
                }
            }

        }
        io.emit("getUsers", users);
        console.log(users)
    });


    var temp



    socket.on('muteusercheck', async(data) => {

            console.log(data)
            try {





                const save = await muteduser.find({ mutedby: data });
                var senderid = users.find(user => user.userId == data).socketId
                if (save != "") {
                    io.to(senderid).emit('mutecheck', save)
                    console.log(save)
                }




            } catch {
                console.log(err)
            }
        })
        //send and get message 
    socket.on("sendMessage", (data) => {
        const rec = getUser(data.to, data.msg, data.from); // to recieve user id of the reciver  

        if (rec == "not active") {
            console.log("hi")
            const found = users.find((user) => user.userId === data.from)
            io.to(found.socketId).emit("getMessage", (rec));
            console.log(rec)

        } else if (rec == "blockeduser") {
            console.log("suc blocked")
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

    socket.on('blockuser', async(data) => {
        const userblocked = new blockusers({
            blockeduser: data.blockeduser,
            blockedby: data.blockedby
        })

        try {
            await userblocked.save()
            const save = await blockusers.findOne({ blockeduser: data.blockeduser, blockedby: data.blockedby });
            blockedarray.push(save)
            console.log(blockedarray)


        } catch {
            console.log(err)
        }
    })


    socket.on("blocklive", async(data) => {
        try {
            let doc = await blockusers.findOne({ blockeduser: data.block, blockedby: data.by });

            if (doc) {
                var senderid = users.find(user => user.userId === data.by).socketId

                io.to(senderid).emit("block", ("blocked"))
            }

        } catch (e) {
            console.error(e);
        }
    });
    socket.on('unblock', async(data) => {
            try {
                await blockusers.deleteOne({ blockeduser: data.blockeduser, blockedby: data.by })
                var abc = removeblockuser(blockedarray, 'blockeduser', data.blockeduser, 'blockedby', data.blockedby)
                console.log(abc + "removed ?")
            } catch (e) {
                console.log(e)
            }
        })
        // socket.on("checkblock", async(data) => {
        //     try {
        //         let doc = await blockusers.findOne({ blockeduser: data.blockeduser, blockedby: data.blockedby });
        //         if (doc) {
        //             console.log("blocked")
        //         } else {
        //             return found
        //         }

    //     } catch (e) {
    //         console.error(e);
    //     }
    // });
    socket.on('muteuser', async(data) => {
        const muteuser = new muteduser({
            muteduser: data.muteduser,
            mutedby: data.mutedby
        })

        try {
            await muteuser.save()


            console.log(mutearray)


        } catch {
            console.log(err)
        }
    })

    socket.on('getallfrnds', async(data) => {
        var senderid = users.find(user => user.userId == data).socketId
        try {
            register.find({ _id: { $nin: data } }).select('_id') // selects all the id which is not equal to the given id
                .then(function(data) {

                    if (data) {
                        console.log(data)

                        io.to(senderid).emit('allfrnds', data)
                    } else {
                        res.json({ id: "null", name: "NO SUCH USER REGISTERED" })
                    }

                });
        } catch (e) {
            console.log(e)
        }
    })

    socket.on("muteuserdel", async(data) => {
        console.log(data)
        try {
            await muteduser.deleteOne({ muteduser: data.muteduser, mutedby: data.mutedby })
        } catch (e) {
            console.log(e)

        }
    })

});





// var senderid = users.find(user => user.userId === data.blockedby).socketId
// io.to(senderid).emit("block", ("blockeduser"))

// this.websocketservice.emit("message",this.sendmessage)