const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/icons/aban-logo.png');
const outputDir = path.join(__dirname, '../public/icons');

console.log('🎨 Generating PWA icons from aban-logo.png...\n');

async function generateIcons() {
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputFile);

    console.log(`✅ Created: icon-${size}x${size}.png`);
  }

  console.log('\n🎉 All PWA icons generated successfully!');
  console.log('📍 Location: /public/icons/\n');
}

generateIcons().catch(console.error);
