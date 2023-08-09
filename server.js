// const express= require("express");

// const app= express();
// const dbconfig =require('./db')
// const bookingRoute=require('./routes/bookingRoute');


// app.use(express.json());
// // app.use('/api/rooms', roomsRoute);
// // app.use('/api/users', usersRoute);
// app.use('/api/bookings', bookingRoute);
// const port= process.env.PORT||5000;

// app.listen(port,()=> console.log(`node server started nodemon`));
const express = require('express');
const bodyParser = require('body-parser');
const bookingRoute = require('./routes/bookingRoute'); // Correct the relative path to bookingRoute.js

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use('/api/bookings', bookingRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
