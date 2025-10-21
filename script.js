// --- IMPORTANT: CONFIGURE THESE VALUES ---
// NOTE: These placeholder values are crucial for the app to function after deployment.
const CLIENT_ID = '86d5980bc6284ccba0515e63ddd32845'; // Spotify Client ID
const REDIRECT_URI = 'https://benjaminburnell.github.io/Lyrify/'; // Redirect URI
const LRCLIB_API_BASE = 'https://lrclib.net/api/search'; 
// ------------------------------------------

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const SCOPE = 'user-read-currently-playing'; // Scope needed to read current song

let accessToken = null;
let pollingIntervalId = null;

// --- State Variables ---
let progressUpdaterId = null; 
let currentTrackId = null;    
let progressStartTime = 0;    
let initialProgressMs = 0;    
let trackDurationMs = 0;      
let currentLyrics = null;     // Stores the lyrics object
let activeLyricIndex = -1;    // Index of the currently highlighted lyric line
let currentStyle = 'centered-scroll'; // Tracks the current style (Default set here)

// Storing original login state for restoration on failure
const originalLoginMessage = `The ultimate synchronized lyric experience for Spotify.<br>See what you hear, in real-time.`;
const originalButtonText = `Connect with Spotify`;

// --- Global Art URL to set the CSS Variable ---
let currentAlbumArtUrl = 'https://placehold.co/800x800/1DB954/ffffff?text=Lyrify';

// --- UI Element References ---
const loginSection = document.getElementById('login-section');
const statusSection = document.getElementById('status-section');
const loginMessage = document.getElementById('login-message'); 
const loginButton = document.getElementById('login-button'); 
const loginButtonText = document.getElementById('login-button-text'); 
const mediaColumn = document.getElementById('media-column');
// const styleSelectionSection = document.getElementById('style-selection-section'); // Now inside sidebar
const statusMessage = document.getElementById('status-message');
const songDisplay = document.getElementById('song-display');
const songTitle = document.getElementById('song-title');
const artistName = document.getElementById('artist-name');
const albumName = document.getElementById('album-name');
const albumArt = document.getElementById('album-art');
const progressBar = document.getElementById('progress-bar');
const pollingIndicator = document.getElementById('polling-indicator');
const currentTimeText = document.getElementById('current-time');
const durationTimeText = document.getElementById('duration-time');
const lyricsContent = document.getElementById('lyrics-content');
const lyricsColumn = document.getElementById('lyrics-column');

// NEW REFERENCES for style card structure
const stylePreviewCards = document.querySelectorAll('.style-preview-card'); 

// --- NEW SIDEBAR REFERENCES ---
const appBody = document.getElementById('app-body');
const settingsButton = document.getElementById('settings-button');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const mainContentWrapper = document.getElementById('main-content-wrapper');
const closeSidebarButton = document.getElementById('close-sidebar-button');


// --- Custom Cursor Logic (New Addition for Movement and Hover Effect) ---
const customCursor = document.getElementById('custom-cursor'); 

// 1. Movement Logic: Follow the mouse
document.addEventListener('mousemove', (e) => {
    // Updates the position of the cursor element
    customCursor.style.left = `${e.clientX}px`;
    customCursor.style.top = `${e.clientY}px`;
});


// 2. Hover Logic: Change cursor appearance over interactive elements

// Select all elements that should trigger a cursor change (links, buttons, headers, cards)
const targets = document.querySelectorAll(
    'p, h2, #song-display, button, .style-preview-card'
);

// Add event listeners to each target element
targets.forEach(target => {
    // When the mouse hovers over the target
    target.addEventListener('mouseover', () => {
        // Add the 'hover-target' class to the custom cursor
        customCursor.classList.add('hover-target');
    });

    // When the mouse leaves the target
    target.addEventListener('mouseout', () => {
        // Remove the 'hover-target' class from the custom cursor
        customCursor.classList.remove('hover-target');
    });
});

// --- Sidebar Toggling Logic (UPDATED) ---
function toggleSidebar(open) {
    const shouldOpen = typeof open === 'boolean' ? open : !sidebar.classList.contains('open');

    if (shouldOpen) {
        sidebar.classList.add('open');
        // Apply shift class for desktop layout to move main content
        mainContentWrapper.classList.add('sidebar-shift');
        
        // Hide the main settings button when the sidebar is open
        settingsButton.style.opacity = 0;
        settingsButton.style.pointerEvents = 'none';
        
    } else {
        sidebar.classList.remove('open');
        mainContentWrapper.classList.remove('sidebar-shift');
        
        // Show the main settings button when the sidebar is closed
        settingsButton.style.opacity = 1;
        settingsButton.style.pointerEvents = 'auto';
    }
}

