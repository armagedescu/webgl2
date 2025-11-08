/*
 * gifuct-js - Browser Bundle
 * https://github.com/matt-way/gifuct-js
 * Authors: Matt Way & Nick Drewe
 * Copyright (c) 2015 Matt Way
 * Licensed under the MIT License
 *
 * This is a bundled browser-compatible version combining:
 * - gifuct-js
 * - js-binary-schema-parser (dependency)
 */

// ===== js-binary-schema-parser =====
// Simplified inline version for GIF parsing only

const buildStream = function(uint8Data) {
  return {
    data: uint8Data,
    pos: 0
  };
};

const parse = function(stream, schema, parent) {
  if (typeof schema === 'function') {
    return schema(stream, parent);
  }

  const result = {};
  const keys = Object.keys(schema);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = schema[key];

    if (typeof value === 'function') {
      result[key] = value(stream, result, parent);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = parse(stream, value, result);
    } else {
      result[key] = value;
    }
  }

  return result;
};

const readByte = function() {
  return function(stream) {
    return stream.data[stream.pos++];
  };
};

const readBytes = function(length) {
  return function(stream) {
    const result = stream.data.slice(stream.pos, stream.pos + length);
    stream.pos += length;
    return result;
  };
};

const readString = function(length) {
  return function(stream) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(stream.data[stream.pos++]);
    }
    return result;
  };
};

const readUnsigned = function(littleEndian) {
  return function(stream) {
    const bytes = [
      stream.data[stream.pos++],
      stream.data[stream.pos++]
    ];
    return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1];
  };
};

const readArray = function(length, elementParser) {
  return function(stream, result, parent) {
    const arr = [];
    const len = typeof length === 'function' ? length(stream, result, parent) : length;
    for (let i = 0; i < len; i++) {
      arr.push(elementParser(stream, result, parent));
    }
    return arr;
  };
};

const subBitsTotal = function(bits, startIndex, length) {
  let result = 0;
  for (let i = 0; i < length; i++) {
    result = result << 1;
    if (bits[startIndex + i]) result = result | 1;
  }
  return result;
};

const readBits = function(schema) {
  return function(stream) {
    const byte = readByte()(stream);
    const bits = new Array(8);
    for (let i = 0; i < 8; i++) {
      bits[7 - i] = !!(byte & (1 << i));
    }

    const result = {};
    const keys = Object.keys(schema);
    let currIndex = 0;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const length = schema[key];
      if (typeof length === 'number') {
        result[key] = subBitsTotal(bits, currIndex, length);
        currIndex += length;
      }
    }
    return result;
  };
};

const conditional = function(condition, schema) {
  return function(stream, result, parent) {
    if (condition(stream, result, parent)) {
      return parse(stream, schema, result);
    }
    return null;
  };
};

const loop = function(shouldContinue, schema) {
  return function(stream, result, parent) {
    const arr = [];
    while (shouldContinue(stream, result, parent)) {
      arr.push(parse(stream, schema, parent));
    }
    return arr;
  };
};

