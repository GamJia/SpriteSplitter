# SpriteSplitter

A Cocos Creator extension that automatically generates a `.plist` file from a sprite sheet, defining individual sprite frames based on two modes:

- **Grid By Cell Size**: Define the width and height of each sprite frame in pixels within the sheet.
- **Grid By Cell Count**: Define how many columns and rows to divide the sprite sheet into.

This is the **first official release** of SpriteSplitter with automatic `.plist` generation!

---

## :sparkles: Features

- Generates `.plist` file for sprite sheets
- Grid by **Cell Size** for defining frame dimensions
- Grid by **Cell Count** for defining the number of frames
- Simple and clean UI
- Fast processing using [sharp](https://www.npmjs.com/package/sharp)
- `.plist` file saved in the same folder as the original image
- Sprite frame names automatically generated as `sprite_0`, `sprite_1`, etc.

---

## :package: How to Use

1. Open **Extension → SpriteSplitter** panel in Cocos Creator.
2. Select a PNG sprite sheet file manually or from the Asset Database.
3. Choose the slicing mode:
   - Grid By Cell Size: set the width and height of each sprite frame in pixels.
   - Grid By Cell Count: set the number of columns and rows to divide the sprite sheet.
4. Click **Convert**. A `.plist` file will be created in the same folder as your sprite sheet.

---

## 🛠 Build & Develop

```bash
git clone https://github.com/GamJia/SpriteSpliltter.git
npm install
npm run build
```
---
## :package: Packaging for Cocos Creator

To package the extension for use in Cocos Creator, run:

```bash
// Run the packaging command for all plugins in the extensions directory
npm run pack
```
---
## 🗂 Project Structure 

```bash
sprite-splitter/
├── extension/
│   ├── index.html       # Panel UI
│   ├── index.ts         # Main logic
│   ├── index.css        # Styling
├── logo.png
├── package.json
├── tsconfig.json
└── README.md
```

---



## :receipt: License



MIT License © 2025

Created with :heart: for Cocos Creator developers

