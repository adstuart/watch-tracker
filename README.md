# ⌚ Watch Tracker

A lightweight, modern web application for tracking the latest watches from premium retailers.

## Features

- 🚀 **Super Lightweight** - Pure vanilla HTML, CSS, and JavaScript with no dependencies
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Fast Loading** - Updates on page refresh (client-side only)
- 🔄 **Smart Caching** - Uses localStorage for instant initial display
- 📊 **Latest 10 Watches** - Displays the most recent watches in a clean, scrollable list
- 🎨 **Modern UI** - Beautiful gradient background with smooth animations
- 🔧 **Expandable Architecture** - Easy to add new watch sources

## Currently Tracking

- **Falco Watches** (https://falco-watches.com/collections/all)

## Data Displayed

For each watch, the tracker displays:
- Model/Make name
- Price
- Size (when available)
- Source retailer

## How It Works

1. **Client-Side Scraping**: Uses a CORS proxy to fetch watch listings
2. **On-Demand Updates**: Refreshes data when you visit the page or click refresh
3. **No Backend Required**: Runs entirely in the browser
4. **Local Caching**: Stores the last fetch in localStorage for faster load times

## Usage

Simply open `index.html` in a web browser. The application will:
1. Load cached watches instantly (if available)
2. Fetch the latest watches from all enabled sources
3. Display the 10 most recent watches

Click the "Refresh" button to manually check for new watches.

### Demo Mode

If you encounter CORS issues (common with browser security settings or ad blockers), you can enable demo mode to see the application with sample data:

1. Open `app.js`
2. Change `const DEMO_MODE = false;` to `const DEMO_MODE = true;`
3. Refresh the page

This will display 10 sample watches to demonstrate the UI and functionality.

## Adding New Watch Sources

The architecture is designed to be easily expandable. To add a new watch source:

1. **Add a new configuration** in `app.js`:
   ```javascript
   const WATCH_SOURCES = {
       falco: {
           name: 'Falco Watches',
           url: 'https://falco-watches.com/collections/all',
           enabled: true,
           scraper: scrapeFalcoWatches
       },
       // Add your new source:
       newSource: {
           name: 'New Watch Retailer',
           url: 'https://example.com/watches',
           enabled: true,
           scraper: scrapeNewSource
       }
   };
   ```

2. **Create a scraper function**:
   ```javascript
   async function scrapeNewSource(url) {
       const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
       const response = await fetch(proxyUrl);
       const html = await response.text();
       const parser = new DOMParser();
       const doc = parser.parseFromString(html, 'text/html');
       
       const watches = [];
       
       // Your scraping logic here
       // Find product elements and extract:
       // - name
       // - price
       // - size
       
       return watches;
   }
   ```

3. That's it! The application will automatically include watches from the new source.

## Technical Details

### Technologies Used
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with gradients, animations, and flexbox
- **Vanilla JavaScript** - No frameworks or libraries
- **DOMParser API** - For parsing scraped HTML
- **LocalStorage API** - For caching watches
- **Fetch API** - For retrieving watch listings

### CORS Proxy
Since browsers block cross-origin requests, the application uses the AllOrigins CORS proxy service (https://api.allorigins.win) to fetch watch listings. This is a free, public service that enables client-side scraping.

### Browser Compatibility
Works in all modern browsers that support:
- ES6+ JavaScript features
- Fetch API
- LocalStorage
- DOMParser

## File Structure

```
watch-tracker/
├── index.html      # Main HTML structure
├── style.css       # All styling and animations
├── app.js          # Application logic and scrapers
└── README.md       # This file
```

## Design Principles

- **Minimalism**: No unnecessary dependencies or complexity
- **Performance**: Lightweight and fast-loading
- **Maintainability**: Clean, documented code with modular architecture
- **Extensibility**: Easy to add new features and sources
- **User Experience**: Smooth animations and responsive design

## Future Enhancements

Potential improvements (without adding complexity):
- Add more watch retailers
- Filter by price range or size
- Sort options (price, name, date)
- Dark/light mode toggle
- Watch detail links to original product pages

## License

Open source - feel free to use and modify as needed.