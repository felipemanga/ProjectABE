/*
   Copyright (C) 2016 Ignacio Vina (@igvina)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// ArdBitmap: version 2.0.3

#ifndef ARDBITMAP_H
#define ARDBITMAP_H

//Uncomment NO_SPEED_HACK if speed is not important (reduce ~100 bytes)
//#define NO_SPEED_HACK

//Uncomment RESIZE_HACK for fast drawResized with resize >= 1.0
//#define RESIZE_HACK

#include <Arduino.h>

#define ALIGN_H_LEFT    0b00000000
#define ALIGN_H_RIGHT   0b00000001
#define ALIGN_H_CENTER  0b00000010
#define ALIGN_V_TOP     0b00000000
#define ALIGN_V_BOTTOM  0b00000100
#define ALIGN_V_CENTER  0b00001000
#define ALIGN_CENTER    0b00001010
#define ALIGN_NONE      0b00000000

#define MIRROR_NONE       0b00000000
#define MIRROR_HORIZONTAL 0b00000001
#define MIRROR_VERTICAL   0b00000010
#define MIRROR_HOR_VER    0b00000011

static const uint8_t BIT_SHIFT[8] = {
  0b00000001,
  0b00000010,
  0b00000100,
  0b00001000,
  0b00010000,
  0b00100000,
  0b01000000,
  0b10000000,
};

/*
static const uint8_t REVERSE_16[16] = { 0, 8,  4, 12,
                          2, 10, 6, 14 ,
                          1, 9,  5, 13,
                          3, 11, 7, 15 };

static const uint8_t REVERSE_256[256] = {
        0x00, 0x80, 0x40, 0xc0, 0x20, 0xa0, 0x60, 0xe0,
        0x10, 0x90, 0x50, 0xd0, 0x30, 0xb0, 0x70, 0xf0,
        0x08, 0x88, 0x48, 0xc8, 0x28, 0xa8, 0x68, 0xe8,
        0x18, 0x98, 0x58, 0xd8, 0x38, 0xb8, 0x78, 0xf8,
        0x04, 0x84, 0x44, 0xc4, 0x24, 0xa4, 0x64, 0xe4,
        0x14, 0x94, 0x54, 0xd4, 0x34, 0xb4, 0x74, 0xf4,
        0x0c, 0x8c, 0x4c, 0xcc, 0x2c, 0xac, 0x6c, 0xec,
        0x1c, 0x9c, 0x5c, 0xdc, 0x3c, 0xbc, 0x7c, 0xfc,
        0x02, 0x82, 0x42, 0xc2, 0x22, 0xa2, 0x62, 0xe2,
        0x12, 0x92, 0x52, 0xd2, 0x32, 0xb2, 0x72, 0xf2,
        0x0a, 0x8a, 0x4a, 0xca, 0x2a, 0xaa, 0x6a, 0xea,
        0x1a, 0x9a, 0x5a, 0xda, 0x3a, 0xba, 0x7a, 0xfa,
        0x06, 0x86, 0x46, 0xc6, 0x26, 0xa6, 0x66, 0xe6,
        0x16, 0x96, 0x56, 0xd6, 0x36, 0xb6, 0x76, 0xf6,
        0x0e, 0x8e, 0x4e, 0xce, 0x2e, 0xae, 0x6e, 0xee,
        0x1e, 0x9e, 0x5e, 0xde, 0x3e, 0xbe, 0x7e, 0xfe,
        0x01, 0x81, 0x41, 0xc1, 0x21, 0xa1, 0x61, 0xe1,
        0x11, 0x91, 0x51, 0xd1, 0x31, 0xb1, 0x71, 0xf1,
        0x09, 0x89, 0x49, 0xc9, 0x29, 0xa9, 0x69, 0xe9,
        0x19, 0x99, 0x59, 0xd9, 0x39, 0xb9, 0x79, 0xf9,
        0x05, 0x85, 0x45, 0xc5, 0x25, 0xa5, 0x65, 0xe5,
        0x15, 0x95, 0x55, 0xd5, 0x35, 0xb5, 0x75, 0xf5,
        0x0d, 0x8d, 0x4d, 0xcd, 0x2d, 0xad, 0x6d, 0xed,
        0x1d, 0x9d, 0x5d, 0xdd, 0x3d, 0xbd, 0x7d, 0xfd,
        0x03, 0x83, 0x43, 0xc3, 0x23, 0xa3, 0x63, 0xe3,
        0x13, 0x93, 0x53, 0xd3, 0x33, 0xb3, 0x73, 0xf3,
        0x0b, 0x8b, 0x4b, 0xcb, 0x2b, 0xab, 0x6b, 0xeb,
        0x1b, 0x9b, 0x5b, 0xdb, 0x3b, 0xbb, 0x7b, 0xfb,
        0x07, 0x87, 0x47, 0xc7, 0x27, 0xa7, 0x67, 0xe7,
        0x17, 0x97, 0x57, 0xd7, 0x37, 0xb7, 0x77, 0xf7,
        0x0f, 0x8f, 0x4f, 0xcf, 0x2f, 0xaf, 0x6f, 0xef,
        0x1f, 0x9f, 0x5f, 0xdf, 0x3f, 0xbf, 0x7f, 0xff,
    };
*/

