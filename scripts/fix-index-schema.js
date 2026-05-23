const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'insights', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the nested opening scripts precisely
const targetOpen = `<script type="application/ld+json">\r\n<script>`;
const targetOpenLf = `<script type="application/ld+json">\n<script>`;

if (content.includes(targetOpen)) {
  content = content.replace(targetOpen, '<script>');
  console.log('Fixed opening nested script tag (CRLF).');
} else if (content.includes(targetOpenLf)) {
  content = content.replace(targetOpenLf, '<script>');
  console.log('Fixed opening nested script tag (LF).');
} else {
  // Let's try regular expression replacement for robustness
  const regexOpen = /<script\s+type="application\/ld\+json">\s*<script>/i;
  if (regexOpen.test(content)) {
    content = content.replace(regexOpen, '<script>');
    console.log('Fixed opening nested script tag using regex.');
  } else {
    console.log('Could not find nested opening script tag.');
  }
}

// Replace the nested closing scripts precisely
const targetClose = `</script>\r\n</script>`;
const targetCloseLf = `</script>\n</script>`;

if (content.includes(targetClose)) {
  content = content.replace(targetClose, '</script>');
  console.log('Fixed closing nested script tag (CRLF).');
} else if (content.includes(targetCloseLf)) {
  content = content.replace(targetCloseLf, '</script>');
  console.log('Fixed closing nested script tag (LF).');
} else {
  const regexClose = /<\/script>\s*<\/script>/i;
  if (regexClose.test(content)) {
    content = content.replace(regexClose, '</script>');
    console.log('Fixed closing nested script tag using regex.');
  } else {
    console.log('Could not find nested closing script tag.');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating insights/index.html.');
