const mongoose = require('mongoose');

const tenderSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    totalValue: { type: Number, required: true },
    eligibleClasses: [{ type: String, required: true }],
    status: { type: String, default: 'Open' },
    bids: [{
        contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        contractorName: { type: String },
        bidDocument: { type: String },
        awarded: { type: Boolean, default: false },
    }],
    milestones: [{
        name: { type: String },
        payoutAmount: { type: Number },
        status: { type: String, default: 'Pending' },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Tender', tenderSchema);