// Attach event listeners for the sidebar
settingsButton.addEventListener('click', () => toggleSidebar(true));
sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));
// NEW: Attach listener to the close button inside the sidebar
closeSidebarButton.addEventListener('click', () => toggleSidebar(false));

// Close sidebar when a setting is changed (optional, but good UX)
// NOTE: The logic for closing the sidebar on style selection is now in updateLyricStyle()

// --- Utility Functions (Rest of the file is largely the same) ---

/**
 * Extracts the average RGB color from an image element using Canvas.
 * Samples a grid of pixels to get a robust average.
 * Returns an array [R, G, B]. Returns default [29, 185, 84] on failure.
 * NOTE: Requires the image element to have crossOrigin="anonymous".
 */
function getAverageColor(imgElement) {
    let r = 0, g = 0, b = 0, count = 0;
    const defaultColor = [29, 185, 84]; // Default to Spotify green

    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const width = imgElement.naturalWidth || 95; // Use 95px as fallback from CSS
        const height = imgElement.naturalHeight || 95;
        
        if (width === 0 || height === 0) {
            return defaultColor;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(imgElement, 0, 0, width, height);

        // Sample a grid of pixels (e.g., 10x10 grid)
        const gridSize = 10;
        const stepX = Math.floor(width / gridSize);
        const stepY = Math.floor(height / gridSize);
        
        for (let x = 0; x < width; x += stepX) {
            // FIX: Corrected the loop structure to include the condition '< height'
            for (let y = 0; y < height; y += stepY) { 
                // The getImageData call will fail if CORS isn't properly configured on the image server
                const pixelData = context.getImageData(x, y, 1, 1).data;
                r += pixelData[0];
                g += pixelData[1];
                b += pixelData[2];
                count++;
            }
        }

        if (count === 0) return defaultColor;
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        // Simple adjustment for very dark colors to ensure visibility as an accent 
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 50) { 
            r = Math.min(255, r + 50);
            g = Math.min(255, g + 50);
            b = Math.min(255, b + 50);
        }

        return [r, g, b];
        
    } catch (e) {
        console.warn("Could not extract color (likely CORS failure). Using default Spotify green.", e);
        return defaultColor;
    }
}

/** Generates a cryptographically secure random string. */
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // FIX: Corrected typo from Uint8array to Uint8Array
    const randomValues = crypto.getRandomValues(new Uint8Array(length)); 
    return randomValues.reduce((acc, x) => acc + possible[x % possible.length], "");
}

/** Base64-URL encodes a buffer. */
function base64urlencode(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/** Creates a SHA256 hash and converts it to a base64 URL-safe string. */
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64urlencode(hash);
}

