# Lyrify

## Preview
<img src="https://s1.ezgif.com/tmp/ezgif-11c43742c18440.gif"></img>


## Overview

**Lyrify** is a modern, minimalistic web app that syncs **Spotify** with **real-time lyrics** — turning your music into a visual experience.  
It connects directly to your Spotify account and fetches synchronized lyrics from **LRC Lib**, offering a live karaoke-style display.

---

## Features

- **Spotify Integration** — Connect securely with your Spotify account.  
- **Real-time Sync** — See lyrics appear in perfect sync with your current song.  
- **Custom Lyric Styles** — Choose between dynamic visual modes:
  - Centered Scroll  
  - Explosion Pop  
  - Fade  
  - 3D Scatter  
- **Adaptive Colors** — Automatically adapts the lyric color theme to the current album art.  
- **Settings Sidebar** — Switch lyric animation styles on the fly.  
- **Responsive Design** — Works seamlessly on both desktop and mobile.

---

## How It Works

Lyrify uses the **Spotify Web API** for authentication and song data, and the **LRC Lib API** to fetch time-synced lyrics.

1. Authenticate with Spotify using the “Connect with Spotify” button.  
2. Lyrify polls your “currently playing” track.  
3. It fetches the synchronized lyrics from [https://lrclib.net](https://lrclib.net).  
4. Lyrics are animated in sync with your playback.

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Lyrify.git
cd Lyrify
```

### 2. Open in Your Browser
Just open `index.html` in your browser — no server setup or build step required!

> **If deploying to GitHub Pages:**  
> Update your redirect URI inside `index.html` to match your repository link:
```js
const REDIRECT_URI = 'https://yourusername.github.io/Lyrify/';
```

## Spotify API Configuration

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).  
2. Click **“Create an App.”**  
3. Add your Redirect URI (for example):
```js
https://yourusername.github.io/Lyrify/
```
5. Copy your **Client ID** and replace it in the script section of your `index.html` file:
```js
const CLIENT_ID = 'YOUR_CLIENT_ID';
```

5. Save your changes and reload the app.  
   You should now be able to connect to Spotify successfully!

> **Note:** You only need the `user-read-currently-playing` scope for this project — it allows the app to read your currently playing song.

---

## Built With

- **HTML, CSS, and Vanilla JavaScript**  
- **Spotify Web API** — for fetching your current track info  
- **LRC Lib API** — for synchronized lyrics data  
- **Canvas-based Color Extraction** — dynamically themes the interface based on album art  
- **CSS Animations & Custom Cursor Effects** — for a sleek and immersive experience  

---

## Future Enhancements

- [ ] Unsynced lyric fallback for missing tracks  
- [ ] Karaoke microphone mode  
- [ ] Additional lyric animation effects  
- [ ] Custom theme and color palette support  
- [ ] Crossfade lyric transitions  

---

## License

MIT License © 2025 Benjamin Burnell

You’re free to use, modify, and distribute this project under the terms of the MIT License.

---

## Credits

Developed by **Benjamin Burnell**  
Powered by the **Spotify Web API**, **LRC Lib**, and the love of music


