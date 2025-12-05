const ExternalAPIService = require('./ExternalAPIService');

class EcoCheckerService {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = parseInt(process.env.CACHE_DURATION) || 3600000; // 1 heure
    this.maxCacheSize = parseInt(process.env.MAX_CACHE_SIZE) || 100;
    
    // Nettoyer le cache périodiquement
    setInterval(() => this.cleanCache(), 300000); // Toutes les 5 minutes
  }

  /**
   * Analyse complète d'un site web
   */
  async checkWebsite(url, useCache = true) {
    // Nettoyer l'URL
    const cleanURL = this.cleanURL(url);
    
    // Clé de cache
    const cacheKey = this.generateCacheKey(cleanURL);
    
    // Vérifier le cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        console.log(`Cache hit for: ${cleanURL}`);
        return cached.data;
      }
    }
    
    try {
      // Appeler les APIs en parallèle
      const [carbonResult, greenResult, efficiencyResult] = await Promise.all([
        ExternalAPIService.checkWebsiteCarbon(cleanURL),
        ExternalAPIService.checkGreenWeb(cleanURL),
        ExternalAPIService.analyzeEfficiency(cleanURL)
      ]);
      
      // Calculer le score
      const score = this.calculateScore(
        carbonResult.data,
        greenResult.data
      );
      
      // Générer les résultats
      const result = {
        url: cleanURL,
        score: this.roundScore(score),
        ecoLevel: this.getEcoLevel(score),
        timestamp: new Date().toISOString(),
        banner: this.generateBannerData(score),
        details: {
          carbonFootprint: carbonResult.data,
          greenHosting: greenResult.data,
          efficiency: efficiencyResult.data
        },
        recommendations: this.generateRecommendations(
          carbonResult.data,
          greenResult.data
        ),
        cacheKey: cacheKey
      };
      
      // Mettre en cache
      if (useCache) {
        this.setCache(cacheKey, result);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error checking website:', error);
      throw new Error(`Échec de l'analyse: ${error.message}`);
    }
  }

  /**
   * Récupère uniquement les données pour le bandeau
   */
  async getBannerData(url, style = 'default') {
    const result = await this.checkWebsite(url, true);
    
    const banner = result.banner;
    
    // Adapter selon le style
    switch (style) {
      case 'minimal':
        banner.message = `🌱 ${result.score}/100`;
        break;
      case 'detailed':
        banner.additionalInfo = {
          level: result.ecoLevel,
          hosting: result.details.greenHosting.green ? 'Vert' : 'Standard'
        };
        break;
    }
    
    return banner;
  }

  /**
   * Calcule le score d'éco-responsabilité
   */
  calculateScore(carbonData, greenData) {
    let score = 50; // Score de base
    
    // Hébergement vert (30 points)
    if (greenData.green) {
      score += 30;
    } else if (greenData.note) {
      score += 10; // Score partiel pour données simulées
    }
    
    // Empreinte carbone (40 points)
    if (carbonData.statistics && carbonData.statistics.co2) {
      const co2 = carbonData.statistics.co2;
      
      if (co2 < 0.3) score += 40;
      else if (co2 < 0.6) score += 30;
      else if (co2 < 1.0) score += 20;
      else if (co2 < 1.5) score += 10;
      else if (co2 > 2.5) score -= 20;
    }
    
    // Rating (10 points)
    const rating = carbonData.rating;
    const ratingScores = {
      'A+': 10, 'A': 9, 'A-': 8,
      'B+': 7, 'B': 6, 'B-': 5,
      'C+': 4, 'C': 3, 'C-': 2,
      'D+': 1, 'D': 0, 'D-': -1,
      'E': -2, 'F': -3
    };
    
    if (ratingScores[rating] !== undefined) {
      score += ratingScores[rating];
    }
    
    // Plus propre que (10 points)
    if (carbonData.cleanerThan) {
      score += carbonData.cleanerThan * 10;
    }
    
    // Limiter entre 0 et 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Détermine le niveau éco
   */
  getEcoLevel(score) {
    if (score >= 85) return 'Excellente';
    if (score >= 70) return 'Très bonne';
    if (score >= 55) return 'Bonne';
    if (score >= 40) return 'Moyenne';
    if (score >= 25) return 'Faible';
    return 'Très faible';
  }

  /**
   * Génère les données du bandeau
   */
  generateBannerData(score) {
    const ecoLevel = this.getEcoLevel(score);
    
    let message, color, emoji;
    
    if (score >= 80) {
      message = '✅ Ce site est éco-responsable !';
      color = '#2ecc71';
      emoji = '✅';
    } else if (score >= 60) {
      message = '🌿 Ce site a de bonnes pratiques environnementales.';
      color = '#27ae60';
      emoji = '🌿';
    } else if (score >= 40) {
      message = '⚠️ Ce site peut améliorer son impact environnemental.';
      color = '#f39c12';
      emoji = '⚠️';
    } else {
      message = '🔴 L\'impact environnemental de ce site est élevé.';
      color = '#e74c3c';
      emoji = '🔴';
    }
    
    return {
      showBanner: true,
      message,
      emoji,
      color,
      score: this.roundScore(score),
      ecoLevel,
      lastUpdated: new Date().toISOString(),
      detailsLink: '#eco-details',
      version: '1.0'
    };
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(carbonData, greenData) {
    const recommendations = [];
    
    // Hébergement
    if (!greenData.green) {
      recommendations.push('🌱 Passez à un hébergement vert (réduction jusqu\'à 80% de l\'empreinte)');
    }
    
    // Performance
    if (carbonData.statistics && carbonData.statistics.co2 > 1.0) {
      recommendations.push('⚡ Optimisez les performances (compression, cache, images)');
    }
    
    // Recommandations générales
    recommendations.push(
      '📦 Utilisez un CDN écologique',
      '🎯 Optimisez les images au format WebP',
      '🚀 Activez la compression GZIP/Brotli',
      '💡 Réduisez le JavaScript inutilisé',
      '🔄 Mettez en cache les ressources statiques'
    );
    
    return recommendations.slice(0, 6); // Limiter à 6 recommandations
  }

  // ===== MÉTHODES UTILITAIRES =====

  cleanURL(url) {
    let clean = url.toString().trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }

  generateCacheKey(url) {
    // Utiliser un hash simple pour la clé de cache
    const normalized = this.cleanURL(url).toLowerCase();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }
    return 'eco_' + Math.abs(hash).toString(16);
  }

  setCache(key, data) {
    // Limiter la taille du cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheDuration) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      duration: this.cacheDuration,
      maxSize: this.maxCacheSize
    };
  }

  roundScore(score) {
    return Math.round(score * 10) / 10;
  }
}

module.exports = new EcoCheckerService();