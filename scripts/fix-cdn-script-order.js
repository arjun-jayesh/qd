/**
 * fix-cdn-script-order.js
 * 
 * Fixes the CDN script loading order for Vite builds.
 * 
 * Problem: Vite bundles local scripts into a type="module" script in <head>.
 * Module scripts are deferred by default. CDN scripts (GSAP, Three.js, etc.)
 * at the bottom of <body> with "defer" execute AFTER the module if the module
 * appears earlier in the document. This means the module code tries to use
 * gsap, THREE, etc. before they're defined.
 * 
 * Solution: Move CDN scripts into <head> and remove "defer" so they load
 * synchronously before the module. This guarantees globals are available.
 */
const fs = require('fs');
const path = require('path');
const { sync } = require('glob');

const ROOT_DIR = path.resolve(__dirname, '..');

const htmlFiles = sync('**/*.html', {
  cwd: ROOT_DIR,
  ignore: ['node_modules/**', 'dist/**'],
});

console.log(`Found ${htmlFiles.length} HTML files to fix CDN script order.\n`);

// CDN scripts that need to be in <head> (order matters)
const CDN_SCRIPTS = [
  'cdnjs.cloudflare.com/ajax/libs/gsap/',
  'cdnjs.cloudflare.com/ajax/libs/three.js/',
  'cdnjs.cloudflare.com/ajax/libs/jquery.imagesloaded/',
  'maps.googleapis.com/maps/api/js',
];

htmlFiles.forEach((file) => {
  const filePath = path.join(ROOT_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Extract all CDN script tags from the body
  const cdnScriptTags = [];
  
  for (const cdn of CDN_SCRIPTS) {
    // Match script tags containing this CDN URL
    const regex = new RegExp(
      `\\s*<script[^>]*src=['"][^'"]*${cdn.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')}[^'"]*['"][^>]*>\\s*</script>`,
      'gi'
    );
    
    const matches = content.match(regex);
    if (matches) {
      matches.forEach((tag) => {
        // Remove defer attribute and clean up the tag
        let cleanTag = tag.trim()
          .replace(/\s+defer\s*/gi, ' ')
          .replace(/\s+defer(?=>)/gi, '')
          .replace(/\s+defer(?=\s)/gi, '')
          .replace(/\s{2,}/g, ' ');
        
        cdnScriptTags.push(cleanTag);
        // Remove from original position
        content = content.replace(tag, '');
        modified = true;
      });
    }
  }

  if (cdnScriptTags.length > 0) {
    // Insert CDN scripts at the end of <head>, before </head>
    const headCloseRegex = /<\/head>/i;
    if (headCloseRegex.test(content)) {
      const cdnBlock = '\n\t<!-- CDN Dependencies (must load before Vite module) -->\n' +
        cdnScriptTags.map(tag => '\t' + tag).join('\n') + '\n';
      
      content = content.replace(headCloseRegex, cdnBlock + '</head>');
      console.log(`✓ Moved ${cdnScriptTags.length} CDN scripts to <head> in ${file}`);
    }
  }

  // Also remove any blank lines left behind from script removal
  content = content.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`- No CDN scripts to move in ${file}`);
  }
});

console.log('\nCDN script order fix complete!');
