const mongoose = require('mongoose');

const tenderSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['Construction', 'IT & Software', 'Electrical', 'Maintenance', 'Supply'] 
    },
    totalValue: { type: Number, required: true },
    
    // --- NEW TECHNICAL REQUIREMENTS ---
    minTurnover: { type: Number, required: true }, // Minimum annual turnover required (Cr)
    minExperience: { type: Number, required: true }, // Minimum years of experience
    
    eligibleClasses: [{ type: String, required: true }],
    status: { type: String, default: 'Open' },
    tenderDocument: { type: String },
    deadline: { type: Date, required: true },

    bids: [{
        contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        contractorName: { type: String },
        bidDocument: { type: String },
        bidAmount: { type: Number, required: true },
        status: { type: String, enum: ['Pending', 'Awarded', 'Rejected', 'Disqualified'], default: 'Pending' },
    }],
    milestones: [{
        name: { type: String },
        payoutAmount: { type: Number },
        status: { type: String, default: 'Pending' },
        proofImage: { type: String, default: '' },
        aiAnalysis: { type: String, default: '' }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Tender', tenderSchema);