// Function that encodes text to bits, and adds 0 to the start if the string is less than 8 characters.
export function textToBits(text) {
  // Encodes to UTF-8 bytes
  const bytes = new TextEncoder().encode(text);
  let bits = "";
  // Convert each byte to binary format, padded to 8 bits
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  return bits;
}

// Function that decodes bits to text, 8 bits at a time to a byte, and the byte to a character, until it hits 4 null bytes in a row, which indicates the end of the message.
export function bitsToText(bits) {
  let text = "";
  // Convert every 8 bits to a byte, and then to a character
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    // Parse the current 8 bits to a byte. we convert the byte to a character and append it to the text string.
    const byte = parseInt(bits.slice(i, i + 8), 2);
    if (byte === 0) break;
    // If the byte is 0, we stop decoding, as it indicates the end of the message. 
    text += String.fromCharCode(byte);
  }
  return text;
}

// Function that builds an array of indices for the R, G, B channels of the image data, and shuffles them based on the password if provided.
function buildIndices(dataLength, password) {
  const indices = [];
  // Only use R, G, B channels (skip A), so we take every 4th byte and add the next two for G and B
  for (let i = 0; i < dataLength; i += 4) {
    indices.push(i, i + 1, i + 2); // R G B, skip A
  }
  // Shuffle indices based on password using a simple LCG, [not cryptographically secure], to add a layer of obfuscation
  if (password) {
    let seed = [...password].reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let i = indices.length - 1; i > 0; i--) {
      // Simple LCG for shuffling, [not cryptographically secure]
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      // Get a pseudo-random index based on the seed
      const j = Math.abs(seed) % (i + 1);
      // Swap indices[i] and indices[j]
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }
  return indices;
}

// Function that hides a message in the image data by modifying the least significant bit of the R, G, B channels, and adds 4 null bytes at the end of the message to indicate the end of the message.
export function hideMessage(imageData, message, password) {
  // Create a copy of the image data to modify, so we don't alter the original data directly
  const data = new Uint8ClampedArray(imageData.data);
  // Add 4 null bytes at the end of the message to indicate the end of the message
  const fullMsg = message + "\x00\x00\x00\x00";
  // Convert the full message to bits, and build the indices for the R, G, B channels based on the password
  const bits = textToBits(fullMsg);
  const indices = buildIndices(data.length, password);

  // Check if the message can fit in the image, if not throw an error
  if (bits.length > indices.length) throw new Error("Message too large for image");
  // Modify the least significant bit of the R, G, B channels based on the bits of the message
  for (let i = 0; i < bits.length; i++) {
    // Clear the least significant bit of the current channel, and set it to the corresponding bit of the message
    data[indices[i]] = (data[indices[i]] & 0xfe) | parseInt(bits[i]);
  }
  return data;
}

// Function that extracts a message from the image data by reading the least significant bit of the R, G, B channels, and stops when it hits 4 null bytes in a row, which indicates the end of the message.
export function extractMessage(imageData, password) {
  // Get the image data and build the indices for the R, G, B channels based on the password
  const data = imageData.data;
  const indices = buildIndices(data.length, password);

  let bits = "";
  // Read the least significant bit of the R, G, B channels based on the indices, and stop when we hit 4 null bytes (32 bits of 0) in a row, which indicates the end of the message
  for (let i = 0; i < indices.length; i++) {
    // Get the least significant bit of the current channel and append it to the bits string
    bits += (data[indices[i]] & 1).toString();
    // Check if the last 32 bits are all 0, which indicates the end of the message, and if so, decode the bits to text and return it
    if (bits.length % 8 === 0 && bits.length >= 32) {
      if (bits.slice(-32) === "0".repeat(32)) return bitsToText(bits.slice(0, -32));
    }
  }
  return bitsToText(bits);
}

// Function that calculates the maximum number of characters that can be hidden in an image based on its width and height, considering that each pixel can hide 3 bits (R, G, B).
export function getCapacity(width, height) {
  return Math.floor((width * height * 3) / 8);
}