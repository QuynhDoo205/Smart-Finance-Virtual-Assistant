const replace = require('replace-in-file');

const optionsWhite = {
  files: 'src/pages/**/*.tsx',
  from: /(?<!bg-[a-zA-Z]+-[4-9]00\s|hover:)text-white(?!.*bg-[a-zA-Z]+-[4-9]00)/g,
  to: 'text-theme-text-primary',
};

const optionsGray = {
  files: 'src/pages/**/*.tsx',
  from: /text-gray-(300|400|500)/g,
  to: 'text-theme-text-muted',
};

// Also apply to MainLayout and other components
const optionsWhite2 = {
  files: 'src/components/**/*.tsx',
  from: /(?<!bg-[a-zA-Z]+-[4-9]00\s|hover:)text-white(?!.*bg-[a-zA-Z]+-[4-9]00)/g,
  to: 'text-theme-text-primary',
};

const optionsGray2 = {
  files: 'src/components/**/*.tsx',
  from: /text-gray-(300|400|500)/g,
  to: 'text-theme-text-muted',
};


async function run() {
  try {
    const r1 = await replace(optionsWhite);
    console.log('Modified files for text-white:', r1.filter(r => r.hasChanged).map(r => r.file));
    
    const r2 = await replace(optionsGray);
    console.log('Modified files for text-gray:', r2.filter(r => r.hasChanged).map(r => r.file));

    const r3 = await replace(optionsWhite2);
    console.log('Modified files for text-white in components:', r3.filter(r => r.hasChanged).map(r => r.file));

    const r4 = await replace(optionsGray2);
    console.log('Modified files for text-gray in components:', r4.filter(r => r.hasChanged).map(r => r.file));
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

run();
