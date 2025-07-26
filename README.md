<h1 align="center">attp-generator</h1>

[![NPM Version](https://img.shields.io/npm/v/attp-generator.svg)](https://www.npmjs.com/package/attp-generator)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Terror-Machine/attp-generator/blob/master/LICENSE)

The **ATTP Generator** is a Node.js application that generates animated text-based images (or GIFs) with various effects, including blinking, gradient, and walking text effects. It also supports emoji rendering and custom font styling.

## Features

- TTP Generate text.
- Generate animated text effects:
  - **Blinking text**
  - **Gradient text**
  - **Walking text** (text moves across the screen)
- Supports emojis from a local cache or the emoji library.
- Custom font and color options.
- GIF and WebP output formats.

## Installation

### Prerequisites

This library requires the following dependencies:

1. **Node.js**

   * Ensure **Node.js** (version 12 or above) is installed. You can install it using a package manager like `apt`, `brew`, or `nvm`. For example, on **Ubuntu**:

     ```bash
     sudo apt-get update
     sudo apt-get install nodejs
     sudo apt-get install npm
     ```

2. **Canvas** - For rendering images and text

   * Canvas requires native dependencies such as Cairo, Pango, etc.
   * On **Linux** systems, you need to install the following dependencies:

     * **Debian/Ubuntu**:

       ```bash
       sudo apt-get update
       sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
       ```
     * **Fedora**:

       ```bash
       sudo dnf install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel
       ```

3. **ImageMagick** - Used for image conversion and creating GIFs.

   * On **Ubuntu/Debian**:

     ```bash
     sudo apt-get update
     sudo apt-get install imagemagick
     ```
   * On **Fedora**:

     ```bash
     sudo dnf install ImageMagick
     ```

4. **gif2webp** - Used to convert GIF files into WebP format.

   * On **Ubuntu/Debian**:

     ```bash
     sudo apt-get update
     sudo apt-get install webp
     ```
   * On **Fedora**:

     ```bash
     sudo dnf install webp
     ```

Once you have installed the required dependencies, you can proceed with installing the `attp-generator` package via npm and using it in your Node.js project.

### Installation Steps

```bash
npm install attp-generator
```

#### Ensure ImageMagick and gif2webp are installed and accessible from your terminal.

## Output

The methods provided in this package always return a **buffer** containing the generated image or animation data. The buffer can be used to save the image or animation to a file, send it over a network, or process it further. Here's what each method produces:

* **TTP Generator**: Produces an image in **PNG** format as a buffer. This buffer can be saved to a file or used in any way you need.
* **Blinking Animation**: Produces an animated WebP file as a buffer (`output.webp`).
* **Gradient Animation**: Produces an animated WebP file as a buffer (`output.webp`).
* **Walking Animation**: Produces an animated WebP file as a buffer (`output.webp`).

You can handle the buffer returned by these methods directly, for example, by writing it to a file like so:

## Usage

### 1. Generating Text-to-Picture (TTP)

Use `generateTTP` to create a static image with text and custom styling.

```javascript
const { generateTTP } = require("attp-generator");

async function testTTP() {
  const result = await generateTTP('Use generateTTP to create a static image with text and custom styling. 🤬🫠', { color: '#FF0000' }, 'Bangers');
  await fs.writeFile('output_ttp.png', result);
}

(async () => {
  await testTTP();
})();
```

##### Parameters

* `text` (String): The text to be displayed.
* `style` (Object): Optional styles for the text. It supports:

  * `color`: The color of the text. Default is `#FFFFFF` (white).
* `font` (String): The font to use. Default is `'SpicyRice'`.

### 2. Generating Animated Effects

#### a. Blink Animation

Use `attpBlinkGenerate` to create a Blink Animated Effects with text and custom styling.

```javascript
const { attpBlinkGenerate } = require("attp-generator");

async function testBlinkATTP() {
  const result = await attpBlinkGenerate('Use attpBlinkGenerate to create a Blink Animated Effects with text and custom styling. 🤬🫠', 'Bangers');
  await fs.writeFile('output_blink.webp', result);
}

(async () => {
  await testBlinkATTP();
})();
```

##### Parameters

* `text` (String): The text to display.
* `font` (String): The font to use. Default is `'SpicyRice'`.

#### b. Gradient Animation

Use `attpGradientGenerate` to create a Gradient Animated Effects with text and custom styling.

```javascript
const { attpGradientGenerate } = require("attp-generator");

async function testGradientATTP() {
  const result = await attpGradientGenerate('Use attpGradientGenerate to create a Gradient Animated Effects with text and custom styling. 🤬🫠', 'SpicyRice', ['#FF0000', '#00FF00', '#0000FF']);
  await fs.writeFile('output_gradient.webp', result);
}

(async () => {
  await testGradientATTP();
})();
```

##### Parameters

* `text` (String): The text to display.
* `font` (String): The font to use. Default is `'SpicyRice'`.
* `colors` (Array of Strings): Optional array of colors for the gradient or walking animation. Default colors are used if not provided.

#### c. Walking Animation

Use `attpWalkingGenerate` to create a Walking Animated Effects with text and custom styling.

```javascript
const { attpWalkingGenerate } = require("attp-generator");

async function testWalkingATTP() {
  const result = await attpWalkingGenerate('Use attpWalkingGenerate to create a Walking Animated Effects with text and custom styling. 🤬🫠', 'SpicyRice');
  await fs.writeFile('output_walking.webp', result.data);
}

(async () => {
  await testWalkingATTP();
})();
```

##### Parameters

* `text` (String): The text to display.
* `font` (String): The font to use. Default is `'SpicyRice'`.

## Cleaning Up

The generated files are stored temporarily in the directory specified by `global.tmpDir`, which defaults to `./sampah`. The directory is cleaned up after each operation.

## Troubleshooting

* Ensure **ImageMagick** and **gif2webp** are installed correctly and available in your system's `PATH`.
* If the library can't find your emojis, check the cache file located at `./emoji/emoji-apple-image.json`. You may need to update or regenerate the emoji cache.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# Example

you can check [here](https://github.com/Terror-Machine/fnbots) to see my project with attp productions.