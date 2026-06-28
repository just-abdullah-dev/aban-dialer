/**
 * Generate placeholder PWA icons
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template with dynamic size
const generateSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#gradient)"/>
  <path d="M${size * 0.725} ${size * 0.683}C${size * 0.717} ${size * 0.675} ${size * 0.696} ${size * 0.664} ${size * 0.681} ${size * 0.658}C${size * 0.667} ${size * 0.654} ${size * 0.622} ${size * 0.634} ${size * 0.608} ${size * 0.629}C${size * 0.595} ${size * 0.624} ${size * 0.584} ${size * 0.622} ${size * 0.574} ${size * 0.636}C${size * 0.564} ${size * 0.651} ${size * 0.544} ${size * 0.675} ${size * 0.534} ${size * 0.686}C${size * 0.525} ${size * 0.696} ${size * 0.516} ${size * 0.698} ${size * 0.501} ${size * 0.689}C${size * 0.487} ${size * 0.680} ${size * 0.442} ${size * 0.667} ${size * 0.388} ${size * 0.618}C${size * 0.344} ${size * 0.577} ${size * 0.314} ${size * 0.528} ${size * 0.304} ${size * 0.514}C${size * 0.295} ${size * 0.499} ${size * 0.303} ${size * 0.491} ${size * 0.312} ${size * 0.482}C${size * 0.319} ${size * 0.475} ${size * 0.328} ${size * 0.463} ${size * 0.336} ${size * 0.454}C${size * 0.344} ${size * 0.446} ${size * 0.348} ${size * 0.441} ${size * 0.353} ${size * 0.430}C${size * 0.358} ${size * 0.420} ${size * 0.355} ${size * 0.409} ${size * 0.351} ${size * 0.401}C${size * 0.346} ${size * 0.392} ${size * 0.314} ${size * 0.343} ${size * 0.301} ${size * 0.313}C${size * 0.288} ${size * 0.284} ${size * 0.276} ${size * 0.289} ${size * 0.267} ${size * 0.289}C${size * 0.257} ${size * 0.289} ${size * 0.247} ${size * 0.288} ${size * 0.236} ${size * 0.288}C${size * 0.226} ${size * 0.288} ${size * 0.209} ${size * 0.294} ${size * 0.196} ${size * 0.308}C${size * 0.182} ${size * 0.323} ${size * 0.143} ${size * 0.361} ${size * 0.143} ${size * 0.410}C${size * 0.143} ${size * 0.460} ${size * 0.180} ${size * 0.508} ${size * 0.189} ${size * 0.519}C${size * 0.197} ${size * 0.529} ${size * 0.314} ${size * 0.700} ${size * 0.488} ${size * 0.757}C${size * 0.662} ${size * 0.813} ${size * 0.662} ${size * 0.791} ${size * 0.694} ${size * 0.787}C${size * 0.727} ${size * 0.784} ${size * 0.768} ${size * 0.758} ${size * 0.778} ${size * 0.733}C${size * 0.787} ${size * 0.708} ${size * 0.787} ${size * 0.686} ${size * 0.782} ${size * 0.680}C${size * 0.778} ${size * 0.674} ${size * 0.768} ${size * 0.668} ${size * 0.753} ${size * 0.660}" fill="white"/>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
</svg>`;

console.log('🎨 Generating placeholder PWA icons...\n');

sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, svgFilename);

  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created: ${svgFilename}`);
});

console.log('\n📝 Note: SVG placeholders created.');
console.log('   To convert to PNG, use an online tool or ImageMagick:');
console.log('   magick icon-512x512.svg icon-512x512.png\n');
console.log('📍 Icons location: /public/icons/\n');
console.log('⚠️  Replace these placeholders with your actual logo!\n');
