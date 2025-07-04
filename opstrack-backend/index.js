const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// convoy routes
const convoysRoute = require('./routes/convoys');
app.use('/api/convoys', convoysRoute);

// vehicle routes
const vehiclesRoute = require('./routes/vehicle');
app.use('/api/vehicles', vehiclesRoute);

// maintenance log routes
const maintenanceLogsRoute = require('./routes/maintenanceLog');
app.use('/api/logs', maintenanceLogsRoute);

// user routes
const usersRoute = require('./routes/user');
app.use('/api/users', usersRoute);


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
