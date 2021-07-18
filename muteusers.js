const mongoose = require("mongoose");
const uri = "mongodb+srv://Qwerty2605:Qwerty2605@cluster0.pe6tb.mongodb.net/CHATDATA?retryWrites=true&w=majority";
mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("db connected7")
    })

//creating a schema
const mutedusers = new mongoose.Schema({

    muteduser: {
        type: String
    },
    mutedby: {
        type: String
    }



});

module.exports = mongoose.model("mutedusers", mutedusers);