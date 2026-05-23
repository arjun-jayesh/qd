/**
 * Sharp Image Optimization Pipeline
 * -----------------------------------
 * Generates optimized .webp and .avif variants for all images.
 * Creates responsive width variants for hero/featured images.
 * 
 * Usage: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

// Configuration
const INPUT_DIR = path.resolve(__dirname, '..', 'images');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'images-optimized');

const HERO_WIDTHS = [480, 768, 1280, 1920];
const QUALITY = {
  webp: 80,
  avif: 65,
  jpg: 82,
};

// Directories containing hero / featured images that need responsive variants
const RESPONSIVE_DIRS = [
  'home',
  'home/featured',
];

// Track stats
let stats = { processed: 0, skipped: 0, errors: 0 };

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function optimizeImage(inputPath, outputDir, generateResponsive = false) {
  const ext = path.extname(inputPath).toLowerCase();
  const basename = path.basename(inputPath, ext);

  // Skip non-image files
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    stats.skipped++;
    return;
  }

  try {
    const img = sharp(inputPath);
    const metadata = await img.metadata();

    // Generate standard WebP
    await sharp(inputPath)
      .webp({ quality: QUALITY.webp })
      .toFile(path.join(outputDir, `${basename}.webp`));

    // Generate standard AVIF
    await sharp(inputPath)
      .avif({ quality: QUALITY.avif })
      .toFile(path.join(outputDir, `${basename}.avif`));

    // Compress original format
    if (ext === '.png') {
      await sharp(inputPath)
        .png({ quality: QUALITY.jpg, compressionLevel: 9 })
        .toFile(path.join(outputDir, `${basename}.png`));
    } else {
      await sharp(inputPath)
        .jpeg({ quality: QUALITY.jpg, mozjpeg: true })
        .toFile(path.join(outputDir, `${basename}.jpg`));
    }

    // Generate responsive width variants for hero images
    if (generateResponsive && metadata.width > 480) {
      for (const width of HERO_WIDTHS) {
        if (width < metadata.width) {
          await sharp(inputPath)
            .resize(width)
            .webp({ quality: QUALITY.webp })
            .toFile(path.join(outputDir, `${basename}-${width}.webp`));

          await sharp(inputPath)
            .resize(width)
            .avif({ quality: QUALITY.avif })
            .toFile(path.join(outputDir, `${basename}-${width}.avif`));
        }
      }
    }

    stats.processed++;
    console.log(`✓ ${path.relative(INPUT_DIR, inputPath)}`);
  } catch (err) {
    stats.errors++;
    console.error(`✗ ${path.relative(INPUT_DIR, inputPath)}: ${err.message}`);
  }
}

async function processDirectory(dir, outputBase, isResponsive = false) {
  const fullDir = path.join(INPUT_DIR, dir);
  if (!fs.existsSync(fullDir)) {
    console.log(`⚠ Directory not found: ${dir}`);
    return;
  }

  const outputDir = path.join(OUTPUT_DIR, dir);
  await ensureDir(outputDir);

  const files = fs.readdirSync(fullDir);
  for (const file of files) {
    const fullPath = path.join(fullDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(path.join(dir, file), outputBase, isResponsive);
    } else {
      const needsResponsive = isResponsive || RESPONSIVE_DIRS.includes(dir);
      await optimizeImage(fullPath, outputDir, needsResponsive);
    }
  }
}

async function main() {
  console.log('🖼️  Sharp Image Optimization Pipeline');
  console.log('=====================================\n');

  await ensureDir(OUTPUT_DIR);

  // Process all subdirectories
  const topDirs = fs.readdirSync(INPUT_DIR).filter((f) => {
    const fullPath = path.join(INPUT_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const dir of topDirs) {
    const isResponsive = RESPONSIVE_DIRS.some(
      (rd) => dir === rd || rd.startsWith(dir + '/')
    );
    await processDirectory(dir, OUTPUT_DIR, isResponsive);
  }

  // Process root-level images
  const rootFiles = fs.readdirSync(INPUT_DIR).filter((f) => {
    return fs.statSync(path.join(INPUT_DIR, f)).isFile();
  });
  for (const file of rootFiles) {
    await optimizeImage(path.join(INPUT_DIR, file), OUTPUT_DIR, false);
  }

  console.log('\n=====================================');
  console.log(`✅ Processed: ${stats.processed}`);
  console.log(`⏭️  Skipped:   ${stats.skipped}`);
  console.log(`❌ Errors:    ${stats.errors}`);
}

main().catch(console.error);
