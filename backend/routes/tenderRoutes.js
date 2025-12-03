const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination(req, file, cb) { cb(null, 'uploads/'); },
    filename(req, file, cb) { 
        const prefix = file.fieldname === 'tenderDocument' ? 'tender' : 'bid';
        cb(null, `${prefix}-${req.params.id || 'new'}-${Date.now()}${path.extname(file.originalname)}`); 
    }
});
const upload = multer({ storage });

const { 
    getAllTenders, getTenderById, createTender, deleteTender,
    awardTender, getMyBids, submitBid, approveMilestone, extendDeadline 
} = require('../controllers/tenderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/mybids', protect, getMyBids);
router.post('/:id/bids', protect, upload.single('bidDocument'), submitBid);
router.get('/', getAllTenders);
router.get('/:id', getTenderById);
router.post('/', protect, admin, upload.single('tenderDocument'), createTender);
router.delete('/:id', protect, admin, deleteTender);
router.put('/:id/award', protect, admin, awardTender);
router.put('/:id/milestones/:milestoneId/approve', protect, admin, approveMilestone);

// --- NEW ROUTE ---
router.put('/:id/extend', protect, admin, extendDeadline);

module.exports = router;