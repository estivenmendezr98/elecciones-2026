const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (fotos de candidatos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const votingRoutes = require('./routes/votingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const electionRoutes = require('./routes/electionRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/election', electionRoutes);

// Middleware de manejo de errores global (debe ir al final)
const errorHandler = require('./middlewares/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
