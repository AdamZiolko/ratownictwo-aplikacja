const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const outputFile = path.join(__dirname, '../soundList.ts');

function toLabel(filename) {
  const name = path.basename(filename, '.mp3');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateSoundList() {
  const files = fs.readdirSync(assetsDir).filter(file => file.endsWith('.mp3'));

  const entries = files.map(file => {
    const label = toLabel(file);
    return `  { name: '${label}', file: require('./assets/${file}') },`;
  });

  const content = `const sounds = [
${entries.join('\n')}
];

export default sounds;
`;

  fs.writeFileSync(outputFile, content);
  console.log(`✅ Plik soundList.ts został wygenerowany z ${files.length} plikami.`);
}

generateSoundList();
