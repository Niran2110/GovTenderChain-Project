const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // Distinguish between tender docs and bid docs
        const prefix = file.fieldname === 'tenderDocument' ? 'tender' : 'bid';
        cb(null, `${prefix}-${req.params.id || 'new'}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

const { 
    getAllTenders, getTenderById, createTender, deleteTender,
    awardTender, getMyBids, submitBid, approveMilestone 
} = require('../controllers/tenderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Contractor Routes
router.get('/mybids', protect, getMyBids);
router.post('/:id/bids', protect, upload.single('bidDocument'), submitBid);

// Public Routes
router.get('/', getAllTenders);
router.get('/:id', getTenderById);

// Admin Routes
// --- CHANGED: Added upload.single('tenderDocument') ---
router.post('/', protect, admin, upload.single('tenderDocument'), createTender);

router.delete('/:id', protect, admin, deleteTender);
router.put('/:id/award', protect, admin, awardTender);
router.put('/:id/milestones/:milestoneId/approve', protect, admin, approveMilestone);

module.exports = router;