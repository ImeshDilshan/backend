const mongoose =require("mongoose");
const bookingShema=mongoose.Schema({
    room:{
        type: String,
        required:true
    },
        roomid:{
        type: String,
        required:true
    },
    userid:{
        type: String,
        required:true
    },
    fromdate:{
        type: String,
        required:true
    },
    todate:{
        type: String,
        required:true
    },
    totalamount:{
        type: Number,
        required:true
    },
    totaldays:{
        type: Number,
        required:true
    },
    transactionId:{
        type: Number,
        required:true
    },
    status:{
        type: String,
        required:true,
        default:'booked'
    }
   
  },{
    timestamps:true

})
const bookingModel = mongoose.model('bookings',bookingShema);
module.exports = bookingModel