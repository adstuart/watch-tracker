/**
 * Watch Tracker Application
 * Lightweight, modular watch tracker with expandable architecture
 */

// Configuration for watch sources (easily expandable)
const WATCH_SOURCES = {
    falco: {
        name: 'Falco Watches',
        url: 'https://falco-watches.com/collections/all/products.json?limit=250',
        baseUrl: 'https://falco-watches.com',
        enabled: true,
        scraper: scrapeShopifyStore
    }
    // Add more sources here in the future:
    // For other Shopify stores, use the same pattern:
    // store: {
    //     name: 'Store Name',
    //     url: 'https://store-url.com/products.json?limit=250',
    //     baseUrl: 'https://store-url.com',
    //     enabled: true,
    //     scraper: scrapeShopifyStore  // Reuse for Shopify stores
    // }
};

// Maximum number of watches to display
const MAX_WATCHES = 10;

// Demo mode - set to true to use sample data instead of live scraping
const DEMO_MODE = false;

// Sample data for demo mode
const DEMO_WATCHES = [
    { name: 'Falco Navigator GMT', price: '£425.00', source: 'Falco Watches', timestamp: Date.now() - 1000 },
    { name: 'Falco Explorer II', price: '£395.00', source: 'Falco Watches', timestamp: Date.now() - 2000 },
    { name: 'Falco Submariner Heritage', price: '£485.00', source: 'Falco Watches', timestamp: Date.now() - 3000 },
    { name: 'Falco Speedmaster', price: '£525.00', source: 'Falco Watches', timestamp: Date.now() - 4000 },
    { name: 'Falco Day-Date Classic', price: '£650.00', source: 'Falco Watches', timestamp: Date.now() - 5000 },
    { name: 'Falco Aqua Terra', price: '£445.00', source: 'Falco Watches', timestamp: Date.now() - 6000 },
    { name: 'Falco Pilot Chronograph', price: '£595.00', source: 'Falco Watches', timestamp: Date.now() - 7000 },
    { name: 'Falco Diver Pro', price: '£385.00', source: 'Falco Watches', timestamp: Date.now() - 8000 },
    { name: 'Falco Field Watch', price: '£325.00', source: 'Falco Watches', timestamp: Date.now() - 9000 },
    { name: 'Falco Dress Watch Elite', price: '£475.00', source: 'Falco Watches', timestamp: Date.now() - 10000 }
];

// Storage key for cached watches
const STORAGE_KEY = 'watchTracker_watches';
const STORAGE_TIMESTAMP_KEY = 'watchTracker_timestamp';

/**
 * Main application class
 */
class WatchTracker {
    constructor() {
        this.watches = [];
        this.loading = false;
        this.initializeUI();
        this.loadWatches();
    }

    initializeUI() {
        this.elements = {
            watchList: document.getElementById('watchList'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            refreshBtn: document.getElementById('refreshBtn'),
            lastUpdate: document.getElementById('lastUpdate')
        };

        this.elements.refreshBtn.addEventListener('click', () => this.refresh());
    }

    async loadWatches() {
        // Try to load from cache first for faster initial display
        const cached = this.loadFromCache();
        if (cached) {
            this.watches = cached.watches;
            this.displayWatches();
            this.updateLastUpdateTime(cached.timestamp);
        }

        // Then fetch fresh data
        await this.refresh();
    }

    async refresh() {
        if (this.loading) return;

        this.setLoading(true);
        this.hideError();

        try {
            let allWatches = [];

            // Use demo data if demo mode is enabled
            if (DEMO_MODE) {
                allWatches = [...DEMO_WATCHES];
            } else {
                // Fetch from all enabled sources
                for (const [key, source] of Object.entries(WATCH_SOURCES)) {
                    if (source.enabled) {
                        try {
                            const watches = await source.scraper(source);
                            allWatches.push(...watches);
                        } catch (err) {
                            console.error(`Error scraping ${source.name}:`, err);
                        }
                    }
                }
            }

            if (allWatches.length === 0) {
                throw new Error('No watches found from any source. This may be due to CORS restrictions or network issues.');
            }

            // Sort by date (newest first) and take top MAX_WATCHES
            this.watches = allWatches
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, MAX_WATCHES);

            this.displayWatches();
            this.saveToCache();
            this.updateLastUpdateTime(Date.now());
        } catch (error) {
            console.error('Error refreshing watches:', error);
            this.showError(error.message || 'Failed to load watches. This may be due to browser security settings or ad blockers. Try disabling ad blockers or enabling demo mode in app.js.');
        } finally {
            this.setLoading(false);
        }
    }

