const express = require('express');
const router = express.Router();
const { castVote, getMyVoteStatus } = require('../controllers/votingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, castVote);
router.get('/status', protect, getMyVoteStatus);

module.exports = router;
