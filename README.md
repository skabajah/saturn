# <img src="https://skabajah.github.io/saturn/App/icons/saturn.svg" height="40" style="vertical-align: middle; pointer-events: none;"> Project Saturn

[https://skabajah.github.io/saturn/](https://skabajah.github.io/saturn/)


A lightweight, touch-friendly video player app for macOS, Windows, and Fire TV.


## Features

- Full-screen cinematic landing screen
- Auto-detects your platform and display environment
- Built-in video player with autoplay
- Remote-control friendly (Fire TV optimized)
- PWA-ready with icons and manifest
- Google Analytics integrated

---

## Download & Install

Grab the installer for your machine:

<table>
  <thead>
    <tr>
      <th>Platform</th>
      <th>Architecture</th>
      <th>File</th>
      <th>Direct Link</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Mac</strong> (Apple Silicon / M-Series)</td>
      <td><code>arm64</code></td>
      <td><code>mac-arm64.zip</code></td>
      <td><a href="https://www.dropbox.com/scl/fi/fz7jb7abhnxm1j6ksbyyx/mac-arm64.zip?rlkey=vchyk5euvjjq00z3am8d7qufi&st=i4dp8lcq&dl=1">Download</a></td>
    </tr>
    <tr>
      <td><strong>Mac</strong> (Intel)</td>
      <td><code>x64</code></td>
      <td><code>mac-intel.zip</code></td>
      <td><a href="https://www.dropbox.com/scl/fi/mve5vohv7hwjro9qnz2ux/mac-intel.zip?rlkey=rxzl1jt47qlzgthn82wwi3c1t&st=r8dy3w3r&dl=1">Download</a></td>
    </tr>
    <tr>
      <td><strong>Windows</strong></td>
      <td><code>x64</code></td>
      <td><code>windows-setup.zip</code></td>
      <td><a href="https://www.dropbox.com/scl/fi/ftb2arsz7wk2dka7j48bs/windows-setup.zip?rlkey=rarziyck4pzgx90lidr49ad4l&st=vhj2g8bc&dl=1">Download</a></td>
    </tr>
    <tr>
      <td><strong>Web</strong></td>
      <td><code>any</code></td>
      <td>—</td>
      <td><a href="https://skabajah.github.io/saturn/App/">Try it</a></td>
    </tr>
  </tbody>
</table>

---

### Web

**Try the demo:** A web version of Saturn is available at [skabajah.github.io/saturn/App](https://skabajah.github.io/saturn/App/). 
<br>
Please note this is an **early demo** — not the full standalone app — and **not all channels will function properly**.
<br>
For a better experience, download the standalone app for Mac or Windows below.

---

### Installing on macOS

1. Download the correct file for your Mac:
2. Double-click the `.zip` to extract it.
3. Drag **Saturn** into your `Applications` folder.
4. Remove the extracted folder and the original `.zip` once the app is in place.

#### How to fix the Mac Error  

*(Because the app is not signed by Apple, macOS will block it unless you bypass Gatekeeper first).*


##### Option 1 — Built-in allow (macOS 14 Sonoma and earlier)

1. Try to open the app once (it will be blocked).
2. Go to **System Settings → Privacy & Security** and click **Open Anyway**.
   *(Alternatively: right-click the app → **Open**.)*

##### Option 2 — Terminal `xattr` method (macOS 15 Sequoia and later, or if Option 1 fails)

1. Navigate to the download folder and extract the `.zip`

For example:

```
cd ~/Desktop
unzip -q mac-arm64.zip
cd mac-arm64
```

2. Remove the quarantine attribute

```
xattr -cr Saturn.app
```

> **What this does:** `xattr -cr` recursively clears all extended attributes (including the `com.apple.quarantine` flag) from the app bundle. This tells Gatekeeper the app didn't come from the internet, so it won't be blocked.

3. Copy the app into `/Applications`

```
cp -R Saturn.app /Applications/
```

> **Why:** Installing to `/Applications` is the standard macOS location, makes the app discoverable via Spotlight and Launchpad, and keeps it out of your Downloads/Desktop folder (which you may clean up later).

4. Launch the app

```
open /Applications/Saturn.app
```

5. Remove the setup files

Once the app launches successfully, delete the extracted folder and the original `.zip`:

```
cd ~/Desktop
rm -rf mac-arm64 mac-arm64.zip
```

---

### Installing on Windows

1. Download `windows-setup.zip` and extract it.
2. Double-click the `Saturn.exe` file.
3. If SmartScreen appears (*"Windows protected your PC"*), click **More info** → **Run anyway**.
4. Follow the installer prompts.
5. Delete the extracted setup files once installation is complete.

---

## License

All Rights Reserved © Shadi Kabajah
