/**
 * Watch Tracker Application
 * Lightweight, modular watch tracker with expandable architecture
 */

// Configuration for watch sources (easily expandable)
const WATCH_SOURCES = {
    falco: {
        name: 'Falco Watches',
        url: 'https://falco-watches.com/collections/all',
        enabled: true,
        scraper: scrapeFalcoWatches
    }
    // Add more sources here in the future:
    // rolex: {
    //     name: 'Rolex',
    //     url: '...',
    //     enabled: true,
    //     scraper: scrapeRolexWatches
    // }
};

// Maximum number of watches to display
const MAX_WATCHES = 10;

// Demo mode - set to true to use sample data instead of live scraping
const DEMO_MODE = false;

// Sample data for demo mode
const DEMO_WATCHES = [
    { name: 'Falco Navigator GMT', price: '$425', size: '40mm', source: 'Falco Watches', timestamp: Date.now() - 1000 },
    { name: 'Falco Explorer II', price: '$395', size: '42mm', source: 'Falco Watches', timestamp: Date.now() - 2000 },
    { name: 'Falco Submariner Heritage', price: '$485', size: '40mm', source: 'Falco Watches', timestamp: Date.now() - 3000 },
    { name: 'Falco Speedmaster', price: '$525', size: '38mm', source: 'Falco Watches', timestamp: Date.now() - 4000 },
    { name: 'Falco Day-Date Classic', price: '$650', size: '36mm', source: 'Falco Watches', timestamp: Date.now() - 5000 },
    { name: 'Falco Aqua Terra', price: '$445', size: '41mm', source: 'Falco Watches', timestamp: Date.now() - 6000 },
    { name: 'Falco Pilot Chronograph', price: '$595', size: '43mm', source: 'Falco Watches', timestamp: Date.now() - 7000 },
    { name: 'Falco Diver Pro', price: '$385', size: '44mm', source: 'Falco Watches', timestamp: Date.now() - 8000 },
    { name: 'Falco Field Watch', price: '$325', size: '38mm', source: 'Falco Watches', timestamp: Date.now() - 9000 },
    { name: 'Falco Dress Watch Elite', price: '$475', size: '40mm', source: 'Falco Watches', timestamp: Date.now() - 10000 }
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
                            const watches = await source.scraper(source.url);
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
            this.showError(error.message || 'Failed to load watches. This may be due to browser security settings or ad blockers blocking the request. Try disabling ad blockers or enabling demo mode in app.js.');
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
            <div class="watch-item" style="animation-delay: ${index * 0.05}s">
                <div class="watch-header">
                    <div class="watch-name">${this.escapeHtml(watch.name)}</div>
                    <div class="watch-price">${this.escapeHtml(watch.price)}</div>
                </div>
                <div class="watch-details">
                    ${watch.size ? `
                        <div class="watch-detail">
                            <span class="watch-detail-label">Size:</span>
                            <span>${this.escapeHtml(watch.size)}</span>
                        </div>
                    ` : ''}
                </div>
                <span class="watch-source">${this.escapeHtml(watch.source)}</span>
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
 * Scraper for Falco Watches
 * @param {string} url - The URL to scrape
 * @returns {Promise<Array>} Array of watch objects
 */
async function scrapeFalcoWatches(url) {
    // Use a CORS proxy to fetch the page
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const watches = [];
    
    // Falco Watches uses a grid of product items
    // Find all product items - adjust selectors based on actual HTML structure
    const productItems = doc.querySelectorAll('.product-item, .grid-product, .product-card, [class*="product"]');
    
    productItems.forEach((item) => {
        try {
            // Try multiple possible selectors for name
            const nameElement = item.querySelector('.product-item__title, .product-title, .grid-product__title, h3, h2, .title, [class*="title"]');
            const priceElement = item.querySelector('.price, .product-price, [class*="price"]');
            
            // Extract size from the name or description if available
            let name = nameElement ? nameElement.textContent.trim() : null;
            let price = priceElement ? priceElement.textContent.trim() : null;
            let size = null;
            
            // Try to extract size from name (e.g., "40mm", "42mm")
            if (name) {
                const sizeMatch = name.match(/(\d+\.?\d*\s*mm)/i);
                if (sizeMatch) {
                    size = sizeMatch[1];
                }
            }
            
            if (name && price) {
                watches.push({
                    name: name,
                    price: price,
                    size: size || 'N/A',
                    source: 'Falco Watches',
                    timestamp: Date.now()
                });
            }
        } catch (err) {
            console.error('Error parsing product item:', err);
        }
    });
    
    // If no watches found with the above selectors, try a more generic approach
    if (watches.length === 0) {
        console.warn('No watches found with primary selectors, trying fallback...');
        
        // Try to find any elements that might contain product information
        const allLinks = doc.querySelectorAll('a[href*="/products/"]');
        
        allLinks.forEach((link) => {
            try {
                const container = link.closest('[class*="product"], [class*="item"], .grid__item');
                if (!container) return;
                
                const nameElement = container.querySelector('[class*="title"], h3, h2, .product-title');
                const priceElement = container.querySelector('[class*="price"]');
                
                let name = nameElement ? nameElement.textContent.trim() : link.textContent.trim();
                let price = priceElement ? priceElement.textContent.trim() : 'Price N/A';
                
                if (name && !name.toLowerCase().includes('quick') && name.length > 3) {
                    const sizeMatch = name.match(/(\d+\.?\d*\s*mm)/i);
                    
                    watches.push({
                        name: name,
                        price: price,
                        size: sizeMatch ? sizeMatch[1] : 'N/A',
                        source: 'Falco Watches',
                        timestamp: Date.now()
                    });
                }
            } catch (err) {
                console.error('Error parsing fallback item:', err);
            }
        });
    }
    
    // Remove duplicates based on name
    const uniqueWatches = watches.filter((watch, index, self) =>
        index === self.findIndex((w) => w.name === watch.name)
    );
    
    console.log(`Scraped ${uniqueWatches.length} watches from Falco Watches`);
    
    return uniqueWatches;
}

/**
 * Template for adding new scrapers
 * 
 * async function scrapeNewSource(url) {
 *     const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
 *     const response = await fetch(proxyUrl);
 *     const html = await response.text();
 *     const parser = new DOMParser();
 *     const doc = parser.parseFromString(html, 'text/html');
 *     
 *     const watches = [];
 *     // Add your scraping logic here
 *     // Look for product items and extract name, price, size
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
