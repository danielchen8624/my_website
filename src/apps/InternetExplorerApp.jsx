import { useState, useCallback, useRef, useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import Icon from '../components/Icon';

// CORS Proxy to bypass same-origin restrictions
// CORS Proxy to bypass same-origin restrictions
// changing to api.allorigins.win as corsproxy.io was refusing connections
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Sites that commonly block iframe embedding
const BLOCKED_SITES = ['facebook.com', 'twitter.com', 'youtube.com', 'instagram.com', 'linkedin.com'];

export default function InternetExplorerApp() {
  const { addFile } = useFileSystem();
  const iframeRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  
  const [url, setUrl] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'browse', 'error'
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Clear loading timeout helper
  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  // Stop loading function
  const stopLoading = () => {
    clearLoadingTimeout();
    setIsLoading(false);
  };

  const [searchResults, setSearchResults] = useState({ web: [], images: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState('web'); // 'web', 'images', 'news', 'maps'

  // Check if site is likely blocked
  const isLikelyBlocked = (url) => {
    return BLOCKED_SITES.some(site => url.includes(site));
  };

  // Check if string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Check if string looks like a domain (e.g. google.com)
  const isDomain = (string) => {
    return /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(string) && !string.includes(' ');
  };

  // Generate simulated search results
  const generateSearchResults = (query) => {
    const webResults = [];
    const imageResults = [];
    const q = query.toLowerCase();
    
    // --- Specific Easter Eggs & Topics ---
    
    // Greetings / Hello
    if (q.includes('hello') || q.includes('hi ')) {
      webResults.push({
        title: 'Hello - Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Hello',
        snippet: 'Hello is a salutation or greeting in the English language. It is first attested in writing from 1826.'
      });
      webResults.push({
        title: 'Hello! Magazine',
        url: 'https://www.hellomagazine.com',
        snippet: 'Celebrity news, royals, entertainment and lifestyle - Hello!'
      });
      webResults.push({
        title: 'Adele - Hello (Official Music Video)',
        url: 'https://www.youtube.com/watch?v=YQHsXMglC9A',
        snippet: 'Listen to "Hello" by Adele. 3 Billion views. Posted 8 years ago.'
      });
      webResults.push({
        title: 'Lionel Richie - Hello',
        url: 'https://www.youtube.com/watch?v=PDZcqBgCS74',
        snippet: 'Music video by Lionel Richie performing Hello. (C) 1983 Motown Records.'
      });
    }
    
    // Weather
    else if (q.includes('weather')) {
      webResults.push({
        title: 'Weather Channel - Local Forecast',
        url: 'https://weather.com',
        snippet: 'Today’s forecast: 72°F and Sunny. Chance of rain 0%. Winds N at 5 mph.'
      });
      webResults.push({
        title: 'National Weather Service',
        url: 'https://www.weather.gov',
        snippet: 'Official forecasts, warnings, and observations for the United States.'
      });
      webResults.push({
        title: 'AccuWeather: Weather for Life',
        url: 'https://www.accuweather.com',
        snippet: 'Local, National, and Global daily weather forecasts.'
      });
      webResults.push({
        title: 'Weather Underground',
        url: 'https://www.wunderground.com',
        snippet: 'Current temperature, radar, and satellite maps.'
      });
    }

    // Cats / Animals
    else if (q.includes('cat') || q.includes('dog') || q.includes('animal')) {
      webResults.push({
        title: 'Funny Animal Videos - YouTube',
        url: 'https://www.youtube.com/results?search_query=funny+animals',
        snippet: 'Watch the best funny animal videos. Dogs, cats, and more!'
      });
      webResults.push({
        title: 'Wikipedia: Felis catus',
        url: 'https://en.wikipedia.org/wiki/Cat',
        snippet: 'The cat (Felis catus) is a domestic species of small carnivorous mammal.'
      });
      webResults.push({
        title: 'The Humane Society',
        url: 'https://www.humanesociety.org',
        snippet: 'We fight the big fights to end suffering for all animals.'
      });
    }

    // Tech / Computer
    else if (q.includes('internet') || q.includes('computer') || q.includes('tech') || q.includes('code')) {
      webResults.push({
        title: 'History of the Internet',
        url: 'https://www.internetsociety.org/internet/history-internet/',
        snippet: 'A brief history of the internet, from ARPANET to today.'
      });
      webResults.push({
        title: 'Stack Overflow - Where Developers Learn, Share, & Build',
        url: 'https://stackoverflow.com',
        snippet: 'Stack Overflow is the largest, most trusted online community for developers.'
      });
      webResults.push({
        title: 'The Verge',
        url: 'https://www.theverge.com',
        snippet: 'Technology news, reviews, and guides.'
      });
      webResults.push({
        title: 'GitHub: Let\'s build from here',
        url: 'https://github.com',
        snippet: 'GitHub is where over 100 million developers shape the future of software.'
      });
      webResults.push({
        title: 'Wired - The Latest in Technology, Science, Culture and Business',
        url: 'https://www.wired.com',
        snippet: 'WIRED provides in-depth coverage of current and future trends in technology.'
      });
    }

    // Music
    else if (q.includes('music') || q.includes('song') || q.includes('lyrics')) {
      webResults.push({
        title: 'Billboard Hot 100',
        url: 'https://www.billboard.com/charts/hot-100/',
        snippet: 'The week\'s most popular current songs across all genres.'
      });
      webResults.push({
        title: 'Spotify - Web Player',
        url: 'https://open.spotify.com',
        snippet: 'Spotify is a digital music service that gives you access to millions of songs.'
      });
      webResults.push({
        title: 'Genius | Song Lyrics & Knowledge',
        url: 'https://genius.com',
        snippet: 'The world\'s biggest collection of song lyrics and musical knowledge.'
      });
      webResults.push({
        title: 'Rolling Stone',
        url: 'https://www.rollingstone.com',
        snippet: 'Music, Film, TV and Political News Coverage.'
      });
    }

    // Google
    else if (q.includes('google')) {
      webResults.push({
        title: 'Google',
        url: 'https://www.google.com',
        snippet: 'Search the world\'s information, including webpages, images, videos and more.'
      });
      webResults.push({
        title: 'Google Images',
        url: 'https://images.google.com',
        snippet: 'The most comprehensive image search on the web.'
      });
      webResults.push({
        title: 'Google Maps',
        url: 'https://maps.google.com',
        snippet: 'Find local businesses, view maps and get driving directions.'
      });
    }
    
    // --- Enhanced Generic Results ---
    // Always add varied generic results based on the query, so EVERY search looks full
    
    // 1. Definition style
    webResults.push({
      title: `${query} - Wikipedia`,
      url: `https://en.wikipedia.org/wiki/${q.replace(/\s+/g, '_')}`,
      snippet: `${query} is a topic of interest. Read more about its history, usage, and significance on Wikipedia, the free encyclopedia.`
    });

    // 2. Dictionary / Meaning
    if (!webResults.some(r => r.url.includes('dictionary.com'))) {
        webResults.push({
            title: `${query} - Definition and Meaning`,
            url: `https://www.dictionary.com/browse/${q.replace(/\s+/g, '-')}`,
            snippet: `Find the meaning of ${query} at Dictionary.com, the world's leading online dictionary.`
        });
    }

    // 3. News
    webResults.push({
      title: `Latest news about ${query}`,
      url: `https://news.ycombinator.com/item?id=${Math.floor(Math.random() * 100000)}`,
      snippet: `Breaking news, top stories, and updates regarding ${query} from around the web.`
    });

    // 4. "Best of" / Top 10 style
    webResults.push({
      title: `The 10 Best ${query}s in 2025`,
      url: `https://www.example.com/best-${q.replace(/\s+/g, '-')}`,
      snippet: `We reviewed the top ${query} options available today. Comparison, reviews, and buying guide.`
    });

    // 5. Images
    webResults.push({
      title: `Images for ${query}`,
      url: `https://images.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `View all images related to ${query}. High resolution photos and vectors.`
    });

    // 6. Social Media / Generic Forum
    webResults.push({
      title: `${query} - Reddit Discussion`,
      url: `https://www.reddit.com/r/${q.replace(/\s+/g, '')}`,
      snippet: `Join the discussion about ${query} on Reddit. Share your thoughts and questions.`
    });
    
    // --- Generate Image Results ---
    // Use loremflickr for realistic keyword-based images
    for (let i = 0; i < 9; i++) {
        imageResults.push({
            // random param prevents caching same image
            url: `https://loremflickr.com/320/240/${encodeURIComponent(query)}?random=${i}`,
            title: `${query} image ${i + 1}`,
            dims: `${300 + Math.floor(Math.random() * 100)} x ${200 + Math.floor(Math.random() * 100)}`
        });
    }

    // Return the specific results + the generic ones (up to a limit, e.g., 10 total)
    return {
        web: webResults.slice(0, 10),
        images: imageResults
    };
  };

  // Navigate to URL
  const navigateTo = useCallback((input) => {
    if (!input.trim()) return;
    
    clearLoadingTimeout();
    
    let targetUrl = input.trim();
    let display = input.trim();

    // Smart Search Logic
    // 1. If it starts with http/https, use it as is
    if (/^https?:\/\//i.test(targetUrl)) {
      setDisplayUrl(display);
      setUrl(targetUrl);
      setIsLoading(true);
      setError(null);
      setCurrentPage('browse');
    }
    // 2. If it looks like a domain (e.g. google.com, test.org), add https://
    else if (isDomain(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
      setDisplayUrl(display);
      setUrl(targetUrl);
      setIsLoading(true);
      setError(null);
      setCurrentPage('browse');
    }
    // 3. Otherwise, use Internal Search
    else {
      setSearchQuery(display);
      setSearchResults(generateSearchResults(display));
      setCurrentPage('search');
      setSearchTab('web'); // Reset to web tab on new search
      setDisplayUrl(`search: ${display}`);
      // Simulate a small network delay for realism
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 800);
      return; // Stop here, don't do the browser load logic
    }
    
    // Standard Browser Load Logic (only for cases 1 and 2)
    // Check if likely blocked
    if (isLikelyBlocked(targetUrl)) {
      setError({
        type: 'blocked',
        message: 'This site blocks embedded browsing.',
        url: targetUrl,
      });
      setCurrentPage('error');
      setIsLoading(false);
      return;
    }
    
    // Set timeout to stop loading after 10 seconds
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      // If still loading after timeout, assume it loaded (don't show error)
    }, 10000);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(targetUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearLoadingTimeout();
  }, []);

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    navigateTo(displayUrl);
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    clearLoadingTimeout();
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    clearLoadingTimeout();
    setIsLoading(false);
    setError({
      type: 'load',
      message: 'Failed to load this page.',
      url: url,
    });
    setCurrentPage('error');
  };

  // Navigation controls
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setDisplayUrl(history[newIndex].replace(/^https?:\/\//, ''));
      setCurrentPage('browse');
      setError(null);
      setIsLoading(true);
      // Set timeout for back navigation too
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 10000);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setDisplayUrl(history[newIndex].replace(/^https?:\/\//, ''));
      setCurrentPage('browse');
      setError(null);
      setIsLoading(true);
      // Set timeout for forward navigation too
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 10000);
    }
  };

  const goHome = () => {
    clearLoadingTimeout();
    setCurrentPage('home');
    setUrl('');
    setDisplayUrl('');
    setError(null);
    setIsLoading(false);
  };

  const refresh = () => {
    if (currentPage === 'search') {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    } else if (iframeRef.current && url) {
      clearLoadingTimeout();
      iframeRef.current.src = iframeRef.current.src;
      setIsLoading(true);
      // Set timeout for refresh
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 10000);
    }
  };

  // Open in real browser
  const openInRealBrowser = (targetUrl) => {
    window.open(targetUrl, '_blank');
  };

  // Download file to desktop
  const handleDownload = (fileName, fileContent, fileIcon = 'notepad') => {
    addFile({
      name: fileName,
      type: 'file',
      icon: fileIcon,
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      content: fileContent,
      appType: 'notepad',
    });
    alert(`"${fileName}" has been downloaded to your Desktop!`);
  };

  // Render home page
  const renderHome = () => (
    <div className="ie-home">
      <div className="ie-home-header">
        <Icon icon="internet-explorer" size={64} />
        <h1>Internet Explorer</h1>
        <p>The World Wide Web at your fingertips</p>
      </div>

      <div className="ie-home-search">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={displayUrl}
            onChange={(e) => setDisplayUrl(e.target.value)}
            placeholder="Search the web or enter a URL"
            className="ie-home-search-input"
          />
          <button type="submit" className="win95-button">Go!</button>
        </form>
      </div>

      <div className="ie-quick-links">
        <h3>Quick Links</h3>
        <div className="ie-quick-links-grid">
          <div className="ie-quick-link" onClick={() => navigateTo('example.com')}>
            <span className="ie-quick-icon">🌐</span>
            <span>Example.com</span>
          </div>
          <div className="ie-quick-link" onClick={() => navigateTo('wikipedia.org')}>
            <span className="ie-quick-icon">📚</span>
            <span>Wikipedia</span>
          </div>
          <div className="ie-quick-link" onClick={() => navigateTo('news.ycombinator.com')}>
            <span className="ie-quick-icon">📰</span>
            <span>Hacker News</span>
          </div>
          <div className="ie-quick-link" onClick={() => setCurrentPage('downloads')}>
            <span className="ie-quick-icon">📁</span>
            <span>Downloads</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render simulated search results
  const renderSearch = () => (
    <div className="ie-search-results">
        <div className="ie-search-header">
            <div className="ie-search-logo">MSN Search</div>
            <div className="ie-search-form">
                <input 
                    type="text" 
                    value={searchQuery} 
                    readOnly 
                    className="ie-header-input"
                />
                <button className="win95-button">Search</button>
            </div>
        </div>
        
        <div className="ie-search-tabs">
            <div 
                className={`ie-search-tab ${searchTab === 'web' ? 'active' : ''}`}
                onClick={() => setSearchTab('web')}
            >
                Web
            </div>
            <div 
                className={`ie-search-tab ${searchTab === 'images' ? 'active' : ''}`}
                onClick={() => setSearchTab('images')}
            >
                Images
            </div>
            <div 
                className={`ie-search-tab ${searchTab === 'news' ? 'active' : ''}`}
                onClick={() => setSearchTab('news')}
            >
                News
            </div>
            <div 
                className={`ie-search-tab ${searchTab === 'maps' ? 'active' : ''}`}
                onClick={() => setSearchTab('maps')}
            >
                Maps
            </div>
        </div>
        
        {isLoading ? (
             <div className="ie-loading">
                <div className="ie-loading-spinner"></div>
                <p>Searching...</p>
            </div>
        ) : (
            <div className="ie-results-container">
                <div className="ie-search-meta">
                    Results for "{searchQuery}"
                </div>

                {searchTab === 'web' && (
                    <div className="ie-results-list">
                        {searchResults.web.map((result, index) => (
                            <div key={index} className="ie-result-item">
                                <a 
                                    href="#" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigateTo(result.url);
                                    }}
                                    className="ie-result-title"
                                >
                                    {result.title}
                                </a>
                                <div className="ie-result-snippet">{result.snippet}</div>
                                <div className="ie-result-url">{result.url}</div>
                            </div>
                        ))}
                    </div>
                )}

                {searchTab === 'images' && (
                    <div className="ie-images-grid">
                        {searchResults.images.map((img, index) => (
                            <div key={index} className="ie-image-item">
                                <img src={img.url} alt={img.title} loading="lazy" />
                                <div className="ie-image-info">
                                    <div className="ie-image-dims">{img.dims}</div>
                                    <div className="ie-image-title">{img.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {(searchTab === 'news' || searchTab === 'maps') && (
                    <div className="ie-placeholder-tab">
                        <p>No results found in this category.</p>
                        <p>Try switching to the <strong>Web</strong> tab.</p>
                    </div>
                )}
                
                <div className="ie-result-footer">
                    <p>Don't see what you're looking for?</p>
                    <button className="win95-button" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank')}>
                        Search on Real Google
                    </button>
                </div>
            </div>
        )}
    </div>
  );

  // Render downloads page
  const renderDownloads = () => (
    <div className="ie-downloads">
      <h2>Available Downloads</h2>
      <div className="ie-downloads-list">
        <div className="ie-download-item">
          <span className="ie-download-icon">📄</span>
          <div className="ie-download-info">
            <strong>Resume.txt</strong>
            <p>My professional resume</p>
          </div>
          <button
            className="win95-button"
            onClick={() => handleDownload('Resume.txt', `DANIEL CHEN - RESUME
═══════════════════════════════════════

EXPERIENCE
----------
• Senior Developer @ Tech Company (2022-Present)
• Full-Stack Engineer @ Startup (2020-2022)
• Junior Developer @ Agency (2018-2020)

SKILLS
------
• JavaScript, TypeScript, Python, Go
• React, Node.js, PostgreSQL, Redis
• AWS, Docker, Kubernetes

EDUCATION
---------
• BS Computer Science, State University

CONTACT
-------
• Email: hello@danielchen.dev
• GitHub: github.com/danielchen`, 'notepad')}
          >
            Download
          </button>
        </div>

        <div className="ie-download-item">
          <span className="ie-download-icon">📇</span>
          <div className="ie-download-info">
            <strong>Contact.txt</strong>
            <p>Contact information</p>
          </div>
          <button
            className="win95-button"
            onClick={() => handleDownload('Contact.txt', `CONTACT INFORMATION
═══════════════════

Email: hello@danielchen.dev
GitHub: github.com/danielchen
LinkedIn: linkedin.com/in/danielchen
Twitter: @danielchen

Feel free to reach out anytime!`, 'notepad')}
          >
            Download
          </button>
        </div>

        <div className="ie-download-item">
          <span className="ie-download-icon">🎵</span>
          <div className="ie-download-info">
            <strong>demo_song.mp3</strong>
            <p>A sample audio file</p>
          </div>
          <button
            className="win95-button"
            onClick={() => handleDownload('demo_song.txt', `[This would be an audio file]
Play it in Winamp!`, 'notepad')}
          >
            Download
          </button>
        </div>
      </div>

      <button className="win95-button" onClick={goHome} style={{ marginTop: 20 }}>
        ← Back to Home
      </button>
    </div>
  );

  // Render error page
  const renderError = () => (
    <div className="ie-error">
      <span style={{ fontSize: '48px' }}>❌</span>
      <h2>Cannot Display This Page</h2>
      <p>{error?.message}</p>

      {error?.type === 'blocked' && (
        <div className="ie-error-actions">
          <p>This website ({error.url}) prevents embedded browsing for security reasons.</p>
          <button
            className="win95-button ie-open-browser-btn"
            onClick={() => openInRealBrowser(error.url)}
          >
            Open in Real Browser
          </button>
        </div>
      )}

      <button className="win95-button" onClick={goHome} style={{ marginTop: 20 }}>
        ← Back to Home
      </button>
    </div>
  );

  // Render browser view
  const renderBrowser = () => (
    <div className="ie-browser-container">
      {isLoading && (
        <div className="ie-loading">
          <div className="ie-loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`${CORS_PROXY}${encodeURIComponent(url)}`}
        className="ie-iframe"
        title="Web Browser"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );

  return (
    <div className="ie-app">
      {/* Toolbar */}
      <div className="ie-toolbar">
        <button
          className="win95-button ie-nav-btn"
          onClick={goBack}
          disabled={historyIndex <= 0}
          title="Back"
        >
          ◄
        </button>
        <button
          className="win95-button ie-nav-btn"
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          title="Forward"
        >
          ►
        </button>
        <button
          className="win95-button ie-nav-btn"
          onClick={refresh}
          disabled={!url && currentPage !== 'search'}
          title="Refresh"
        >
          ↻
        </button>
        <button
          className="win95-button ie-nav-btn"
          onClick={stopLoading}
          disabled={!isLoading}
          title="Stop"
        >
          ✕
        </button>
        <button
          className="win95-button ie-nav-btn"
          onClick={goHome}
          title="Home"
        >
          ⌂
        </button>
        {url && (
          <button
            className="win95-button ie-nav-btn"
            onClick={() => openInRealBrowser(url)}
            title="Open in Real Browser"
          >
            ↗
          </button>
        )}
      </div>

      {/* Address Bar */}
      <form className="ie-address-bar" onSubmit={handleSubmit}>
        <label>Address:</label>
        <input
          type="text"
          value={displayUrl}
          onChange={(e) => setDisplayUrl(e.target.value)}
          placeholder="Enter a web address..."
          className="ie-address-input"
        />
        <button type="submit" className="win95-button">Go</button>
      </form>

      {/* Content */}
      <div className="ie-content">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'downloads' && renderDownloads()}
        {currentPage === 'search' && renderSearch()}
        {currentPage === 'browse' && renderBrowser()}
        {currentPage === 'error' && renderError()}
      </div>

      {/* Status Bar */}
      <div className="ie-status-bar">
        <span>
          {isLoading ? 'Loading...' : currentPage === 'browse' ? url : currentPage === 'search' ? 'Done' : 'Ready'}
        </span>
      </div>
    </div>
  );
}
