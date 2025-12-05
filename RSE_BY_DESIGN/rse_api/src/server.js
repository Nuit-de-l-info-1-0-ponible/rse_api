const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import des routes
const apiRoutes = require('./routes/api');

// Initialisation de l'app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static('public'));

// Routes
app.use('/api/v1', apiRoutes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: '🌱 Eco Checker API',
    version: '1.0.0',
    endpoints: {
      check: 'GET /api/v1/check?url=...',
      banner: 'GET /api/v1/banner?url=...',
      health: 'GET /api/v1/health',
      stats: 'GET /api/v1/stats'
    },
    documentation: '/docs',
    status: 'running'
  });
});

// Page de documentation
app.get('/docs', (req, res) => {
  res.sendFile(__dirname + '/public/docs.html');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path
  });
});

// Middleware d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`
  =====================================
  🚀 Eco Checker API démarrée !
  =====================================
  📍 Local: http://localhost:${PORT}
  📍 Network: http://${getLocalIP()}:${PORT}
  📍 Environnement: ${process.env.NODE_ENV}
  📍 Documentation: http://localhost:${PORT}/docs
  =====================================
  `);
});

// Fonction pour obtenir l'IP locale
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}