template<int16_t SB_WIDTH, int16_t SB_HEIGHT> class ArdBitmap
{
  public:

    void drawCompressed(int16_t sx, int16_t sy, const uint8_t *compBitmap, uint8_t color, uint8_t align, uint8_t mirror);
    void drawCompressedResized(int16_t sx, int16_t sy, const uint8_t *compBitmap, uint8_t color,uint8_t align, uint8_t mirror, float resize);

    void drawBitmap(int16_t sx, int16_t sy, const uint8_t *bitmap,uint8_t w, uint8_t h, uint8_t color, uint8_t align, uint8_t mirror);
    void drawBitmapResized(int16_t sx, int16_t sy, const uint8_t *bitmap, uint8_t w,uint8_t h, uint8_t color,uint8_t align, uint8_t mirror, float resize);
};

////////////////////////
// COMPRESSED BITMAPS //
////////////////////////

template<int16_t SB_WIDTH, int16_t SB_HEIGHT>
void ArdBitmap<SB_WIDTH, SB_HEIGHT>::drawCompressed(int16_t sx, int16_t sy, const uint8_t *compBitmap, uint8_t color, uint8_t align, uint8_t mirror)
{
  //TODO: check why int16_t sizeCounter is a bit faster than uint16_t sizeCounter
  int16_t sizeCounter;
  uint16_t len;
  int a, iCol;
  uint8_t decByte;
  uint8_t w, h;
  uint8_t col;
  boolean scanMode, scanZigZag;
  uint16_t encoderPos;
  uint8_t characterPos;


  // Read size from header (Max image size = 128 x 64)

  uint8_t byte0 = pgm_read_byte(&compBitmap[0]);
  uint8_t byte1 = pgm_read_byte(&compBitmap[1]);

  w = (byte0 & 0b01111111) + 1;
  h = (byte1 & 0b00111111) + 1;

  // Move positions to match alignment

  if (align & ALIGN_H_CENTER) {
    sx -= (w / 2);
  } else if (align & ALIGN_H_RIGHT) {
    sx -= w;
  }

  if (align & ALIGN_V_CENTER) {
    sy -= (h / 2);
  } else if (align & ALIGN_V_BOTTOM) {
    sy -= h;
  }

  // No need to draw at all if we're offscreen
  if (sx + w < 0 || sx > SB_WIDTH - 1 || sy + h < 0 || sy > SB_HEIGHT - 1)
    return;

  col = (byte0 >> 7) & 0x01;
  scanMode = ((byte1 >> 6) & 0x01) > 0;
  scanZigZag = ((byte1 >> 7) & 0x01) > 0;

  int yOffset = abs(sy) % 8;
  int sRow = sy / 8;
  if (sy < 0 && yOffset > 0) {
    sRow--;
    yOffset = 8 - yOffset;
  }

  uint8_t data;
  uint16_t bitmap_data;
  uint8_t mul_amt = 1 << yOffset;

  //uint16_t boffs;

  int8_t rows = h / 8;
  if (h % 8 != 0) rows++;

  // Init values
  iCol = 0;
  decByte = 0;
  encoderPos = 16;
  characterPos = 7;
  a = 0;

  if (mirror & MIRROR_VERTICAL) {
    a = rows - 1;
    scanMode = !scanMode;
  }

  int iColMod = (mirror & MIRROR_HORIZONTAL) ? w - 1  : 0;
  while (a < rows && a > -1) {

    sizeCounter = 1;
    while (((pgm_read_byte(&compBitmap[encoderPos / 8]) >> (encoderPos % 8)) & 0x01)  == 1) {
      sizeCounter ++;
      encoderPos++;
    }
    encoderPos ++;

    if (sizeCounter == 1) {
      len = 1 + ((pgm_read_byte(&compBitmap[encoderPos / 8]) >> (encoderPos % 8)) & 0x01);
      encoderPos++;
    } else {
      len = (1 << (sizeCounter - 1)) + 1 ;

      //TODO: check why int j is faster than uint16_t j
      for (int j = 0; j < sizeCounter - 1; j++) {
        if (((pgm_read_byte(&compBitmap[encoderPos / 8]) >> (encoderPos % 8)) & 0x01) == 1) {
          len += (1 << j);
        }
        encoderPos++;
      }
    }

    for (uint16_t i = 0; i < len; i++)
    {

      #ifndef NO_SPEED_HACK
      if (col == 0) {
        if (len - i > characterPos) {
          i += characterPos;
          characterPos = 0;
        } else {
          characterPos -= (len - i - 1);
          i = len;
        }
      } else if (len - i > characterPos) {
        if (characterPos == 7) {
          decByte = 0xFF;
        } else {
          decByte |= scanMode ? 0xFF >> (7 - characterPos) : (0xFF80 >> characterPos);
        }
        i += characterPos;
        characterPos = 0;
      } else {
        decByte |= scanMode ? BIT_SHIFT[characterPos] : BIT_SHIFT[7 - characterPos];
      }
      #else
      if (col) {
        decByte |= scanMode ? BIT_SHIFT[characterPos] : BIT_SHIFT[7 - characterPos];
      }
      #endif

      characterPos--;

      if (characterPos == 0xFF){

        //Paint decoded byte
        int8_t bRow = sRow + a;

        if (decByte && bRow < (SB_HEIGHT / 8) && iColMod + sx < SB_WIDTH && iColMod + sx >= 0){

          bitmap_data = decByte * mul_amt;

          if (bRow >= 0) {

            data = ARDBITMAP_SBUF[(bRow * SB_WIDTH) + sx + iColMod];
            if (color) {
              data |= bitmap_data & 0xFF;
            }else {
              data &= ~(bitmap_data & 0xFF);
            }
            ARDBITMAP_SBUF[(bRow * SB_WIDTH) + sx + iColMod] = data;
          }

          if (yOffset && bRow < (SB_HEIGHT / 8) - 1 && bRow > -2) {

            data = ARDBITMAP_SBUF[((bRow + 1) * SB_WIDTH) + sx + iColMod];
            if (color) {
              data |= ((bitmap_data >> 8) & 0xFF);
            } else {
              data &= ~(((bitmap_data >> 8) & 0xFF));
            }
            ARDBITMAP_SBUF[((bRow + 1)*SB_WIDTH) + sx + iColMod] = data;
          }
        }

        // Iterate next column-byte

        if (scanZigZag) {
          scanMode = !scanMode;
        }

        iCol++;

        if(mirror & MIRROR_HORIZONTAL){
          iColMod--;
        }else{
          iColMod++;
        }
        if (iCol >= w){

          iCol = 0;
          if (mirror & MIRROR_VERTICAL) {
            a--;
          } else {
            a++;
          }

          iColMod = (mirror & MIRROR_HORIZONTAL) ? w - 1  : 0;
        }

        // Reset decoded byte
        decByte = 0;
        characterPos = 7;
      }
    }

    // Toggle color for next span
    col = 1 - col;
  }
}



