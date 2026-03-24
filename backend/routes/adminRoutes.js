const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getResults,
    getVoters,
    createVoter,
    deleteVoter,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getMunicipios,
    changeElectionStatus
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { voterValidationRules, candidateValidationRules } = require('../middlewares/validators/adminValidator');

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/candidates/'));
    },
    filename: function (req, file, cb) {
        // Generar un nombre único basado en fecha y el nombre original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    // Sin límite de tamaño
});

// Middleware aplicado a todas las rutas admin
router.use(protect, adminOnly);

router.get('/results', getResults);
router.get('/voters', getVoters);
router.post('/voters', voterValidationRules, createVoter);
router.delete('/voters/:id', deleteVoter);
router.post('/candidates', upload.single('foto'), candidateValidationRules, createCandidate);
router.put('/candidates/:id', upload.single('foto'), candidateValidationRules, updateCandidate);
router.delete('/candidates/:id', deleteCandidate);
router.get('/municipios', getMunicipios);
router.put('/election/status', changeElectionStatus);

module.exports = router;
