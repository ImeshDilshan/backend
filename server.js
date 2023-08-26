const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bookingRoute = require('./routes/bookingRoute');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors()); // Allow all origins, you can customize this if needed

app.use('/api/bookings', bookingRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
