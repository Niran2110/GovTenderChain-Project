const Tender = require('../models/Tender');
const User = require('../models/User');

// 1. Create Tender
// Handles text data + file upload + JSON parsing for arrays
exports.createTender = async (req, res) => {
    try {
        let { 
            title, description, category, totalValue, 
            minTurnover, minExperience, 
            eligibleClasses, milestones, deadline 
        } = req.body;

        // Because we use FormData on the frontend, arrays arrive as JSON strings.
        // We must parse them back into JavaScript objects.
        if (typeof milestones === 'string') { 
            try { milestones = JSON.parse(milestones); } catch (e) {} 
        }
        if (typeof eligibleClasses === 'string') { 
            try { eligibleClasses = JSON.parse(eligibleClasses); } catch (e) {} 
        }

        const tenderData = {
            title, 
            description, 
            category, 
            totalValue, 
            minTurnover, 
            minExperience,
            eligibleClasses, 
            milestones, 
            deadline,
            // Save the file path if a document was uploaded
            tenderDocument: req.file ? req.file.path.replace(/\\/g, "/") : null
        };

        const newTender = new Tender(tenderData);
        const tender = await newTender.save();
        res.status(201).json(tender);
    } catch (err) {
        console.error("Create Tender Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 2. Submit Bid
// Handles contractor bid + file upload
exports.submitBid = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ msg: 'Tender not found' });
        
        // Validation Checks
        if (tender.status !== 'Open') {
            return res.status(400).json({ msg: 'Tender is not open for bidding' });
        }
        
        // Check if user has already bid
        const hasAlreadyBid = tender.bids.some(bid => bid.contractorId.toString() === req.user.id);
        if (hasAlreadyBid) {
            return res.status(400).json({ msg: 'You have already submitted a bid for this tender' });
        }
        
        // Check file and amount
        if (!req.file) return res.status(400).json({ msg: 'No bid document uploaded' });
        if (!req.body.bidAmount) return res.status(400).json({ msg: 'Bid amount is required' });
        
        const newBid = {
            contractorId: req.user.id,
            contractorName: req.user.name,
            bidDocument: req.file.path.replace(/\\/g, "/"), // Save file path
            bidAmount: Number(req.body.bidAmount),
            status: 'Pending'
        };

        tender.bids.push(newBid);
        await tender.save();
        res.status(201).json(tender);

    } catch (err) {
        console.error("Submit Bid Error:", err.message);
        res.status(500).json({ msg: err.message });
    }
};

// 3. Approve Milestone
// Uses robust logic to find and update nested array items
exports.approveMilestone = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ msg: 'Tender not found' });

        // Find the specific milestone by ID
        const milestone = tender.milestones.find(m => m._id.toString() === req.params.milestoneId);
        
        if (!milestone) {
            return res.status(404).json({ msg: 'Milestone not found' });
        }

        // Update status
        milestone.status = 'Approved';
        
        // CRITICAL: Tell Mongoose the array changed so it saves correctly
        tender.markModified('milestones'); 
        
        await tender.save();
        res.json(tender);
    } catch (err) {
        console.error("Approval Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 4. Extend Deadline (Admin Action)
exports.extendDeadline = async (req, res) => {
    try {
        const { newDeadline } = req.body;
        const tender = await Tender.findById(req.params.id);

        if (!tender) return res.status(404).json({ msg: 'Tender not found' });

        tender.deadline = newDeadline;
        tender.status = 'Open'; // Re-open the tender
        
        await tender.save();
        res.json(tender);
    } catch (err) {
        console.error("Extend Deadline Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 5. Award Tender (Manual Override if needed)
exports.awardTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        const { winnerBidId } = req.body;

        if (!tender) return res.status(404).json({ msg: 'Tender not found' });

        tender.bids.forEach(bid => {
            if (bid._id.toString() === winnerBidId) {
                bid.status = 'Awarded';
            } else {
                bid.status = 'Rejected';
            }
        });

        tender.status = 'In Progress';
        await tender.save();
        res.json(tender);
    } catch (err) {
        console.error("Award Tender Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 6. Get Contractor's Bids
exports.getMyBids = async (req, res) => {
    try {
        const tenders = await Tender.find({ 'bids.contractorId': req.user.id });
        res.json(tenders);
    } catch (err) {
        console.error("Get My Bids Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 7. Delete Tender
exports.deleteTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (tender) {
            await tender.deleteOne();
            res.json({ msg: 'Tender removed' });
        } else {
            res.status(404).json({ msg: 'Tender not found' });
        }
    } catch (err) {
        console.error("Delete Tender Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 8. Get All Tenders (Public)
exports.getAllTenders = async (req, res) => {
    try {
        const tenders = await Tender.find();
        res.json(tenders);
    } catch (err) {
        console.error("Get All Tenders Error:", err.message);
        res.status(500).send('Server error');
    }
};

// 9. Get Single Tender Details
exports.getTenderById = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ msg: 'Tender not found' });
        res.json(tender);
    } catch (err) {
        console.error("Get Tender By ID Error:", err.message);
        res.status(500).send('Server error');
    }
};