/** Converts milliseconds to MM:SS format. */
function msToTime(ms) {
    if (ms === null || isNaN(ms) || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** * Cleans up track titles by removing common metadata in parentheses or brackets 
 * and removing punctuation that might interfere with string matching. 
 */
function cleanTrackTitle(title) {
    // 1. Remove text in parentheses (e.g., (Live), (Remix))
    let cleaned = title.replace(/\s*\(.*?\)\s*/g, ' ');
    // 2. Remove text in brackets (e.g., [Explicit], [Official Video])
    cleaned = cleaned.replace(/\s*\[.*?\]\s*/g, ' ');
    // 3. Remove common features/mixes (e.g., "feat. Artist", " - Radio Edit")
    cleaned = cleaned.replace(/\s(feat|ft)\..*/i, '').replace(/\s-\s(Radio|Album|Single|Original|Acoustic|Remastered|20\d{2})\s(Edit|Mix|Version).*/i, '').trim();
    // 4. Clean up multiple spaces left over
    return cleaned.replace(/\s+/g, ' ').trim();
}

/** * Parses LRC content into a structured array of lyric lines with time in milliseconds. */
function parseLrc(lrcContent) {
    const lines = [];
    // Regex handles [mm:ss.xx] or [mm:ss.xxx]
    const lrcRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    lrcContent.split('\n').forEach(line => {
        const match = line.match(lrcRegex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            // Milliseconds can be 2 or 3 digits. Normalize to 3.
            let ms = parseInt(match[3].padEnd(3, '0'), 10);
            const text = match[4].trim() || ' ';

            // Apply a slight look-ahead delay to make the lyric appear *before* the timecode
            const timeMs = (minutes * 60 * 1000) + (seconds * 1000) + ms - 150; // 150ms lookahead
            
            if (timeMs >= 0) {
                lines.push({ time: timeMs, text: text });
            }
        }
    });
    
    lines.sort((a, b) => a.time - b.time);
    
    return lines;
}


// --- Lyrics Management (LRC Lib Integration) ---

/** Fetches synchronized lyrics from LRC Lib using cleaned track, artist, and album info. */
async function fetchSyncedLyrics(trackName, artistName, albumName) {
    lyricsContent.innerHTML = `
        <p style="color:#9ca3af; font-style:italic; font-size:1.5rem; margin-top:1rem; text-align:center;">
            Fetching synchronized lyrics...
        </p>
    `;
    
    const cleanedTrackName = cleanTrackTitle(trackName);
    let results = null;

    try {
        // --- Query 1: Track + Artist + Album (Most specific) ---
        const url1 = `${LRCLIB_API_BASE}?track_name=${encodeURIComponent(cleanedTrackName)}&artist_name=${encodeURIComponent(artistName)}&album_name=${encodeURIComponent(albumName)}&limit=5`;
        const response1 = await fetch(url1);
        if (response1.ok) {
            results = await response1.json();
            if (results && results.length > 0) {
                // Prefer exact matches on artist and album
                const exactMatch = results.find(
                    r =>
                        r.artistName?.toLowerCase() === artistName.toLowerCase() &&
                        r.albumName?.toLowerCase() === albumName.toLowerCase()
                );
                if (exactMatch && exactMatch.syncedLyrics) {
                    console.log("🎯 Matched by track + artist + album:", exactMatch);
                    return parseLrc(exactMatch.syncedLyrics);
                }
            }
        }

        // --- Query 2: Track + Artist (next best) ---
        const url2 = `${LRCLIB_API_BASE}?track_name=${encodeURIComponent(cleanedTrackName)}&artist_name=${encodeURIComponent(artistName)}&limit=5`;
        const response2 = await fetch(url2);
        if (response2.ok) {
            results = await response2.json();
            if (results && results.length > 0) {
                const match = results.find(r => r.syncedLyrics);
                if (match) {
                    console.log("🎯 Matched by track + artist:", match);
                    return parseLrc(match.syncedLyrics);
                }
            }
        }

        // --- Query 3: Track only (broadest) ---
        const url3 = `${LRCLIB_API_BASE}?track_name=${encodeURIComponent(cleanedTrackName)}&limit=3`;
        const response3 = await fetch(url3);
        if (response3.ok) {
            results = await response3.json();
            if (results && results.length > 0 && results[0].syncedLyrics) {
                console.log("🎯 Matched by track only:", results[0]);
                return parseLrc(results[0].syncedLyrics);
            }
        }

        console.warn(`❌ No synced lyrics found after all attempts for "${trackName}"`);
        return null;

    } catch (error) {
        console.error("Error fetching lyrics from LRC Lib:", error);
        return null;
    }
}

/** Renders the lyrics lines to the container, or shows a "not available" message. */
function renderLyrics(lyrics, trackName, artistName) {
    activeLyricIndex = -1; // Reset lyric state
    
    // Get the current style
    // currentStyle is already managed by the updateLyricStyle function

    if (lyrics && lyrics.length > 0) {
        lyricsContent.innerHTML = '';
        
        // Add a dummy spacer element to help vertically center the active line
        const spacer = document.createElement('div');
        spacer.style.width = '100%';
        spacer.style.height = '50vh';
        spacer.style.flexShrink = '0';
        lyricsContent.appendChild(spacer);
        
        lyrics.forEach((line, index) => {
            const p = document.createElement('p');
            p.textContent = line.text || ' ';
            p.className = 'lyric-line';
            p.id = `lyric-line-${index}`;
            
            // 1. Apply Style Class and Randomization Logic
            if (currentStyle === 'explosion-pop') {
                p.classList.add('explosion-pop');
                
                // 2. Apply Random X Offset for the "Explosion Pop" effect
                // Offset between -25% and 25% of its container width
                const randomX = (Math.random() * 50) - 25;
                // Apply the style to the transform to give the 'explosion' effect.
                p.style.transform = `scale(0.85) translateY(10px) translateX(${randomX}%)`;
                
            // NEW: Add the 'fade' class for the new style
            } else if (currentStyle === 'fade') { 
                p.classList.add('fade');
            
            // Logic for 'three-d-scatter'
            } else if (currentStyle === 'three-d-scatter') {
                p.classList.add('three-d-scatter');
                
                // 2. Apply Random 3D Transform
                // Random Z (depth) between -300px (closer) and 300px (farther)
                const randomZ = (Math.random() * 600) - 300; 
                // Random Scale (makes the Z-effect look more dramatic)
                const randomScale = 0.7 + (Math.random() * 0.3); // Scale between 0.7 and 1.0
                // Random Rotation (for extra scatter effect)
                const randomRotateX = (Math.random() * 20) - 10; // -10deg to 10deg
                const randomRotateY = (Math.random() * 20) - 10; // -10deg to 10deg
                
                // The transform is set here permanently and is not reset on activation.
                p.style.transform = `scale(${randomScale}) translateZ(${randomZ}px) rotateX(${randomRotateX}deg) rotateY(${randomRotateY}deg)`;
            }
            // 'centered-scroll' needs no extra class/transform on initial render

            lyricsContent.appendChild(p);
        });

        // Add another dummy spacer at the bottom
        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.width = '100%';
        bottomSpacer.style.height = '50vh';
        bottomSpacer.style.flexShrink = '0';
        lyricsContent.appendChild(bottomSpacer);
        
        // Prepare the lyrics container for dynamic scrolling
        lyricsContent.style.justifyContent = 'flex-start';
        lyricsContent.style.overflowY = 'scroll';
        
    } else {
        // Show "Not Available" message
        lyricsContent.style.overflowY = 'hidden';
        lyricsContent.style.justifyContent = 'center';
        lyricsContent.innerHTML = `
            <p style="color:#9ca3af; font-style:italic; margin-bottom:1rem; margin-top:2rem; font-size:1.5rem; font-weight:300; text-align:center;">
                No synchronized lyrics available for:
                <br><span style="font-weight:600; color:#ffffff;">"${trackName}" by ${artistName}</span>
            </p>
            <p style="color:#6b7280; font-size:0.875rem; margin-top:1rem; text-align:center;">
                (Searching with: "${cleanTrackTitle(trackName)}")
            </p>
        `;
    }
}

/** Finds and highlights the current lyric line based on progressMs and scrolls it. */
function updateLyricHighlight(progressMs) {
    if (!currentLyrics) return;

    const lines = currentLyrics;
    let newIndex = -1;

    // Find the index of the line whose time is less than or equal to the current progress
    for (let i = lines.length - 1; i >= 0; i--) {
        if (progressMs >= lines[i].time) {
            newIndex = i;
            break;
        }
    }
    
    if (newIndex !== activeLyricIndex) {
        // Deactivate the old line
        if (activeLyricIndex !== -1) {
            const oldLine = document.getElementById(`lyric-line-${activeLyricIndex}`);
            if (oldLine) {
                oldLine.classList.remove('active');
                // Restore color for deactivated line to make text mask disappear
                oldLine.style.color = '#7d7d7d'; 
            }
        }

        // Activate the new line
        if (newIndex !== -1) {
            const newLine = document.getElementById(`lyric-line-${newIndex}`);
            if (newLine) {
                newLine.classList.add('active');
                
                // CRITICAL: Reset the custom transform style ONLY for 'explosion-pop' 
                if (currentStyle === 'explosion-pop') {
                        // Reset the inline transform to allow the CSS active rule to take over (which has a hardcoded transform)
                        newLine.style.transform = ''; 
                } 
                
                // Scroll to center the newly active line
                const targetElement = lyricsContent.children[newIndex + 1];
                if (targetElement) {
                        targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center' // This centers the element in the scrolling viewport
                    });
                }
            }
        }
        activeLyricIndex = newIndex;
    }
}


