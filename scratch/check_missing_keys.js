import fs from 'fs';
import path from 'path';

const locales = ['en', 'fr', 'ha'];
const projects = [
  { name: 'frontend', path: 'frontend/src/i18n/locales' },
  { name: 'app', path: 'app/src/i18n/locales' }
];

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

projects.forEach(project => {
  console.log(`\nChecking project: ${project.name}`);
  const baseDir = path.resolve('/home/urkelcodes/Desktop/MyProjects/Clients/tajma', project.path);
  
  const localeData = {};
  locales.forEach(locale => {
    const filePath = path.join(baseDir, `${locale}.json`);
    if (fs.existsSync(filePath)) {
      localeData[locale] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  });

  const enKeys = getKeys(localeData['en'] || {});
  
  locales.forEach(locale => {
    if (locale === 'en') return;
    const currentKeys = getKeys(localeData[locale] || {});
    const missingKeys = enKeys.filter(key => !currentKeys.includes(key));
    
    if (missingKeys.length > 0) {
      console.log(`Missing keys in ${locale}: ${missingKeys.length}`);
      // console.log(missingKeys.slice(0, 10));
    } else {
      console.log(`No missing keys in ${locale}`);
    }
  });
});
