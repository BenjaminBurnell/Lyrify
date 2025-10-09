# 🎵 Lyrify

<img width="1918" height="867" alt="Lyrify Screenshot 1" src="https://github.com/user-attachments/assets/7b49b9ff-277b-43b1-9b4e-5f430482ef93" />
<img width="1918" height="867" alt="Lyrify Screenshot 2" src="https://github.com/user-attachments/assets/a490a5b5-513a-4ac1-ac62-a31e1fcfb093" />

## 🌟 Overview

**Lyrify** is a modern, minimalistic web app that syncs **Spotify** with **real-time lyrics** — turning your music into a visual experience.  
It connects directly to your Spotify account and fetches synchronized lyrics from **LRC Lib**, offering a live karaoke-style display.

---

## 🚀 Features

- 🎧 **Spotify Integration** — Connect securely with your Spotify account.  
- 🕐 **Real-time Sync** — See lyrics appear in perfect sync with your current song.  
- 🎨 **Custom Lyric Styles** — Choose between dynamic visual modes:
  - Centered Scroll  
  - Explosion Pop  
  - Fade  
  - 3D Scatter  
- 🌈 **Adaptive Colors** — Automatically adapts the lyric color theme to the current album art.  
- ⚙️ **Settings Sidebar** — Switch lyric animation styles on the fly.  
- 💻 **Responsive Design** — Works seamlessly on both desktop and mobile.

---

## 🧩 How It Works

Lyrify uses the **Spotify Web API** for authentication and song data, and the **LRC Lib API** to fetch time-synced lyrics.

1. Authenticate with Spotify using the “Connect with Spotify” button.  
2. Lyrify polls your “currently playing” track.  
3. It fetches the synchronized lyrics from [https://lrclib.net](https://lrclib.net).  
4. Lyrics are animated in sync with your playback.

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Lyrify.git
cd Lyrify