// --- Authentication Flow (Unchanged) ---

function redirectToAuthCodeFlow() {
    const codeVerifier = generateRandomString(128);
    localStorage.setItem('code_verifier', codeVerifier);
    console.log("Requested Spotify Scope:", SCOPE);

    sha256(codeVerifier).then(codeChallenge => {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPE,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: REDIRECT_URI,
        });

        window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
    }).catch(e => {
        console.error("Error generating code challenge:", e);
        loginMessage.innerHTML = '<span style="color:#f87171;">Authentication setup failed. See console.</span>';
    });
}

async function getAccessToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    if (!codeVerifier) {
        console.error("Code verifier not found.");
        return null;
    }
    
    localStorage.removeItem('code_verifier'); 

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
    });

    try {
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Token request failed: ${response.status}`, errorData);
            return null; 
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error);
        return null;
    }
}


// --- Spotify API Interaction & Polling (Unchanged) ---

async function fetchCurrentlyPlaying() {
    try {
        const response = await fetch(NOW_PLAYING_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.status === 204) return null;

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = REDIRECT_URI; 
                return null;
            } 
            if (response.status === 403) {
                    statusMessage.textContent = `403 FORBIDDEN: Your Spotify account is not whitelisted for this app.`;
                    songDisplay.classList.add('hidden');
                    throw new Error(`API Error 403 Forbidden.`);
            }
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error fetching currently playing track:', error);
        if (!error.message.includes('403')) {
            clearInterval(pollingIntervalId);
            pollingIndicator.classList.add('hidden');
            statusMessage.textContent = 'A critical network error occurred.';
        }
        return null;
    }
}

/** Runs every 250ms to smoothly update the progress bar, time, and lyrics. */
function smoothUpdateProgress() {
    const elapsedTime = Date.now() - progressStartTime;
    let currentProgressMs = initialProgressMs + elapsedTime;

    if (currentProgressMs > trackDurationMs) {
        currentProgressMs = trackDurationMs;
    }

    const progressPercent = (currentProgressMs / trackDurationMs) * 100;
    
    // Update UI
    progressBar.style.width = `${progressPercent}%`;
    currentTimeText.textContent = msToTime(currentProgressMs);
    durationTimeText.textContent = msToTime(trackDurationMs);

    // Update Lyrics
    if (currentLyrics) {
        updateLyricHighlight(currentProgressMs);
    }
}


/** Main logic to poll for the currently playing song every 1 seconds. */
function pollForSong() {
    loginSection.classList.add('hidden');
    statusSection.classList.remove('hidden');
    settingsButton.classList.remove('hidden'); // Show the settings button
    
    statusMessage.textContent = 'Checking Spotify status...';
    lyricsContent.style.justifyContent = 'center';
    lyricsContent.innerHTML = `<p style="color:#9ca3af; font-style:italic; font-size:1.5rem;">
        Spotify connected. Checking for active playback...
    </p>`;

    pollingIndicator.classList.remove('hidden');

    pollingIntervalId = setInterval(async () => {
        const data = await fetchCurrentlyPlaying();
        
        if (data && data.is_playing) {
            const track = data.item;
            const artistText = track.artists.map(a => a.name).join(', ');
            const newArtUrl = track.album.images[0]?.url || 'https://placehold.co/800x800/1DB954/ffffff?text=No+Art';

            if (track.id !== currentTrackId) {
                
                console.log('New track detected or resumed.');
                
                if (progressUpdaterId) clearInterval(progressUpdaterId);
                
                // Update Album Art URL global variable and CSS variable for text mask
                currentAlbumArtUrl = newArtUrl;
                document.documentElement.style.setProperty('--album-art-url', `url('${currentAlbumArtUrl}')`);

                // Fetch and render new lyrics
                currentLyrics = await fetchSyncedLyrics(track.name, artistText, track.album.name);
                renderLyrics(currentLyrics, track.name, artistText);
                
                // Update Metadata
                songTitle.textContent = track.name;
                artistName.textContent = artistText;
                albumName.textContent = track.album.name;

                // --- NEW COLOR EXTRACTION LOGIC ---
                albumArt.onload = function() {
                    const [r, g, b] = getAverageColor(albumArt);
                    const colorRGB = `rgb(${r}, ${g}, ${b})`;
                    // Use a slightly transparent version for the shadow/glow effect
                    const colorRGBA = `rgba(${r}, ${g}, b, 0.8)`; 

                    // Set CSS variables on the root element
                    document.documentElement.style.setProperty('--accent-color', colorRGB);
                    document.documentElement.style.setProperty('--accent-shadow', colorRGBA);
                    
                    // Log the color for debugging
                    console.log(`Extracted Accent Color: ${colorRGB}`);
                };
                
                // Only update src if it's new to prevent unnecessary reloads
                if (albumArt.src !== newArtUrl) {
                    albumArt.src = newArtUrl;
                }

                // If the image is already cached and ready, manually trigger onload
                if (albumArt.complete) {
                    albumArt.onload(); 
                }
                // --- END NEW COLOR EXTRACTION LOGIC ---

                // Start smooth update
                currentTrackId = track.id;
                initialProgressMs = data.progress_ms;
                trackDurationMs = data.item.duration_ms;
                progressStartTime = Date.now();
                
                progressUpdaterId = setInterval(smoothUpdateProgress, 250);

                // Initial manual update
                smoothUpdateProgress();
                
                statusMessage.textContent = ''; // Clear status message
                songDisplay.classList.remove('hidden');
                pollingIndicator.classList.add('hidden');
                
            } else {
                // Same track: Re-sync if seeked
                const expectedProgressMs = initialProgressMs + (Date.now() - progressStartTime);
                const reportedProgressMs = data.progress_ms;
                if (Math.abs(expectedProgressMs - reportedProgressMs) > 2000) {
                    console.log('Seek detected! Re-syncing progress.');
                    initialProgressMs = reportedProgressMs;
                    progressStartTime = Date.now();
                }
            }

        } else {
            // Nothing playing or paused
            if (progressUpdaterId) {
                clearInterval(progressUpdaterId);
                progressUpdaterId = null;
            }
            currentTrackId = null;
            currentLyrics = null;
            
            if (data && !data.is_playing && data.item) {
                const artistText = data.item.artists.map(a => a.name).join(', ');
                statusMessage.textContent = `Music is paused: ${data.item.name} by ${artistText}`;
            } else if (!statusMessage.textContent.includes('403')) {
                statusMessage.textContent = 'Waiting for you to start playing music...';
            }
            
            songDisplay.classList.add('hidden');
            pollingIndicator.classList.remove('hidden');
            
            // Reset lyric view
            lyricsContent.style.justifyContent = 'center';
            lyricsContent.innerHTML = `<p style="color:#9ca3af; font-style:italic; font-size:1.5rem;">Start a song on Spotify to see the lyrics here.</p>`;
        }

    }, 1000); // Main state check every 1 seconds
}

/** Sets the current style, updates the selected card state, and re-renders lyrics. */
function updateLyricStyle(newStyle) {
    currentStyle = newStyle;

    // 1. Update the 'selected' visual state on the cards
    stylePreviewCards.forEach(card => {
        if (card.getAttribute('data-style-value') === newStyle) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    // 2. Only re-render if a track is currently loaded
    if (currentLyrics) {
        const currentTrackTitle = songTitle.textContent;
        const currentArtistName = artistName.textContent;
        renderLyrics(currentLyrics, currentTrackTitle, currentArtistName);
    }

    // 3. Close sidebar on mobile
    if (window.innerWidth < 1024) {
            toggleSidebar(false);
    }
}

// --- Main Initialization ---

async function init() {
    fetchSyncedLyrics("Promises", "Maverick City Music & ")
    
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (pollingIntervalId) clearInterval(pollingIntervalId);
    if (progressUpdaterId) clearInterval(progressUpdaterId);
    
    const loginButton = document.getElementById('login-button');
    const loginButtonText = document.getElementById('login-button-text');
    
    // Attach Listeners to the new Cards
    stylePreviewCards.forEach(card => {
        card.addEventListener('click', () => {
            const newStyle = card.getAttribute('data-style-value');
            if (newStyle) {
                updateLyricStyle(newStyle);
            }
        });
    });

    // Set the initial style state and highlight the default card
    updateLyricStyle(currentStyle);


    if (code) {
        // 1. User is being redirected back after Spotify login
        
        loginButton.disabled = true;
        loginButtonText.classList.add('pulse-icon');
        loginButtonText.textContent = `Authenticating...`;

        // Clean up the URL for a cleaner look
        history.replaceState(null, '', REDIRECT_URI); 

        accessToken = await getAccessToken(code);
        
        if (accessToken) {
            // 2. SUCCESS: Token retrieved. Proceed to app
            pollForSong();
            
        } else {
            // 3. FAILURE: Token exchange failed. Restore login screen and show error.
            
            loginButton.disabled = false;
            loginButtonText.classList.remove('pulse-icon');
            loginButtonText.textContent = originalButtonText; // Restore original text
            
            // Display error message in the login card
            loginMessage.innerHTML = '<span style="color:#f87171;">Authentication failed. Please check your console for details and try again.</span>';
        }

    } else {
        // Initial load: show login screen and attach handler
        loginButton.addEventListener('click', redirectToAuthCodeFlow);
    }
}

// Run the main function on page load
init();