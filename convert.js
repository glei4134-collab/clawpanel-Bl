import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';

const inputPath = 'C:/Users/17544/Desktop/魔改/v0.4.2/icon.jpeg';
const pngPath = 'C:/Users/17544/Desktop/魔改/v0.4.2/icon.png';
const icoPath = 'C:/Users/17544/Desktop/魔改/v0.4.2/icon.ico';

async function convert() {
  try {
    console.log('Reading and converting JPEG to PNG...');
    
    await sharp(inputPath)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngPath);
    
    console.log('Converting PNG to ICO...');
    const pngBuffer = fs.readFileSync(pngPath);
    const icoBuffer = await pngToIco(pngBuffer);
    fs.writeFileSync(icoPath, icoBuffer);
    
    console.log('ICO created successfully!');
    console.log('Output:', icoPath);
    
    // Clean up PNG
    fs.unlinkSync(pngPath);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

convert();
