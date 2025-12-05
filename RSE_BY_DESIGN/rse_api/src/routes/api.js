const express = require('express');
const router = express.Router();
const EcoController = require('../controllers/ecoController');

/**
 * @route GET /api/v1/check
 * @desc Analyse un site web
 * @access Public
 */
router.get('/check', EcoController.checkWebsite);

/**
 * @route GET /api/v1/banner/:url
 * @desc Récupère les données pour le bandeau
 * @access Public
 */
router.get('/banner', EcoController.getBanner);


/**
 * @route GET /api/v1/health
 * @desc Vérifie la santé de l'API
 * @access Public
 */
router.get('/health', EcoController.healthCheck);

/**
 * @route GET /api/v1/stats
 * @desc Récupère les statistiques
 * @access Public
 */
router.get('/stats', EcoController.getStats);

/**
 * @route DELETE /api/v1/cache
 * @desc Vide le cache
 * @access Public
 */
router.delete('/cache', EcoController.clearCache);

module.exports = router;