    displayWatches() {
        if (this.watches.length === 0) {
            this.elements.watchList.innerHTML = `
                <div class="empty-state">
                    <h2>No watches found</h2>
                    <p>Try refreshing to check for new watches</p>
                </div>
            `;
            return;
        }

        this.elements.watchList.innerHTML = this.watches
            .map((watch, index) => this.createWatchHTML(watch, index))
            .join('');
    }

    createWatchHTML(watch, index) {
        return `
            <div class="watch-item">
                <div class="watch-header">
                    <div class="watch-name">${this.escapeHtml(watch.name)}</div>
                    <div class="watch-price">${this.escapeHtml(watch.price)}</div>
                </div>
            </div>
        `;
    }

    setLoading(loading) {
        this.loading = loading;
        this.elements.loading.style.display = loading ? 'block' : 'none';
        this.elements.watchList.style.display = loading ? 'none' : 'block';
        this.elements.refreshBtn.disabled = loading;
    }

    showError(message) {
        this.elements.error.textContent = message;
        this.elements.error.style.display = 'block';
    }

    hideError() {
        this.elements.error.style.display = 'none';
    }

    updateLastUpdateTime(timestamp) {
        const date = new Date(timestamp);
        const timeString = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        this.elements.lastUpdate.textContent = `Last updated: ${timeString}`;
    }

    saveToCache() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.watches));
            localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        } catch (err) {
            console.error('Failed to save to cache:', err);
        }
    }

    loadFromCache() {
        try {
            const watches = localStorage.getItem(STORAGE_KEY);
            const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
            
            if (watches && timestamp) {
                return {
                    watches: JSON.parse(watches),
                    timestamp: parseInt(timestamp, 10)
                };
            }
        } catch (err) {
            console.error('Failed to load from cache:', err);
        }
        return null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Scraper for Shopify stores (works with any Shopify store)
 * Uses the Shopify JSON API - no CORS proxy needed!
 * @param {Object} source - The source configuration object containing url, name, and baseUrl
 * @returns {Promise<Array>} Array of watch objects
 */
async function scrapeShopifyStore(source) {
    // Fetch directly from Shopify's JSON API - no CORS proxy needed
    const response = await fetch(source.url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid response format from Shopify API');
    }
    
    const watches = [];
    
    // Process each product from the Shopify API
    data.products.forEach((product) => {
        try {
            // Extract basic product information
            const name = product.title;
            
            // Validate product has required fields
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return; // Skip products without valid names
            }
            
            // Get price from first variant
            const variant = product.variants && product.variants[0];
            if (!variant || !variant.price) return;
            
            const priceValue = parseFloat(variant.price);
            if (isNaN(priceValue)) {
                return; // Skip products with invalid prices
            }
            const price = `£${priceValue.toFixed(2)}`;
            
            // Convert created_at to timestamp for sorting
            const timestamp = product.created_at ? new Date(product.created_at).getTime() : Date.now();
            
            watches.push({
                name: name,
                price: price,
                source: source.name,
                timestamp: timestamp
            });
        } catch (err) {
            console.error('Error parsing product:', err, product);
        }
    });
    
    console.log(`Fetched ${watches.length} watches from ${source.name} via Shopify JSON API`);
    
    return watches;
}

/**
 * Template for adding new Shopify store scrapers
 * 
 * For Shopify stores, you can reuse the scrapeShopifyStore function:
 * 
 * newStore: {
 *     name: 'New Store Name',
 *     url: 'https://store-url.com/products.json?limit=250',
 *     baseUrl: 'https://store-url.com',
 *     enabled: true,
 *     scraper: scrapeShopifyStore  // Reuse for any Shopify store
 * }
 * 
 * For non-Shopify stores, create a custom scraper:
 * 
 * async function scrapeNonShopifyStore(source) {
 *     // You'll need a CORS proxy for non-Shopify stores
 *     const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`;
 *     const response = await fetch(proxyUrl);
 *     const html = await response.text();
 *     const parser = new DOMParser();
 *     const doc = parser.parseFromString(html, 'text/html');
 *     
 *     const watches = [];
 *     // Add your scraping logic here
 *     // Extract: name, price, timestamp
 *     // Return watches with source.name as the source
 *     
 *     return watches;
 * }
 */

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new WatchTracker();
    });
} else {
    new WatchTracker();
}
