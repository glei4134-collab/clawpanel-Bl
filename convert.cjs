const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/17544/Desktop/魔改/v0.4.2/icon.jpeg';
const pngPath = 'C:/Users/17544/Desktop/魔改/v0.4.2/icon.png';
const icoPath = 'C:/Users/17544/Desktop/魔改/v0.4.2/icon.ico';

async function convert() {
  try {
    console.log('Reading JPEG...');
    const image = await Jimp.read(inputPath);
    
    // Resize to 256x256 for good quality
    image.resize(256, 256);
    
    console.log('Saving as PNG...');
    await image.writeAsync(pngPath);
    
    console.log('Converting to ICO...');
    const pngBuffer = fs.readFileSync(pngPath);
    const icoBuffer = await pngToIco(pngBuffer);
    fs.writeFileSync(icoPath, icoBuffer);
    
    console.log('ICO created successfully!');
    
    // Clean up PNG
    fs.unlinkSync(pngPath);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

convert();
