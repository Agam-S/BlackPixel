# BlackPixel

A browser-based **LSB steganography** tool. Hide secret text inside any PNG image by flipping the least significant bit of each pixel's colour channels, changes are imperceptible to the human eye. Extract hidden messages with the same password used to encode them.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [How it works](#how-it-works)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Usage](#usage)
6. [License](#license)

---

## What it does

BlackPixel has two modes, selectable via tabs:

| Mode | Description |
|---|---|
| **Hide** | Encodes a secret text message into a PNG image and lets you download the result |
| **Extract** | Reads a previously encoded image and recovers the hidden message |

A **payload capacity bar** shows how many bytes the loaded image can carry and how much of that your message consumes. After encoding, a **pixel diff view** renders a magnified 32×32 sample of the image, highlighting every modified pixel in green so you can see exactly how subtle the changes are.

---

## How it works

### LSB Steganography

Each pixel in a PNG image has four channels: Red, Green, Blue, and Alpha. BlackPixel uses only the R, G, and B channels. For each channel byte, only the **least significant bit (LSB)** is overwritten with one bit of the message. A 1-bit change per channel shifts a colour value by at most ±1 out of 255 , visually indistinguishable.

**Encoding steps:**

1. The secret message is UTF-8 encoded and converted to a binary bit string.
2. Four null bytes (`\x00\x00\x00\x00`) are appended as an end-of-message sentinel.
3. A flat list of every R, G, B byte index in the image is built (alpha is skipped).
4. If a password is provided, those indices are shuffled using a seeded LCG (Linear Congruential Generator), scattering bits pseudo-randomly across the image rather than writing them sequentially from the top-left.
5. Each bit of the message overwrites the LSB of the corresponding byte at the shuffled index: `byte = (byte & 0xFE) | bit`.
6. The modified pixel data is written back to a `<canvas>` and exported as a lossless PNG.

**Decoding steps:**

1. The same index list is rebuilt and shuffled with the same password seed.
2. The LSB of each byte is read in order, assembling a bit string.
3. Every 8 bits are converted to a byte. Decoding stops when 32 consecutive zero bits (the sentinel) are encountered.
4. The byte sequence is decoded from UTF-8 back to a string.

> **Security note:** The LCG shuffle is a lightweight obfuscation layer, not cryptographic encryption. Without a password, bits are read sequentially and the message can be recovered by anyone. For sensitive data, encrypt your message before hiding it.

### Capacity

Maximum bytes an image can carry = `⌊(width × height × 3) / 8⌋`

---

## Tech Stack

| Technology | Role |
|---|---|
| **React 19** | UI components and state management |
| **Vite 7** | Development server and production bundler |

No image-processing libraries are used , all steganography runs in pure JavaScript against raw `ImageData`.

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone the repo
git clone https://github.com/Agam-S/BlackPixel.git
cd BlackPixel

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Usage

### Hiding a message | Hide Data Tab

1. Drop a PNG (or any bitmap) onto the upload zone, or click to browse.
2. The **Payload Capacity** bar shows how many bytes the image can hold.
3. Type your secret message, and optionally set a password.
4. Click **Encode & Inject**. A side-by-side preview of the original and stego output appears.
5. Expand **Pixel Diff View** to see a magnified 32×32 sample , green cells mark modified pixels.
6. Click **Download Stego PNG** to save the output.

### Extracting a message | Extract Data Tab

1. Drop the stego PNG onto the upload zone.
2. Switch to the **Extract** tab.
3. Enter the password that was used during encoding (leave blank if none was set).
4. Click **Decode & Extract** to reveal the hidden message.

> Always use **PNG** output. Saving as JPEG will destroy the LSB data because JPEG uses lossy compression.

---

## License

This project is licensed under the **GNU General Public License v3.0**.  
See [LICENSE.txt](LICENSE.txt) for the full license text.