template<int16_t SB_WIDTH, int16_t SB_HEIGHT>
void ArdBitmap<SB_WIDTH, SB_HEIGHT>::drawCompressedResized(int16_t sx, int16_t sy, const uint8_t *compBitmap, uint8_t color,uint8_t align, uint8_t mirror, float resize)
{

  //TODO: check if this can be done in a better way
  #ifdef RESIZE_HACK
  if (resize >= 1.0){
    return drawCompressed(sx, sy, compBitmap, color, align, mirror);
  }
  #else
  if (resize > 1.0){
    resize = 1.0;
  }
  #endif

  //TODO: check why int16_t sizeCounter is a bit faster than uint16_t sizeCounter
  int16_t sizeCounter;
  uint16_t len;
  uint8_t a, iCol;
  uint8_t decByte;
  uint8_t w, wRes, h, hRes;
  uint8_t col;
  boolean scanMode, scanZigZag;
  uint16_t encoderPos;
  uint8_t characterPos;

  // Read size from header (Max image size = 128 x 64)

  uint8_t byte0 = pgm_read_byte(&compBitmap[0]);
  uint8_t byte1 = pgm_read_byte(&compBitmap[1]);

  w = (byte0 & 0b01111111) + 1;
  h = (byte1 & 0b00111111) + 1;

  wRes = (uint8_t)(w * resize);
  hRes = (uint8_t)(h * resize);

  if (align & ALIGN_H_CENTER) {
    sx -= (wRes / 2);
  } else if (align & ALIGN_H_RIGHT) {
    sx -= wRes;
  }

  if (align & ALIGN_V_CENTER) {
    sy -= (hRes / 2);
  } else if (align & ALIGN_V_BOTTOM) {
    sy -= hRes;
  }

  // No need to draw at all if we're offscreen
  if (sx + wRes < 0 || sx > SB_WIDTH - 1 || sy + hRes < 0 || sy > SB_HEIGHT - 1)
    return;

  col = (byte0 >> 7) & 0x01;
  scanMode = ((byte1 >> 6) & 0x01) > 0;
  scanZigZag = ((byte1 >> 7) & 0x01) > 0;

  int yOffset = abs(sy) % 8;
  int sRow = sy / 8;
  if (sy < 0) {
    sRow--;
    yOffset = 8 - yOffset;
  }

  uint8_t data;
  uint16_t bitmap_data;
  uint8_t mul_amt = 1 << yOffset;

  int rows = h / 8;
  if (h % 8 != 0) rows++;

  uint8_t rowsRes = hRes / 8;
  if (hRes % 8 != 0) rowsRes++;

  // Init values
  iCol = 0;
  decByte = 0;
  encoderPos = 16;
  characterPos = 7;
  a = 0;

  // Create Lookup tables to speed up drawing

  uint8_t x_LUT[w];

  for (uint8_t i=0 ; i < w; i++){
    x_LUT[i] = 0xFF;
  }
  // Precalculate column translation (0xFF if skipped)
  for (uint8_t i=0 ; i < wRes; i++){
    x_LUT[((uint16_t)i  *  w) / wRes] = (mirror & MIRROR_HORIZONTAL) ? wRes - 1 - i : i;
  }

  uint8_t y_LUT[h];

  for (uint8_t i=0 ; i < h; i++){
    y_LUT[i] = 0xFF;
  }

  for (uint8_t i=0 ; i < hRes; i++){
    y_LUT[((uint16_t)i * h) / hRes] = (mirror & MIRROR_VERTICAL) ? hRes - 1 - i : i;
  }

  while (a < rows && /*a > -1*/ a != 0xFF) {

    sizeCounter = 1;
    while (((pgm_read_byte(&compBitmap[encoderPos / 8]) >> (encoderPos % 8)) & 0x01)  == 1) {
      sizeCounter ++;
      encoderPos++;
    }
    encoderPos ++;

    if (sizeCounter == 1) {
      len = 1 + ((pgm_read_byte(&compBitmap[encoderPos / 8]) >> (encoderPos % 8)) & 0x01);
      encoderPos++;
    } else {
      len = (1 << (sizeCounter - 1)) + 1 ;

      //TODO: check why int j is faster than uint16_t j
      for (int j = 0; j < sizeCounter - 1; j++) {
        if (((pgm_read_byte(&compBitmap[encoderPos / 8]) >> (encoderPos % 8)) & 0x01) == 1) {
          len += (1 << j);
        }
        encoderPos++;
      }
    }

    for (uint16_t i = 0; i < len; i++)
    {

      #ifndef NO_SPEED_HACK
      if (col == 0) {
        if (len - i > characterPos) {
          i += characterPos;
          characterPos = 0;
        } else {
          characterPos -= (len - i - 1);
          i = len;
        }
      } else if (len - i > characterPos) {
        if (characterPos == 7) {
          decByte = 0xFF;
        } else {
          decByte |= scanMode ? 0xFF >> (7 - characterPos) : (0xFF80 >> characterPos);
        }
        i += characterPos;
        characterPos = 0;
      } else {
        decByte |= scanMode ? BIT_SHIFT[characterPos] : BIT_SHIFT[7 - characterPos];
      }
      #else
      if (col) {
        decByte |= scanMode ? BIT_SHIFT[characterPos] : BIT_SHIFT[7 - characterPos];
      }
      #endif

      characterPos--;

      if (characterPos == 0xFF){

        //Paint decoded byte
        int aRow8 = a * 8;
        int16_t iColMod = x_LUT[iCol] + sx;

        // Skip if column not needed
        if (x_LUT[iCol] != 0xFF && iColMod < SB_WIDTH && iColMod >= 0){

          for (uint8_t s = 0; s < 8 ;s++){

            if (y_LUT[aRow8+s] != 0xFF && decByte &  BIT_SHIFT[s]){

              //TODO: CHECK LIMITS ON LUT?
              uint8_t row = (uint8_t)(y_LUT[aRow8+s]+sy) / 8;

              if (row < (SB_HEIGHT / 8)) {

                if (color) {
                  ARDBITMAP_SBUF[(row*SB_WIDTH) + (uint8_t)iColMod] |=   BIT_SHIFT[((uint8_t)(y_LUT[aRow8+s]+sy) % 8)];
                } else {
                  ARDBITMAP_SBUF[(row*SB_WIDTH) + (uint8_t)iColMod] &= ~ BIT_SHIFT[((uint8_t)(y_LUT[aRow8+s]+sy) % 8)];
                }
              }

            }
        }
      }

      // Iterate next column-byte

      if (scanZigZag) {
        scanMode = !scanMode;
      }

      iCol++;
      if (iCol >= w){

        iCol = 0;
        a++;
      }

      // Reset decoded byte
      decByte = 0;
      characterPos = 7;
      }
    }

    col = 1 - col; // toggle colour for next span
  }
}



