# <img src="https://skabajah.github.io/saturn/App/icons/saturn.svg" height="40" style="vertical-align: middle; pointer-events: none;"> Project Saturn

[Saturn App](https://skabajah.github.io/saturn/App/)

A lightweight, touch-friendly video player web app for browsers and Fire TV.

## Features

- Full-screen cinematic landing screen
- Auto-detects browser (Chrome, Safari, Firefox, Fire TV)
- Built-in video player with autoplay
- Remote-control friendly (Fire TV optimized)
- PWA-ready with icons and manifest
- Google Analytics integrated

## Quick Start

Open `index.html` in your browser, or serve locally with Python.

Click or tap anywhere to enter the app and start the player.

## Structure

- `index.html` – Main entry point
- `icons/` – Favicons and PWA assets
- `App/` – CSS and JavaScript (hosted externally)
- `landing.svg` – Splash screen graphic

## Customization

- **Video source**: Edit `controls.js` or add a `<source>` tag
- **Splash screen**: Replace `landing.svg`
- **Browser detection**: Modify the `userAgent` logic in `index.html`

## PWA Ready

Installable on Chrome and Edge for a native-like experience.

---

## Download & Install

Grab the installer for your machine from the [`files/`](./files/) folder:

| Platform | File | Direct Link |
|----------|------|-------------|
| **Mac (Apple Silicon)** | `Saturn-0.1.0-Mac-AppleSilicon.dmg` | [Download](./files/Saturn-0.1.0-Mac-AppleSilicon.dmg.zip) |
| **Mac (Intel)** | `Saturn-0.1.0-Mac-Intel.dmg` | [Download](./files/Saturn-0.1.0-Mac-Intel.dmg.zip) |
| **Windows** (x64) | `Saturn Setup 0.1.0.exe` | [Download](./files/Saturn%20Setup%200.1.0.exe.zip) |

---

### Installing on macOS

1. Download the correct `.dmg` for your Mac:
   - **Apple Silicon** → `Saturn-0.1.0-Mac-AppleSilicon.dmg`
   - **Intel** → `Saturn-0.1.0-Mac-Intel.dmg`
2. Double-click the `.dmg` to mount it.
3. Drag **Saturn** into your `Applications` folder.
4. Eject the disk image.

**First Launch (required):**
Because Saturn is unsigned, macOS will block it on first open.
1. Click **Done** on the warning.
2. Open **System Settings → Privacy & Security**.
3. Scroll to **Security** and click **Open Anyway**.
4. Enter your Mac password.

*(Or run this once in Terminal: `xattr -cr /Applications/Saturn.app`)*

---

### Installing on Windows

1. Download `Saturn Setup 0.1.0.exe`.
2. Double-click the `.exe`.
3. If SmartScreen appears (*"Windows protected your PC"*), click **More info** → **Run anyway**.
4. Follow the installer prompts.

---

## License

All Rights Reserved © Shadi Kabajah
