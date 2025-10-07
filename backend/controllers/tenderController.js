const Tender = require('../models/Tender');

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