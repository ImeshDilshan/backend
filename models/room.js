const mongoose =require("mongoose");
const roomShema=mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    maxcount:{
        type: Number,
        required:true
    },
    phonenumber:{
        type: Number,
        required:true
    },
    rentperday:{
        type: Number,
        required:true
    },
    imageUrls:[],
    currentbookings:[],
    type:{
        type: String,
        required:true

    },
    description :{
        type:String,
        required:true
    }
  },{
    timestamps:true

})
const roomModel = mongoose.model('rooms',roomShema);
module.exports = roomModel