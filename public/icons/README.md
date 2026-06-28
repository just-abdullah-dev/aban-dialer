# PWA Icons - Logo Placement Guide

## 📍 Where to Place Your Logo

Place your logo PNG files in this directory: `/public/icons/`

## Required Icon Sizes

You need to create **8 different sizes** of your logo:

### Icon Files Needed:
```
/public/icons/
├── icon-72x72.png       (72x72 pixels)
├── icon-96x96.png       (96x96 pixels)
├── icon-128x128.png     (128x128 pixels)
├── icon-144x144.png     (144x144 pixels)
├── icon-152x152.png     (152x152 pixels)
├── icon-192x192.png     (192x192 pixels)  ← Main icon
├── icon-384x384.png     (384x384 pixels)
└── icon-512x512.png     (512x512 pixels)  ← Largest icon
```

## 🎨 Design Guidelines

### Logo Requirements:
- **Format:** PNG with transparent background
- **Shape:** Square (1:1 aspect ratio)
- **Design:** Should look good at small sizes (72x72)
- **Safe Area:** Keep important content within center 80% (for maskable icons)
- **Colors:** Match your brand (current theme: Indigo/Purple gradient)

### Recommended Design:
- Simple, recognizable icon
- High contrast
- Works well on light AND dark backgrounds
- Avoid fine details (they get lost at small sizes)

## 🛠️ How to Generate Icons

### Option 1: Online Tool (Easiest)
Use **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
1. Upload your logo (512x512 or larger)
2. Download the generated icon pack
3. Replace files in `/public/icons/`

### Option 2: Using Figma/Photoshop
1. Create a 512x512 canvas
2. Place your logo in the center
3. Add 10% padding around edges
4. Export as PNG at each required size

### Option 3: Command Line (ImageMagick)
```bash
# Install ImageMagick first
# From your 512x512 source logo:

magick logo.png -resize 72x72 icon-72x72.png
magick logo.png -resize 96x96 icon-96x96.png
magick logo.png -resize 128x128 icon-128x128.png
magick logo.png -resize 144x144 icon-144x144.png
magick logo.png -resize 152x152 icon-152x152.png
magick logo.png -resize 192x192 icon-192x192.png
magick logo.png -resize 384x384 icon-384x384.png
magick logo.png -resize 512x512 icon-512x512.png
```

## 📱 Additional Assets (Optional)

### Splash Screens
Create splash screens for iOS:
```
/public/splash/
├── apple-splash-2048-2732.png
├── apple-splash-1668-2388.png
├── apple-splash-1536-2048.png
└── ... (more iOS sizes)
```

### Screenshots (For App Stores)
Place in `/public/screenshots/`:
```
/public/screenshots/
├── desktop-1.png    (1920x1080)
└── mobile-1.png     (390x844)
```

## ✅ Current Status

- ✅ PWA manifest configured
- ✅ Service worker enabled
- ✅ Icon placeholders created
- ⏳ **Waiting for actual logo files**

## 🚀 After Adding Icons

Once you've placed your icon files:

1. Test locally:
   ```bash
   npm run build
   npm run start
   ```

2. Check Lighthouse PWA score:
   - Open DevTools → Lighthouse
   - Run PWA audit
   - Should score 100%

3. Test installation:
   - Desktop: Look for install icon in address bar
   - Mobile: "Add to Home Screen" in browser menu

4. Verify icons:
   - Check home screen icon appearance
   - Check splash screen (iOS)
   - Check app switcher icon

## 📝 Notes

- Current placeholder: Purple gradient with phone icon
- Replace before production deployment
- Icons are cached by service worker (clear cache after update)
- iOS requires at least 180x180 for home screen

## Need Help?

If you need help generating icons:
1. Provide your logo as SVG or high-res PNG (minimum 512x512)
2. Use automated tool: https://realfavicongenerator.net/
3. Or use: https://favicon.io/favicon-converter/

---

**Last Updated:** 2025-06-28
**Status:** Awaiting logo files
