const fs = require('fs');
const path = require('path');
const { sync } = require('glob');

const ROOT_DIR = path.resolve(__dirname, '..');

// Find all HTML files in the workspace, excluding node_modules and dist
const htmlFiles = sync('**/*.html', {
  cwd: ROOT_DIR,
  ignore: ['node_modules/**', 'dist/**'],
});

console.log(`Found ${htmlFiles.length} HTML files to clean up.`);

htmlFiles.forEach((file) => {
  const filePath = path.join(ROOT_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Move Facebook Pixel noscript from head to body
  const fbNoscriptRegex = /<noscript>\s*<img[^>]*src="https:\/\/www\.facebook\.com\/tr\?[^"]+"[^>]*\/>\s*<\/noscript>/i;
  const match = content.match(fbNoscriptRegex);

  if (match) {
    const noscriptBlock = match[0];
    content = content.replace(fbNoscriptRegex, '');
    
    const bodyTagRegex = /(<body[^>]*>)/i;
    if (bodyTagRegex.test(content)) {
      content = content.replace(bodyTagRegex, `$1\n\t${noscriptBlock}`);
      console.log(`  Moved Facebook Pixel noscript in ${file}`);
      modified = true;
    }
  }

  // 2. Add type="module" to local js script tags
  const scriptRegex = /<script\s+(?![^>]*type="module")([^>]*src="js\/[^"]+"[^>]*)>/gi;
  if (scriptRegex.test(content)) {
    content = content.replace(scriptRegex, '<script type="module" $1>');
    console.log(`  Added type="module" to script tags in ${file}`);
    modified = true;
  }

  // 3. Fix missing whitespace between attributes (e.g., class="container"style="..." or class="foo"id="...")
  const missingSpaceRegex = /"([a-zA-Z]+)=/g;
  if (missingSpaceRegex.test(content)) {
    content = content.replace(missingSpaceRegex, '" $1=');
    console.log(`  Fixed missing whitespace between attributes in ${file}`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Cleaned and saved ${file}`);
  } else {
    console.log(`- No changes needed for ${file}`);
  }
});

console.log('\nHTML cleanup complete!');
