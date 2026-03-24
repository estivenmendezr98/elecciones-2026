const express = require('express');
const router = express.Router();
const { getElectionDetails, getCandidates } = require('../controllers/electionController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/details', protect, getElectionDetails);
router.get('/candidates', protect, getCandidates);

module.exports = router;
