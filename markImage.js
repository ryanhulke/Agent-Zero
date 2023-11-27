const fs = require('fs');
const sharp = require('sharp');
const Jimp = require('jimp');


async function createNumberedTag(number, color) {
    const image = new Jimp(50, 50, color);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    image.print(font, 0, 0, number.toString());
    return await image.getBufferAsync(Jimp.MIME_PNG);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
async function markImage(imageBuffer, elements) {
    let markedImage = sharp(imageBuffer);
    
    for (var i = 0; i < elements.length; i++) {
      // Create a numbered tag for each element
      const tagBuffer = await createNumberedTag(i+1, getRandomColor());
      // Overlay the tag on the element
      markedImage = markedImage.composite([
        { input: tagBuffer, left: Math.round(elements[i].x), top: Math.round(elements[i].y) },
        // Add more overlays as needed
      ]);
    }
    try {
      markedImage = await markedImage.toBuffer();
    } catch (e) {
      console.log("markedImage error: ", e);
    }
    return markedImage.toString('base64');
}

module.exports = { markImage };