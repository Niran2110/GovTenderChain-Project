
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Tender = require('./models/Tender'); // Import the Tender model

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// API Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tenders', require('./routes/tenderRoutes'));

// Connect to Database
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected...');
        
        // --- TEMPORARY DEBUG CODE ---
        // This will run once after connecting to the database
        console.log('\nChecking content of the "tenders" collection...');
        Tender.find()
            .then(tenders => {
                if (tenders.length > 0) {
                    console.log(`✅ Found ${tenders.length} tenders in the database:`);
                    tenders.forEach(t => console.log(`   - ${t.title}`));
                } else {
                    console.log('❌ Found 0 tenders. The "tenders" collection is empty.');
                }
                console.log('--- End of check ---\n');
            })
            .catch(err => console.error('Error checking tenders:', err));
        // --- END OF DEBUG CODE ---

    })
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