//////////////////////////
// UNCOMPRESSED BITMAPS //
//////////////////////////


template<int16_t SB_WIDTH, int16_t SB_HEIGHT>
void ArdBitmap<SB_WIDTH, SB_HEIGHT>::drawBitmap(int16_t x, int16_t y, const uint8_t *bitmap, uint8_t w, uint8_t h, uint8_t color, uint8_t align, uint8_t mirror)
{

  // Move positions to match alignment

  if (align & ALIGN_H_CENTER) {
    x -= (w / 2);
  } else if (align & ALIGN_H_RIGHT) {
    x -= w;
  }

  if (align & ALIGN_V_CENTER) {
    y -= (h / 2);
  } else if (align & ALIGN_V_BOTTOM) {
    y -= h;
  }

  // no need to draw at all of we're offscreen
  if (x + w <= 0 || x > SB_WIDTH - 1 || y + h <= 0 || y > SB_HEIGHT - 1)
    return;

  if (bitmap == NULL)
    return;

  // xOffset technically doesn't need to be 16 bit but the math operations
  // are measurably faster if it is
  uint16_t xOffset, ofs;
  int8_t yOffset = abs(y) % 8;
  int8_t sRow = y / 8;
  uint8_t loop_h, start_h, rendered_width;

  if (y < 0 && yOffset > 0) {
    sRow--;
    yOffset = 8 - yOffset;
  }

  // if the left side of the render is offscreen skip those loops
  if (x < 0) {
    xOffset = abs(x);
  } else {
    xOffset = 0;
  }

  // if the right side of the render is offscreen skip those loops
  if (x + w > SB_WIDTH - 1) {
    rendered_width = ((SB_WIDTH - x) - xOffset);
  } else {
    rendered_width = (w - xOffset);
  }

  // if the top side of the render is offscreen skip those loops
  if (sRow < -1) {
    start_h = abs(sRow) - 1;
  } else {
    start_h = 0;
  }

  loop_h = h / 8 + (h % 8 > 0 ? 1 : 0); // divide, then round up

  // if (sRow + loop_h - 1 > (SB_HEIGHT/8)-1)
  if (sRow + loop_h > (SB_HEIGHT / 8)) {
    loop_h = (SB_HEIGHT / 8) - sRow;
  }

  // prepare variables for loops later so we can compare with 0
  // instead of comparing two variables
  loop_h -= start_h;

  sRow += start_h;
  ofs = (sRow * SB_WIDTH) + x + xOffset;

  uint8_t *bofs = (uint8_t *)bitmap + (start_h * w) + xOffset;

  if (mirror & MIRROR_HORIZONTAL)  {
    bofs += rendered_width - 1;
    if (x < 0){
      bofs -= w - rendered_width;
    } else{
      bofs += w - rendered_width;
    }
  }

  if (mirror & MIRROR_VERTICAL) {
    bofs += (loop_h - 1) * w;
    if (y < 0){
      bofs -=  (start_h * w);
    } else {
      bofs +=  (sRow  * w);
    }
  }

  uint8_t data;
  uint8_t mul_amt = 1 << yOffset;
  uint16_t bitmap_data;

      // really if yOffset = 0 you have a faster case here that could be
      // optimized
      for (uint8_t a = 0; a < loop_h; a++) {
        for (uint8_t iCol = 0; iCol < rendered_width; iCol++) {
          data = pgm_read_byte(bofs);
          if(data) {
            if (mirror & MIRROR_VERTICAL){
              //reverse bits
              data = (data & 0xF0) >> 4 | (data & 0x0F) << 4;
              data = (data & 0xCC) >> 2 | (data & 0x33) << 2;
              data = (data & 0xAA) >> 1 | (data & 0x55) << 1;

              //LUT - No speed improvement and more mem
              //data = (((REVERSE_16[(data & 0x0F)]) << 4) + REVERSE_16[((data & 0xF0) >> 4)]);

              //Fast but too much mem
              //data = REVERSE_256[data];
            }

            bitmap_data = data * mul_amt;
            if (sRow >= 0) {
              data = ARDBITMAP_SBUF[ofs];
              if (color){
                data |= bitmap_data & 0xFF;
              } else {
                data &= ~(bitmap_data & 0xFF);
              }
              ARDBITMAP_SBUF[ofs] = data;
            }

            if (yOffset != 0 && sRow < 7) {
              data = ARDBITMAP_SBUF[ofs + SB_WIDTH];
              if (color){
                data |= (bitmap_data >> 8) & 0xFF;
              } else{
                data &= ~((bitmap_data >> 8) & 0xFF);
              }
              ARDBITMAP_SBUF[ofs + SB_WIDTH] = data;
            }
          }
          ofs++;

          if (mirror & MIRROR_HORIZONTAL){
            bofs--;
          } else{
            bofs++;
          }
        }
        sRow++;

        if (mirror & MIRROR_HORIZONTAL){
          bofs += w + rendered_width;
        } else{
          bofs += w - rendered_width;
        }

        if (mirror & MIRROR_VERTICAL){
          bofs -= 2 * w;
        }
        ofs += SB_WIDTH - rendered_width;
      }
}


