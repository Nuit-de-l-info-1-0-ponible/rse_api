const axios = require('axios');

class ExternalAPIService {
  constructor() {
    this.websiteCarbonURL = process.env.WEBSITE_CARBON_URL || 'https://api.websitecarbon.com';
    this.greenWebURL = process.env.GREEN_WEB_URL || 'https://api.thegreenwebfoundation.org';
  }

  /**
   * Vérifie l'empreinte carbone d'un site
   * @param {string} url - URL du site à vérifier
   * @returns {Promise<Object>} Données carbone
   */
  async checkWebsiteCarbon(url) {
    try {
      const cleanURL = this.cleanURL(url);
      
      // Appel à Website Carbon API
      const response = await axios.get(`${this.websiteCarbonURL}/site`, {
        params: { url: cleanURL },
        headers: {
          'User-Agent': 'EcoCheckerAPI/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 secondes timeout
      });

      if (response.data) {
        return {
          success: true,
          data: {
            url: response.data.url,
            green: response.data.green || false,
            bytes: response.data.bytes,
            cleanerThan: response.data.cleanerThan || 0,
            rating: response.data.rating || 'D',
            statistics: {
              co2: response.data.statistics?.co2?.grid?.grams || 1.0,
              energy: response.data.statistics?.energy?.grid?.wattHours || 0.5
            }
          }
        };
      }
      
      return this.getMockCarbonData(cleanURL);
      
    } catch (error) {
      console.warn('Website Carbon API error, using mock data:', error.message);
      return this.getMockCarbonData(url);
    }
  }

  /**
   * Vérifie si l'hébergement est vert
   * @param {string} url - URL du site
   * @returns {Promise<Object>} Données hébergement
   */
  async checkGreenWeb(url) {
    try {
      const domain = this.extractDomain(url);
      
      // Appel à Green Web Foundation API
      const response = await axios.get(`${this.greenWebURL}/greencheck/${domain}`, {
        headers: {
          'User-Agent': 'EcoCheckerAPI/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data) {
        return {
          success: true,
          data: {
            green: response.data.green || false,
            hostedBy: response.data.hostedby || 'Inconnu',
            partner: response.data.partner || false,
            dataCenter: response.data.data_center || 'Inconnu',
            modified: response.data.modified,
            url: response.data.url
          }
        };
      }
      
      return this.getMockGreenData(domain);
      
    } catch (error) {
      console.warn('Green Web API error, using mock data:', error.message);
      return this.getMockGreenData(this.extractDomain(url));
    }
  }

  /**
   * Analyse l'efficacité du site
   * @param {string} url - URL du site
   * @returns {Promise<Object>} Analyse d'efficacité
   */
  async analyzeEfficiency(url) {
    // Pour l'instant, retourner une analyse basique
    // Vous pourriez intégrer d'autres APIs ici (Google PageSpeed, etc.)
    return {
      success: true,
      data: {
        analysisType: 'basic_efficiency',
        recommendations: [
          'Utilisez la compression GZIP/Brotli',
          'Optimisez les images (WebP format)',
          'Mettez en cache les ressources statiques',
          'Utilisez un CDN écologique',
          'Réduisez le JavaScript inutilisé'
        ],
        estimatedSavings: 'Jusqu\'à 40% d\'économie d\'énergie'
      }
    };
  }

  // ===== MÉTHODES UTILITAIRES =====

  cleanURL(url) {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(this.cleanURL(url));
      let domain = urlObj.hostname;
      
      // Retirer www.
      if (domain.startsWith('www.')) {
        domain = domain.slice(4);
      }
      
      return domain;
    } catch (error) {
      // Si l'URL est invalide, retourner le texte brut
      return url.replace(/^(https?:\/\/)?(www\.)?/, '');
    }
  }

  getMockCarbonData(url) {
    // Données simulées pour le développement
    return {
      success: true,
      data: {
        url: url,
        green: false,
        cleanerThan: 0.5 + Math.random() * 0.3,
        rating: ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)],
        statistics: {
          co2: 0.8 + Math.random() * 1.2,
          energy: 0.3 + Math.random() * 0.7
        },
        note: 'Données de démonstration - API en maintenance'
      }
    };
  }

  getMockGreenData(domain) {
    // Données simulées
    const isGreen = Math.random() > 0.7; // 30% de chance d'être vert
    
    return {
      success: true,
      data: {
        green: isGreen,
        hostedBy: isGreen ? 'Green Hosting Inc.' : 'Standard Hosting Corp.',
        partner: isGreen,
        dataCenter: isGreen ? 'Data Center Solaire' : 'Data Center Standard',
        note: 'Données de démonstration'
      }
    };
  }
}

module.exports = new ExternalAPIService();