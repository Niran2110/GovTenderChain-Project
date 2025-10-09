const Tender = require('../models/Tender');
const User = require('../models/User');

// --- ADD THIS NEW FUNCTION ---
exports.submitBid = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) {
            return res.status(404).json({ msg: 'Tender not found' });
        }
        if (tender.status !== 'Open') {
            return res.status(400).json({ msg: 'Tender is not open for bidding' });
        }

        // Check if user has already bid
        const hasAlreadyBid = tender.bids.some(bid => bid.contractorId.toString() === req.user.id);
        if (hasAlreadyBid) {
            return res.status(400).json({ msg: 'You have already submitted a bid for this tender' });
        }
        
        const newBid = {
            contractorId: req.user.id,
            contractorName: req.user.name,
            bidDocument: req.body.bidDocument, // We're saving the filename for this simulation
            status: 'Pending' // Default status
        };

        tender.bids.push(newBid);
        await tender.save();
        res.status(201).json(tender);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Your other functions remain below ---

exports.awardTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        const { winnerBidId } = req.body;

        if (!tender) {
            return res.status(404).json({ msg: 'Tender not found' });
        }

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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMyBids = async (req, res) => {
    try {
        const tenders = await Tender.find({ 'bids.contractorId': req.user.id });
        res.json(tenders);
    } catch (err) {
        console.error(err.message);
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

exports.createTender = async (req, res) => {
    const { title, description, totalValue, eligibleClasses, milestones } = req.body;
    try {
        const newTender = new Tender({ title, description, totalValue, eligibleClasses, milestones });
        const tender = await newTender.save();
        res.status(201).json(tender);
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

