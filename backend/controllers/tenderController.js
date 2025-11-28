const Tender = require('../models/Tender');
const User = require('../models/User');

// 1. Create Tender (Updated with Technical Requirements)
exports.createTender = async (req, res) => {
    try {
        let { 
            title, description, category, totalValue, 
            minTurnover, minExperience, // NEW FIELDS
            eligibleClasses, milestones, deadline 
        } = req.body;

        if (typeof milestones === 'string') { try { milestones = JSON.parse(milestones); } catch (e) {} }
        if (typeof eligibleClasses === 'string') { try { eligibleClasses = JSON.parse(eligibleClasses); } catch (e) {} }

        const tenderData = {
            title, description, category, totalValue, 
            minTurnover, minExperience, // Save fields
            eligibleClasses, milestones, deadline,
            tenderDocument: req.file ? req.file.path.replace(/\\/g, "/") : null
        };

        const newTender = new Tender(tenderData);
        const tender = await newTender.save();
        res.status(201).json(tender);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- KEEP ALL OTHER FUNCTIONS EXACTLY THE SAME ---
// (submitBid, approveMilestone, awardTender, getMyBids, deleteTender, getAllTenders, getTenderById)

exports.submitBid = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ msg: 'Tender not found' });
        if (tender.status !== 'Open') return res.status(400).json({ msg: 'Tender is not open for bidding' });

        const hasAlreadyBid = tender.bids.some(bid => bid.contractorId.toString() === req.user.id);
        if (hasAlreadyBid) return res.status(400).json({ msg: 'You have already submitted a bid' });
        
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        if (!req.body.bidAmount) return res.status(400).json({ msg: 'Bid amount is required' });
        
        const newBid = {
            contractorId: req.user.id,
            contractorName: req.user.name,
            bidDocument: req.file.path.replace(/\\/g, "/"),
            bidAmount: Number(req.body.bidAmount),
            status: 'Pending'
        };

        tender.bids.push(newBid);
        await tender.save();
        res.status(201).json(tender);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.approveMilestone = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ msg: 'Tender not found' });
        const milestone = tender.milestones.find(m => m._id.toString() === req.params.milestoneId);
        if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

        milestone.status = 'Approved';
        tender.markModified('milestones'); 
        await tender.save();
        res.json(tender);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

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
        res.status(500).send('Server Error');
    }
};

exports.getMyBids = async (req, res) => {
    try {
        const tenders = await Tender.find({ 'bids.contractorId': req.user.id });
        res.json(tenders);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

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
        res.status(500).send('Server Error');
    }
};

exports.getAllTenders = async (req, res) => {
    try {
        const tenders = await Tender.find();
        res.json(tenders);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getTenderById = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ msg: 'Tender not found' });
        res.json(tender);
    } catch (err) {
        res.status(500).send('Server error');
    }
};