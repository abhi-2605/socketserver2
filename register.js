const mongoose = require("mongoose");


// connect to cloud Database


const uri = "mongodb+srv://Qwerty2605:Qwerty2605@cluster0.pe6tb.mongodb.net/CHATDATA?retryWrites=true&w=majority";
mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("db connected1")
    })
    .catch(err => console.log(err))

// create Schema
const Schema = mongoose.Schema;

// define Schema structure for an user account
const registerSchema = new Schema({

    name: String,
    email: String,

    pass: String,
    num: String

});

var registerdata = mongoose.model("register", registerSchema);

// export model
module.exports = registerdata;