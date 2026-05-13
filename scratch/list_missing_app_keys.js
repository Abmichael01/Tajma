import fs from 'fs';
import path from 'path';

const locales = ['en', 'fr', 'ha'];
const projectPath = 'app/src/i18n/locales';

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

const baseDir = path.resolve('/home/urkelcodes/Desktop/MyProjects/Clients/tajma', projectPath);
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
  console.log(`\nMissing keys in app/${locale}:`);
  console.log(JSON.stringify(missingKeys, null, 2));
});
