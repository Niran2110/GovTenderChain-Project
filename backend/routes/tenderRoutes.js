
const express = require('express');
const router = express.Router();
const { 
    getAllTenders, 
    getTenderById, 
    createTender, 
    deleteTender,
    awardTender,
    getMyBids,
    submitBid
} = require('../controllers/tenderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route for contractors to get their bids
router.get('/mybids', protect, getMyBids);

// Public routes
router.get('/', getAllTenders);
router.get('/:id', getTenderById);

// Protected route for contractors to submit a bid
router.post('/:id/bids', protect, submitBid);

// Admin-only routes
router.post('/', protect, admin, createTender);
router.delete('/:id', protect, admin, deleteTender);
router.put('/:id/award', protect, admin, awardTender);

module.exports = router;
