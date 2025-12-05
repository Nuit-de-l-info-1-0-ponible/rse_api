const EcoCheckerService = require('../services/EcoCheckerService');

class EcoController {
  /**
   * Analyse un site web
   */
  async checkWebsite(req, res) {
    try {
      const { url, use_cache = 'true', include_details = 'true' } = req.query;
      
      if (!url) {
        return res.status(400).json({
          error: 'URL requise',
          message: 'Le paramètre "url" est obligatoire'
        });
      }
      
      const useCache = use_cache === 'true';
      const includeDetails = include_details === 'true';
      
      const result = await EcoCheckerService.checkWebsite(url, useCache);
      
      // Si on ne veut pas les détails
      if (!includeDetails) {
        delete result.details;
        delete result.recommendations;
      }
      
      res.json({
        success: true,
        data: result,
        meta: {
          cached: useCache,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse',
        message: error.message
      });
    }
  }

  /**
   * Récupère les données du bandeau
   */
  async getBanner(req, res) {
    try {
      /*const { url } = req.params;
      const { style = 'default' } = req.query;*/
      const url = req.query.url;
      
      if (!url) {
        return res.status(400).json({
          error: 'URL requise',
          message: 'Le paramètre "url" est obligatoire'
        });
      }
      
      const bannerData = await EcoCheckerService.getBannerData(url, style);
      
      res.json({
        success: true,
        data: bannerData,
        meta: {
          style,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Banner error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du bandeau',
        message: error.message
      });
    }
  }

  /**
   * Vérifie la santé de l'API
   */
  async healthCheck(req, res) {
    const services = {
      website_carbon: 'operational',
      green_web: 'operational',
      cache: 'operational'
    };
    
    // Tester les APIs externes
    try {
      const axios = require('axios');
      
      // Tester Website Carbon API
      try {
        await axios.get('https://api.websitecarbon.com', { timeout: 5000 });
      } catch {
        services.website_carbon = 'degraded';
      }
      
      // Tester Green Web API
      try {
        await axios.get('https://api.thegreenwebfoundation.org', { timeout: 5000 });
      } catch {
        services.green_web = 'degraded';
      }
      
    } catch (error) {
      services.external_apis = 'unavailable';
    }
    
    res.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services
    });
  }

  /**
   * Statistiques de l'API
   */
  async getStats(req, res) {
    const cacheStats = EcoCheckerService.getCacheStats();
    
    res.json({
      cache: cacheStats,
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      },
      requests: {
        // Vous pourriez ajouter un compteur de requêtes ici
        cached: cacheStats.size
      }
    });
  }

  /**
   * Vide le cache
   */
  async clearCache(req, res) {
    try {
      const cleared = EcoCheckerService.clearCache();
      
      res.json({
        success: true,
        message: 'Cache vidé avec succès',
        itemsCleared: cleared,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors du vidage du cache',
        message: error.message
      });
    }
  }
}

module.exports = new EcoController();