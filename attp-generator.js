const util = require('util');
const path = require("path");
const fs = require("fs-extra");
const EmojiDbLib = require("emoji-db");
const spawn = require('child_process').spawn;
const emojiImageByBrandPromise = require("emoji-cache");
const exec = util.promisify(require('child_process').exec);
const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont(path.join(__dirname, './fonts/Bangers.ttf'), { family: 'Bangers' });
registerFont(path.join(__dirname, './fonts/SpicyRice.otf'), { family: 'SpicyRice' });
global.tmpDir = './sampah';

let emojiDb;
try {
  emojiDb = new EmojiDbLib({ useDefaultDb: true });
  if (!emojiDb || typeof emojiDb.searchFromText !== 'function') {
    throw new Error('Failed to initialize emoji database');
  }
} catch (error) {
  console.error('Error initializing emoji database:', error);
  throw error;
}

function parseTextToSegments(text, ctx, fontSize) {
  const segments = [];
  const emojiSize = fontSize;
  const emojiData = emojiDb.searchFromText({ input: text, fixCodePoints: true });
  let currentIndex = 0;
  const processPlainText = (plainText) => {
    if (!plainText) return;
    const parts = plainText.split(/(\s+)/);
    parts.forEach(part => {
      if (!part) return;
      if (/\s/.test(part)) {
        segments.push({
          type: 'whitespace',
          content: ' ',
          width: ctx.measureText(' ').width * part.length
        });
      } else {
        segments.push({
          type: 'text',
          content: part,
          width: ctx.measureText(part).width
        });
      }
    });
  };
  emojiData.forEach(emojiInfo => {
    if (emojiInfo.offset > currentIndex) {
      processPlainText(text.substring(currentIndex, emojiInfo.offset));
    }
    segments.push({
      type: 'emoji',
      content: emojiInfo.found,
      width: emojiSize,
    });
    currentIndex = emojiInfo.offset + emojiInfo.length;
  });
  if (currentIndex < text.length) {
    processPlainText(text.substring(currentIndex));
  }
  return segments;
};
function rebuildLinesFromSegments(segments, maxWidth) {
  const lines = [];
  if (segments.length === 0) return lines;
  let currentLine = [];
  let currentLineWidth = 0;
  segments.forEach(segment => {
    if (segment.width > maxWidth) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      lines.push([segment]);
      currentLine = [];
      currentLineWidth = 0;
      return;
    }
    if (currentLineWidth + segment.width > maxWidth) {
      lines.push(currentLine);
      currentLine = [];
      currentLineWidth = 0;
    }
    if (segment.type === 'whitespace' && currentLine.length === 0) {
      return;
    }
    currentLine.push(segment);
    currentLineWidth += segment.width;
  });
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
};
async function createBlinkFrame(color, index, text, dirPath, hasilRandomFonts) {
  const allEmojiImages = await emojiImageByBrandPromise;
  const emojiCache = allEmojiImages["apple"] || {};
  const framePath = path.join(dirPath, `frame${index}.png`);
  const canvasWidth = 512;
  const canvasHeight = 512;
  const padding = 40;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  let fontSize = 120;
  let finalLines = [];
  let lineHeight = 0;
  let finalFontSize = 0;
  const availableWidth = canvasWidth - padding * 2;
  while (fontSize > 10) {
    ctx.font = `bold ${fontSize}px ${hasilRandomFonts}`;
    const segments = parseTextToSegments(text, ctx, fontSize);
    const lines = rebuildLinesFromSegments(segments, availableWidth);
    let isTooWide = false;
    for (const line of lines) {
      const lineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
      if (lineWidth > availableWidth) {
        isTooWide = true;
        break;
      }
    }
    const currentLineHeight = fontSize * 1.2;
    const totalHeight = lines.length * currentLineHeight;
    if (totalHeight < canvasHeight - padding * 2 && !isTooWide) {
      finalLines = lines;
      lineHeight = currentLineHeight;
      finalFontSize = fontSize;
      break;
    }
    fontSize -= 4;
  }
  const totalTextBlockHeight = finalLines.length * lineHeight;
  const yStart = (canvasHeight - totalTextBlockHeight) / 2;
  ctx.textBaseline = 'top';
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i];
    const currentLineY = yStart + (i * lineHeight);
    const totalLineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
    let currentX = (canvasWidth - totalLineWidth) / 2;
    for (const segment of line) {
      ctx.font = `bold ${finalFontSize}px ${hasilRandomFonts}`;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = finalFontSize / 10;
      ctx.lineJoin = 'round';
      if (segment.type === 'text') {
        ctx.strokeText(segment.content, currentX, currentLineY);
        ctx.fillStyle = color;
        ctx.fillText(segment.content, currentX, currentLineY);
      } else if (segment.type === 'emoji' && emojiCache[segment.content]) {
        const emojiImg = await loadImage(Buffer.from(emojiCache[segment.content], 'base64'));
        const emojiY = currentLineY + (lineHeight - finalFontSize);
        ctx.drawImage(emojiImg, currentX, emojiY, finalFontSize, finalFontSize);
      }
      currentX += segment.width;
    }
  }
  const imageBuffer = canvas.toBuffer('image/png');
  await fs.promises.writeFile(framePath, imageBuffer);
};
async function createGradientFrame(frameIndex, totalFrames, text, dirPath, fileName, hasilRandomFonts, hasilRandomColors) {
  const allEmojiImages = await emojiImageByBrandPromise;
  const emojiCache = allEmojiImages["apple"] || {};
  const framePath = path.join(dirPath, fileName);
  const canvasWidth = 512;
  const canvasHeight = 512;
  const padding = 40;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  let fontSize = 120;
  let finalLines = [];
  let lineHeight = 0;
  let finalFontSize = 0;
  const availableWidth = canvasWidth - padding * 2;
  while (fontSize > 10) {
    ctx.font = `bold ${fontSize}px ${hasilRandomFonts}`;
    const segments = parseTextToSegments(text, ctx, fontSize);
    const lines = rebuildLinesFromSegments(segments, availableWidth);
    let isTooWide = false;
    for (const line of lines) {
      const lineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
      if (lineWidth > availableWidth) {
        isTooWide = true;
        break;
      }
    }
    const currentLineHeight = fontSize * 1.2;
    const totalHeight = lines.length * currentLineHeight;
    if (totalHeight < canvasHeight - padding * 2 && !isTooWide) {
      finalLines = lines;
      lineHeight = currentLineHeight;
      finalFontSize = fontSize;
      break;
    }
    fontSize -= 4;
  }
  const gradientWidth = canvasWidth * 2;
  const movementOffset = (frameIndex / totalFrames) * canvasWidth;
  const x0 = -canvasWidth + movementOffset;
  const y0 = 0;
  const x1 = gradientWidth - canvasWidth + movementOffset;
  const y1 = 0;
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  hasilRandomColors.forEach((color, i) => {
    gradient.addColorStop(i / (hasilRandomColors.length - 1), color);
  });
  hasilRandomColors.forEach((color, i) => {
    gradient.addColorStop(0.5 + (i / (hasilRandomColors.length - 1)), color);
  });
  ctx.fillStyle = gradient;
  const totalTextBlockHeight = finalLines.length * lineHeight;
  const yStart = (canvasHeight - totalTextBlockHeight) / 2;
  ctx.textBaseline = 'top';
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i];
    const currentLineY = yStart + (i * lineHeight);
    const totalLineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
    let currentX = (canvasWidth - totalLineWidth) / 2;
    for (const segment of line) {
      if (segment.type === 'text') {
        ctx.font = `bold ${finalFontSize}px ${hasilRandomFonts}`;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = finalFontSize / 10;
        ctx.lineJoin = 'round';
        ctx.strokeText(segment.content, currentX, currentLineY);
        ctx.fillText(segment.content, currentX, currentLineY);
      } else if (segment.type === 'emoji' && emojiCache[segment.content]) {
        const emojiImg = await loadImage(Buffer.from(emojiCache[segment.content], 'base64'));
        const emojiY = currentLineY + (lineHeight - finalFontSize);
        ctx.drawImage(emojiImg, currentX, emojiY, finalFontSize, finalFontSize);
      }
      currentX += segment.width;
    }
  }
  const imageBuffer = canvas.toBuffer('image/png');
  await fs.promises.writeFile(framePath, imageBuffer);
};
async function createWalkFrame(frameIndex, text, dirPath, hasilRandomFonts, colors) {
  const allEmojiImages = await emojiImageByBrandPromise;
  const emojiCache = allEmojiImages["apple"] || {};
  const framePath = path.join(dirPath, `frame${frameIndex}.png`);
  const canvasWidth = 512;
  const canvasHeight = 512;
  const padding = 40;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  let fontSize = 120;
  let finalLines = [];
  let lineHeight = 0;
  let finalFontSize = 0;
  const availableWidth = canvasWidth - padding * 2;
  while (fontSize > 10) {
    ctx.font = `bold ${fontSize}px ${hasilRandomFonts}`;
    const segments = parseTextToSegments(text, ctx, fontSize);
    const lines = rebuildLinesFromSegments(segments, availableWidth);
    let isTooWide = false;
    for (const line of lines) {
      const lineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
      if (lineWidth > availableWidth) {
        isTooWide = true;
        break;
      }
    }
    const currentLineHeight = fontSize * 1.2;
    const totalHeight = lines.length * currentLineHeight;
    if (totalHeight < canvasHeight - padding * 2 && !isTooWide) {
      finalLines = lines;
      lineHeight = currentLineHeight;
      finalFontSize = fontSize;
      break;
    }
    fontSize -= 4;
  }
  const totalTextBlockHeight = finalLines.length * lineHeight;
  const yStart = (canvasHeight - totalTextBlockHeight) / 2;
  ctx.textBaseline = 'top';
  let charIndex = 0;
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i];
    const currentLineY = yStart + (i * lineHeight);
    const totalLineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
    let currentX = (canvasWidth - totalLineWidth) / 2;
    for (const segment of line) {
      ctx.font = `bold ${finalFontSize}px ${hasilRandomFonts}`;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = finalFontSize / 10;
      ctx.lineJoin = 'round';
      if (segment.type === 'text') {
        let tempX = currentX;
        for (const char of segment.content) {
          const colorIndex = (charIndex + frameIndex) % colors.length;
          ctx.fillStyle = colors[colorIndex];
          ctx.strokeText(char, tempX, currentLineY);
          ctx.fillText(char, tempX, currentLineY);
          tempX += ctx.measureText(char).width;
          charIndex++;
        }
      } else if (segment.type === 'whitespace') {
        charIndex += segment.content.length;
      } else if (segment.type === 'emoji' && emojiCache[segment.content]) {
        const emojiImg = await loadImage(Buffer.from(emojiCache[segment.content], 'base64'));
        const emojiY = currentLineY + (lineHeight - finalFontSize);
        ctx.drawImage(emojiImg, currentX, emojiY, finalFontSize, finalFontSize);
      }
      currentX += segment.width;
    }
  }
  const imageBuffer = canvas.toBuffer('image/png');
  await fs.promises.writeFile(framePath, imageBuffer);
};
async function attpBlinkGenerate(text, hasilRandomFonts) {
  const tmpDir = await fs.promises.mkdtemp(path.join(global.tmpDir, 'attp-'));
  const framesDir = tmpDir;
  const gifPath = path.join(tmpDir, 'attp.gif');
  const webpPath = path.join(tmpDir, 'attp.webp');
  try {
    const colors = [
      "#26c4dc", "#792138",
      "#8b6990", "#f0b330",
      "#ae8774", "#5696ff",
      "#ff7b6b", "#57c9ff",
      "#243640", "#b6b327",
      "#c69fcc", "#54c265",
      "#6e257e", "#c1a03f",
      "#90a841", "#7acba5",
      "#8294ca", "#a62c71",
      "#ff8a8c", "#7e90a3",
      "#74676a"
    ];
    const framePromises = colors.map((color, i) => createBlinkFrame(color, i, text, framesDir, hasilRandomFonts));
    await Promise.all(framePromises);
    const convertCommand = `convert -delay 20 -loop 0 ${path.join(framesDir, 'frame*.png')} -scale 512x512 ${gifPath}`;
    await new Promise((resolve, reject) => {
      exec(convertCommand, (error, stdout, stderr) => {
        if (error) return reject(new Error(`Gagal menjalankan ImageMagick 'convert': ${error.message}`));
        if (stderr) console.warn(`[ATTP] ImageMagick stderr: ${stderr}`);
        resolve(stdout);
      });
    });
    await new Promise((resolve, reject) => {
      spawn('gif2webp', [gifPath, '-o', webpPath])
        .on('exit', code => {
          if (code === 0) resolve();
          else reject(new Error(`gif2webp keluar dengan kode ${code}`));
        })
        .on('error', reject);
    });
    const mediaData = await fs.promises.readFile(webpPath);
    return mediaData;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(e => console.error(`Gagal membersihkan ${tmpDir}`, e));
  }
};
async function attpGradientGenerate(text, hasilRandomFonts, hasilRandomColors) {
  const tmpDir = await fs.promises.mkdtemp(path.join(global.tmpDir, 'attp-gradient-'));
  const framesDir = tmpDir;
  const gifPath = path.join(tmpDir, 'attp.gif');
  const webpPath = path.join(tmpDir, 'attp.webp');
  try {
    const totalFrames = 60;
    const framePromises = [];
    for (let i = 0; i < totalFrames; i++) {
      const framePromise = createGradientFrame(i, totalFrames, text, framesDir, `frame${String(i).padStart(2, '0')}.png`, hasilRandomFonts, hasilRandomColors);
      framePromises.push(framePromise);
    }
    await Promise.all(framePromises);
    const convertCommand = `convert -delay 20 -loop 0 ${path.join(framesDir, 'frame*.png')} -scale 512x512 ${gifPath}`;
    await new Promise((resolve, reject) => {
      exec(convertCommand, (error, stdout, stderr) => {
        if (error) return reject(new Error(`Gagal menjalankan ImageMagick 'convert': ${error.message}`));
        if (stderr) console.warn(`[ATTP Gradien] ImageMagick stderr: ${stderr}`);
        resolve(stdout);
      });
    });
    await new Promise((resolve, reject) => {
      spawn('gif2webp', [gifPath, '-o', webpPath])
        .on('exit', code => {
          if (code === 0) resolve();
          else reject(new Error(`gif2webp keluar dengan kode ${code}`));
        })
        .on('error', reject);
    });
    const mediaData = await fs.promises.readFile(webpPath);
    return mediaData;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(e => console.error(`Gagal membersihkan ${tmpDir}`, e));
  }
};
async function attpWalkingGenerate(text, hasilRandomFonts) {
  const tmpDir = await fs.promises.mkdtemp(path.join(global.tmpDir, 'attp-'));
  const framesDir = tmpDir;
  const gifPath = path.join(tmpDir, 'attp.gif');
  const webpPath = path.join(tmpDir, 'attp.webp');
  try {
    const colors = [
      "#26c4dc", "#792138",
      "#8b6990", "#f0b330",
      "#ae8774", "#5696ff",
      "#ff7b6b", "#57c9ff",
      "#243640", "#b6b327",
      "#c69fcc", "#54c265",
      "#6e257e", "#c1a03f",
      "#90a841", "#7acba5",
      "#8294ca", "#a62c71",
      "#ff8a8c", "#7e90a3",
      "#74676a"
    ];
    const framePromises = colors.map((_, i) => 
      createWalkFrame(i, text, framesDir, hasilRandomFonts, colors)
    );
    await Promise.all(framePromises);
    const convertCommand = `convert -delay 10 -loop 0 ${path.join(framesDir, 'frame*.png')} -scale 512x512 ${gifPath}`;
    await new Promise((resolve, reject) => {
      exec(convertCommand, (error, stdout, stderr) => {
        if (error) return reject(new Error(`Gagal menjalankan ImageMagick 'convert': ${error.message}`));
        if (stderr) console.warn(`[ATTP] ImageMagick stderr: ${stderr}`);
        resolve(stdout);
      });
    });
    await new Promise((resolve, reject) => {
      spawn('gif2webp', [gifPath, '-o', webpPath])
        .on('exit', code => {
          if (code === 0) resolve();
          else reject(new Error(`gif2webp keluar dengan kode ${code}`));
        })
        .on('error', reject);
    });
    const mediaData = await fs.promises.readFile(webpPath);
    return mediaData;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(e => console.error(`Gagal membersihkan ${tmpDir}`, e));
  }
};
async function generateTTP(text, style, hasilRandomFonts) {
  const allEmojiImages = await emojiImageByBrandPromise;
  const emojiCache = allEmojiImages["apple"] || {};
  const canvasSize = 500;
  const padding = 50;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  const maxWidth = canvasSize - padding * 2;
  const maxHeight = canvasSize - padding * 2;
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  let fontSize = 100;
  let finalLines = [];
  let lineHeight = 0;
  let finalFontSize = 0;
  while (fontSize > 10) {
    ctx.font = `bold ${fontSize}px ${hasilRandomFonts}`;
    const segments = parseTextToSegments(text, ctx, fontSize);
    const lines = rebuildLinesFromSegments(segments, maxWidth);
    let isTooWide = false;
    for (const line of lines) {
      const lineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
      if (lineWidth > maxWidth) {
        isTooWide = true;
        break;
      }
    }
    const currentLineHeight = fontSize + 10;
    const totalHeight = lines.length * currentLineHeight;
    if (totalHeight <= maxHeight && !isTooWide) {
      finalLines = lines;
      lineHeight = currentLineHeight;
      finalFontSize = fontSize;
      break;
    }
    fontSize -= 2;
  }
  ctx.font = `bold ${finalFontSize}px ${hasilRandomFonts}`;
  const totalTextBlockHeight = finalLines.length * lineHeight;
  const startY = (canvasSize - totalTextBlockHeight) / 2 + finalFontSize;
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i];
    const currentLineY = startY + (i * lineHeight);
    const totalLineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
    let currentX = (canvasSize - totalLineWidth) / 2;
    for (const segment of line) {
      if (segment.type === 'text') {
        ctx.fillStyle = style.color || '#ffffff';
        ctx.fillText(segment.content, currentX, currentLineY);
      } else if (segment.type === 'emoji' && emojiCache[segment.content]) {
        try {
          const emojiImg = await loadImage(Buffer.from(emojiCache[segment.content], 'base64'));
          const emojiY = currentLineY - (finalFontSize * 0.85);
          ctx.drawImage(emojiImg, currentX, emojiY, finalFontSize, finalFontSize);
        } catch (e) {
          console.error("Gagal menggambar emoji:", segment.content, e);
        }
      }
      currentX += segment.width;
    }
  }
  return canvas.toBuffer('image/png');
};

module.exports = {
  generateTTP,
  attpBlinkGenerate,
  attpGradientGenerate,
  attpWalkingGenerate
};