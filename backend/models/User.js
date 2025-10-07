const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'contractor'] },
    class: { type: String },
    gstNumber: { type: String },
    panNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);