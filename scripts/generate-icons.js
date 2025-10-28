#!/usr/bin/env node

/**
 * Generate PWA icons for Android
 * This script creates Android Chrome icons from an existing image
 */

const fs = require('fs');
const path = require('path');

// For now, this is a placeholder. You need to create these icons manually or use a tool like RoboHash
// or use an online converter like https://realfavicongenerator.net/

console.log(`
📱 PWA Icon Generation

To create the required Android Chrome icons:

Option 1 - Online Tool (Recommended):
1. Go to https://realfavicongenerator.net/
2. Upload your logo/icon
3. Select "Generate favicons and HTML code"
4. Download and extract the icons
5. Place these files in the public/ directory:
   - android-chrome-192x192.png
   - android-chrome-512x512.png

Option 2 - Manual Creation:
Create 192x192 and 512x512 PNG files with your logo and place them in public/

Option 3 - Use ImageMagick:
brew install imagemagick (if not installed)
convert public/cloaklogo.svg -resize 192x192 public/android-chrome-192x192.png
convert public/cloaklogo.svg -resize 512x512 public/android-chrome-512x512.png

After creating the icons, run: npm run pwa:init
`);

// Check if icons exist
const icon192 = path.join(__dirname, '../public/android-chrome-192x192.png');
const icon512 = path.join(__dirname, '../public/android-chrome-512x512.png');

const iconsExist = fs.existsSync(icon192) && fs.existsSync(icon512);

if (iconsExist) {
  console.log('✅ Icons already exist!');
} else {
  console.log('⚠️  Icons not found. Please create them using one of the options above.');
  process.exit(1);
}

