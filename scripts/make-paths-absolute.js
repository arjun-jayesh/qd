const fs = require('fs');
const path = require('path');
const { sync } = require('glob');

const ROOT_DIR = path.resolve(__dirname, '..');

const htmlFiles = sync('**/*.html', {
  cwd: ROOT_DIR,
  ignore: ['node_modules/**', 'dist/**'],
});

console.log(`Found ${htmlFiles.length} HTML files to absolute-ize paths.`);

htmlFiles.forEach((file) => {
  const filePath = path.join(ROOT_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Regex to match attributes like href="style.css" or src="js/jquery.min.js"
  // We want to match: (href|src)=" (without a leading slash) followed by:
  // - style.css
  // - css/
  // - js/
  // - images/
  // - images-optimized/
  // - favicon
  // - apple-touch-icon
  
  const attributeRegex = /(href|src)=["'](style\.css|css\/|js\/|images\/|images-optimized\/|favicon|apple-touch-icon)([^"']*)["']/g;
  
  if (attributeRegex.test(content)) {
    content = content.replace(attributeRegex, (match, attr, pathType, rest) => {
      // Prepend / to the matched relative path
      console.log(`  Converting: ${match} -> ${attr}="/${pathType}${rest}"`);
      return `${attr}="/${pathType}${rest}"`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated paths in ${file}`);
  } else {
    console.log(`- No path changes needed for ${file}`);
  }
});

console.log('\nPaths conversion complete!');