// GIF Schema
const gifSchema = {
  header: {
    signature: readString(3),
    version: readString(3)
  },
  lsd: function(stream) {
    const lsd = parse(stream, {
      width: readUnsigned(true),
      height: readUnsigned(true),
      gct: readBits({
        exists: 1,
        resolution: 3,
        sort: 1,
        size: 3
      }),
      backgroundColorIndex: readByte(),
      pixelAspectRatio: readByte()
    });
    lsd.gct.colors = 2 << lsd.gct.size;
    return lsd;
  },
  gct: conditional(
    (stream, result) => result.lsd.gct.exists,
    readArray(
      (stream, result) => result.lsd.gct.colors,
      readBytes(3)
    )
  ),
  frames: loop(
    (stream) => {
      const pos = stream.pos;
      const nextByte = stream.data[pos];
      return nextByte !== 0x3B && pos < stream.data.length;
    },
    function(stream) {
      const frame = {};

      // Read extensions and image
      while (true) {
        const sentinel = readByte()(stream);

        if (sentinel === 0x21) {
          // Extension block
          const label = readByte()(stream);

          if (label === 0xF9) {
            // Graphics Control Extension
            frame.gce = parse(stream, {
              blockSize: readByte(),
              extras: readBits({
                reserved: 3,
                disposal: 3,
                userInput: 1,
                transparentColorGiven: 1
              }),
              delay: readUnsigned(true),
              transparentColorIndex: readByte(),
              terminator: readByte()
            });
          } else {
            // Skip other extension blocks
            let blockSize = readByte()(stream);
            while (blockSize !== 0) {
              stream.pos += blockSize;
              blockSize = readByte()(stream);
            }
          }
        } else if (sentinel === 0x2C) {
          // Image descriptor follows
          break;
        } else {
          // Unknown sentinel, return empty frame
          return frame;
        }
      }

      // Now parse the image descriptor
        frame.image = parse(stream, {
          descriptor: function(stream) {
            const descriptor = parse(stream, {
              left: readUnsigned(true),
              top: readUnsigned(true),
              width: readUnsigned(true),
              height: readUnsigned(true),
              lct: readBits({
                exists: 1,
                interlaced: 1,
                sort: 1,
                reserved: 2,
                size: 3
              })
            });
            descriptor.lct.colors = 2 << descriptor.lct.size;
            return descriptor;
          },
          lct: conditional(
            (stream, result) => result.descriptor.lct.exists,
            readArray(
              (stream, result) => result.descriptor.lct.colors,
              readBytes(3)
            )
          ),
          data: function(stream) {
            const minCodeSize = readByte()(stream);
            const blocks = loop(
              (stream) => {
                const blockSize = stream.data[stream.pos];
                return blockSize !== 0;
              },
              function(stream) {
                const blockSize = readByte()(stream);
                return readBytes(blockSize)(stream);
              }
            )(stream);
            const terminator = readByte()(stream);

            const flatBlocks = [];
            for (let i = 0; i < blocks.length; i++) {
              for (let j = 0; j < blocks[i].length; j++) {
                flatBlocks.push(blocks[i][j]);
              }
            }

            return {
              minCodeSize: minCodeSize,
              blocks: flatBlocks
            };
          }
        });

      return frame;
    }
  )
};

// ===== LZW Decompression =====
const lzw = function(minCodeSize, data, pixelCount) {
  const MAX_STACK_SIZE = 4096;
  const nullCode = -1;
  const npix = pixelCount;
  let available, clear, code_mask, code_size, end_of_information, in_code, old_code;
  let bits, code, datum, first, top, bi, pi;

  const dstPixels = new Array(pixelCount);
  const prefix = new Array(MAX_STACK_SIZE);
  const suffix = new Array(MAX_STACK_SIZE);
  const pixelStack = new Array(MAX_STACK_SIZE + 1);

  const data_size = minCodeSize;
  clear = 1 << data_size;
  end_of_information = clear + 1;
  available = clear + 2;
  old_code = nullCode;
  code_size = data_size + 1;
  code_mask = (1 << code_size) - 1;

  for (code = 0; code < clear; code++) {
    prefix[code] = 0;
    suffix[code] = code;
  }

  datum = bits = first = top = pi = bi = 0;

  for (let i = 0; i < npix;) {
    if (top === 0) {
      if (bits < code_size) {
        datum += data[bi] << bits;
        bits += 8;
        bi++;
        continue;
      }

      code = datum & code_mask;
      datum >>= code_size;
      bits -= code_size;

      if (code > available || code == end_of_information) {
        break;
      }

      if (code == clear) {
        code_size = data_size + 1;
        code_mask = (1 << code_size) - 1;
        available = clear + 2;
        old_code = nullCode;
        continue;
      }

      if (old_code == nullCode) {
        pixelStack[top++] = suffix[code];
        old_code = code;
        first = code;
        continue;
      }

      in_code = code;

      if (code == available) {
        pixelStack[top++] = first;
        code = old_code;
      }

      while (code > clear) {
        pixelStack[top++] = suffix[code];
        code = prefix[code];
      }

      first = suffix[code] & 0xff;
      pixelStack[top++] = first;

      if (available < MAX_STACK_SIZE) {
        prefix[available] = old_code;
        suffix[available] = first;
        available++;

        if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
          code_size++;
          code_mask += available;
        }
      }

      old_code = in_code;
    }

    top--;
    dstPixels[pi++] = pixelStack[top];
    i++;
  }

  for (let i = pi; i < npix; i++) {
    dstPixels[i] = 0;
  }

  return dstPixels;
};

