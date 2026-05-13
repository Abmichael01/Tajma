import fs from 'fs';
import path from 'path';

const searchPaths = [
  'frontend/src',
  'app/src'
];

const translationFunctions = ['t(', 'tCommon(', 'navT(', 'commonT(', 'tAuth(', 'tSetup(', 'tSettings(', 'tUser(', 'tCreateAd(', 'tBusiness('];

function isTranslated(line) {
  return translationFunctions.some(fn => line.includes(fn));
}

function findUntranslatedStrings(dir) {
  const files = getAllFiles(dir, ['.tsx', '.jsx']);
  const results = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Basic check for text between tags
      const tagMatch = line.match(/>([^<{]+)</);
      if (tagMatch) {
        const text = tagMatch[1].trim();
        if (text && text.length > 2 && !isTranslated(line)) {
            // Ignore some common things that aren't usually translated
            if (!/^[0-9\s.,%+-]+$/.test(text) && !text.includes('{') && !text.includes('}')) {
                results.push({ file, line: index + 1, text, type: 'Tag Content' });
            }
        }
      }

      // Check for common props
      const propMatches = line.matchAll(/(label|placeholder|title|description|subtitle|heading)="([^"]+)"/g);
      for (const match of propMatches) {
        const text = match[2].trim();
        if (text && !isTranslated(line)) {
            results.push({ file, line: index + 1, text, type: `Prop: ${match[1]}` });
        }
      }
    });
  }
  return results;
}

function getAllFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file, extensions));
    } else {
      if (extensions.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const allResults = {};
searchPaths.forEach(searchPath => {
    const fullPath = path.resolve('/home/urkelcodes/Desktop/MyProjects/Clients/tajma', searchPath);
    if (fs.existsSync(fullPath)) {
        allResults[searchPath] = findUntranslatedStrings(fullPath);
    }
});

console.log(JSON.stringify(allResults, null, 2));
