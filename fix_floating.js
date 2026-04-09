import fs from 'fs';
const content = fs.readFileSync('frontend/src/app/layout.tsx', 'utf-8');
console.log(content.includes('FloatingSupport'));