// ===== Deinterlace =====
const deinterlace = function(pixels, width) {
  const newPixels = new Array(pixels.length);
  const rows = pixels.length / width;

  const cpRow = function(toRow, fromRow) {
    const fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
    newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
  };

  const offsets = [0, 4, 2, 1];
  const steps = [8, 8, 4, 2];
  let fromRow = 0;

  for (let pass = 0; pass < 4; pass++) {
    for (let toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
      cpRow(toRow, fromRow);
      fromRow++;
    }
  }

  return newPixels;
};

// ===== gifuct-js Main Functions =====
export const parseGIF = function(arrayBuffer) {
  const byteData = new Uint8Array(arrayBuffer);
  return parse(buildStream(byteData), gifSchema);
};

const generatePatch = function(image) {
  const totalPixels = image.pixels.length;
  const patchData = new Uint8ClampedArray(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    const pos = i * 4;
    const colorIndex = image.pixels[i];
    const color = image.colorTable[colorIndex] || [0, 0, 0];
    patchData[pos] = color[0];
    patchData[pos + 1] = color[1];
    patchData[pos + 2] = color[2];
    patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0;
  }

  return patchData;
};

export const decompressFrame = function(frame, gct, buildImagePatch) {
  if (!frame.image) {
    console.warn('gif frame does not have associated image.');
    return;
  }

  const image = frame.image;
  const totalPixels = image.descriptor.width * image.descriptor.height;
  console.log('Frame decompression:', {
    width: image.descriptor.width,
    height: image.descriptor.height,
    totalPixels: totalPixels,
    minCodeSize: image.data.minCodeSize,
    blocksLength: image.data.blocks ? image.data.blocks.length : 0
  });
  let pixels = lzw(image.data.minCodeSize, image.data.blocks, totalPixels);

  if (image.descriptor.lct.interlaced) {
    pixels = deinterlace(pixels, image.descriptor.width);
  }

  const resultImage = {
    pixels: pixels,
    dims: {
      top: frame.image.descriptor.top,
      left: frame.image.descriptor.left,
      width: frame.image.descriptor.width,
      height: frame.image.descriptor.height
    }
  };

  if (image.descriptor.lct && image.descriptor.lct.exists) {
    resultImage.colorTable = image.lct;
  } else {
    resultImage.colorTable = gct;
  }

  if (frame.gce) {
    // GIF delay is in centiseconds (1/100th of a second), convert to milliseconds
    // But the value appears to be in 1/100th seconds, so multiply by 10 to get milliseconds
    resultImage.delay = (frame.gce.delay || 10) * 10;
    resultImage.disposalType = frame.gce.extras.disposal;

    if (frame.gce.extras.transparentColorGiven) {
      resultImage.transparentIndex = frame.gce.transparentColorIndex;
    }
  }

  if (buildImagePatch) {
    resultImage.patch = generatePatch(resultImage);
  }

  return resultImage;
};

export const decompressFrames = function(parsedGif, buildImagePatches) {
  return parsedGif.frames
    .filter(f => f.image)
    .map(f => decompressFrame(f, parsedGif.gct, buildImagePatches));
};