template<int16_t SB_WIDTH, int16_t SB_HEIGHT>
void ArdBitmap<SB_WIDTH, SB_HEIGHT>::drawBitmapResized(int16_t sx, int16_t sy, const uint8_t *bitmap, uint8_t w,uint8_t h, uint8_t color,uint8_t align, uint8_t mirror, float resize)
{

  //TODO: check if this can be done in a better way
  #ifdef RESIZE_HACK
  if (resize >= 1.0){
    return drawBitmap(sx, sy, bitmap,w, h, color, align, mirror);
  }
  #else
  if (resize > 1.0){
    resize = 1.0;
  }
  #endif

  //TODO: check why int16_t sizeCounter is a bit faster than uint16_t sizeCounter
  int16_t sizeCounter;
  uint16_t len;
  uint8_t a, iCol;
  uint8_t data;
  uint8_t  wRes,  hRes;
  uint8_t col;

  wRes = (uint8_t)(w * resize);
  hRes = (uint8_t)(h * resize);


  // Move positions to match alignment
  if (align & ALIGN_H_CENTER) {
    sx -= (wRes / 2);
  } else if (align & ALIGN_H_RIGHT) {
    sx -= wRes;
  }

  if (align & ALIGN_V_CENTER) {
    sy -= (hRes / 2);
  } else if (align & ALIGN_V_BOTTOM) {
    sy -= hRes;
  }

  // No need to draw at all if we're offscreen
  if (sx + wRes < 0 || sx > SB_WIDTH - 1 || sy + hRes < 0 || sy > SB_HEIGHT - 1)
    return;

  int yOffset = abs(sy) % 8;
  int sRow = sy / 8;
  if (sy < 0) {
    sRow--;
    yOffset = 8 - yOffset;
  }

  int rows = h / 8;
  if (h % 8 != 0) rows++;

  uint8_t rowsRes = hRes / 8;
  if (hRes % 8 != 0) rowsRes++;

  // Init values
  iCol = 0;
  a = 0;

  // Create Lookup tables to speed up drawing

  uint8_t x_LUT[w];

  for (uint8_t i=0 ; i < w; i++){
    x_LUT[i] = 0xFF;
  }
  // Precalculate column translation (0xFF if skipped)
  for (uint8_t i=0 ; i < wRes; i++){
    x_LUT[((uint16_t)i  *  w) / wRes] = (mirror & MIRROR_HORIZONTAL) ? wRes - 1 - i : i;
  }

  uint8_t y_LUT[h];

  for (uint8_t i=0 ; i < h; i++){
    y_LUT[i] = 0xFF;
  }

  for (uint8_t i=0 ; i < hRes; i++){
    y_LUT[((uint16_t)i * h) / hRes] = (mirror & MIRROR_VERTICAL) ?  hRes - 1 - i : i;
  }

  len = w * rows;

  for (uint16_t i = 0; i < len ; i++){

    data = pgm_read_byte(&bitmap[i]);
    int aRow8 = a * 8;
    int16_t iColMod =  x_LUT[iCol] + sx;

    // Skip if column not needed
    if (x_LUT[iCol] != 0xFF && iColMod < SB_WIDTH && iColMod >= 0){
      for (uint8_t s = 0; s < 8 ;s++){
        if (y_LUT[aRow8+s] != 0xFF && data &  BIT_SHIFT[s]){
          //TODO: CHECK LIMITS ON LUT?
          uint8_t row = (uint8_t)(y_LUT[aRow8+s]+sy) / 8;

          if (row < (SB_HEIGHT / 8)) {
            if (color) {
              ARDBITMAP_SBUF[(row*SB_WIDTH) + (uint8_t)iColMod] |=   BIT_SHIFT[((uint8_t)(y_LUT[aRow8+s]+sy) % 8)];
            } else {
              ARDBITMAP_SBUF[(row*SB_WIDTH) + (uint8_t)iColMod] &= ~ BIT_SHIFT[((uint8_t)(y_LUT[aRow8+s]+sy) % 8)];
            }
          }
         }
      }
    }

    iCol++;
    if (iCol >= w){
        iCol = 0;
        a++;
    }
  }
}

#endif

