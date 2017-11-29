# ArdBitmap: Compress and draw bitmaps on the Arduboy
By @igvina
## Features:
### Bitmap library:
* Works with compressed & uncompressed bitmaps.
* Real-time image resize (downscale).
* Horizontal/Vertical mirroring (fast).
* Bitmap alignment.

### Bitmap compressor:
* Compatible with PC/MAC/Linux (made with Java).
* Good compression (better than Cabi).
* Supports PNG, GIF (also animated gifs) & JPG.
* Autogenerate sketches from images or animated gifs (great for no-developers).

## Video:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=vtDYwqJ68gU
" target="_blank"><img src="http://img.youtube.com/vi/vtDYwqJ68gU/0.jpg" 
alt="DEMO" width="240" height="180" border="10" /></a>

## Usage:
### Compressor (v2.0):
* Syntax: java -jar compressor2.0.jar image [-options]
	* options:
		* -gs SKETCH_FOLDER       Generate sketch code
		* -fr VALUE               Change frame rate (only animated gifs)
		* -v                      View compressed image
		* -anp PREFIX             Array name prefix
		* -ver                    Show encoder version

	* examples:

        	"java -jar compressor2.0.jar dog.gif -gs DOG -fr 15"
        	"java -jar compressor2.0.jar dance.png -v"

	* Notes:
		* Supports PNG, GIF (also animated gifs) & JPG
		* Max image size = 128 x 64 pixels (resized if bigger)
		* Encoding ratio could be bigger than 1 (worse than original image)

### Bitmap library (v2.0.x):
* Install the ArdBitmap library in the Arduino IDE. The library can be installed using the Arduino IDE library manager:

    - In the Arduino IDE select from the menus: `Sketch > Include Library > Manage Libraries...`
    - In the Library Manager *Filter your search...* field enter *ardbitmap*
    - Click somewhere within the ArdBitmap entry.
    - Click on the *Install* button.

    For more library installation information see:

    [Installing Additional Arduino Libraries - Using the Library Manager](https://www.arduino.cc/en/Guide/Libraries#toc3)

* In .ino file, add ArdBitmap library instance after main library instance:

```cpp
// make an instance of the Arduboy2 class used for many functions
Arduboy2 arduboy;

// make an ArdBitmap instance that will use the given the screen buffer and dimensions
#define ARDBITMAP_SBUF arduboy.getBuffer()
#include <ArdBitmap.h>
ArdBitmap<WIDTH, HEIGHT> ardbitmap;
```

* See the _Library instance details_ section below for more information on creating an ArdBitmap class instance.

* To draw, call function: ardbitmap.drawCompressed(...) , ardbitmap.drawCompressedResized(...) , ardbitmap.drawBitmap(...) , ardbitmap.drawBitmapResized(...)

#### Methods:

##### Compressed images:
* `void drawCompressed(int16_t sx, int16_t sy, const uint8_t *compBitmap, uint8_t color, uint8_t align, uint8_t mirror);`
* `void drawCompressedResized(int16_t sx, int16_t sy, const uint8_t *compBitmap, uint8_t color,uint8_t align, uint8_t mirror, float resize);`

##### Uncompressed images:
* `void drawBitmap(int16_t sx, int16_t sy, const uint8_t *bitmap,uint8_t w, uint8_t h, uint8_t color, uint8_t align, uint8_t mirror);`
* `void drawBitmapResized(int16_t sx, int16_t sy, const uint8_t *bitmap, uint8_t w,uint8_t h, uint8_t color,uint8_t align, uint8_t mirror, float resize);`

#### Defines:
* `#define ALIGN_H_LEFT`
* `#define ALIGN_H_RIGHT`
* `#define ALIGN_H_CENTER`
* `#define ALIGN_V_TOP`
* `#define ALIGN_V_BOTTOM`
* `#define ALIGN_V_CENTER`
* `#define ALIGN_CENTER`
* `#define ALIGN_NONE`
* `#define MIRROR_NONE`
* `#define MIRROR_HORIZONTAL`
* `#define MIRROR_VERTICAL`
* `#define MIRROR_HOR_VER`

#### Library instance details:
* The library is implemented as a class template named ArdBitmap. It requires 3 pieces of information in order to create an instance of the ArdBitmap class:

    - An _expression_ that will evaluate to a pointer to the first location in the screen buffer array, such that it can be used to index a screen buffer location like `expression[i] = 5`. The expression is provided by defining the macro `ARDBITMAP_SBUF`. It must be defined **before** including _ArdBitmap.h_
    - The width of the screen, in pixels. This is provided as the first of the two template arguments.
    - the height of the screen in pixels. This is provided as the second of the two template arguments.

* It's probably best to group the `#define ARDBITMAP_SBUF`, the `#include ArdBitmap.h` and the instantiation of an ArdBitmap class object as one block of code. For an Arduboy sketch this might be:

```cpp
// make an instance of the Arduboy2 class used for many functions
// (this has to be done before creating an ArdBitmap object so we can define
//  the ARDBITMAP_SBUF macro and use the defined WIDTH and HEIGHT)
Arduboy2 arduboy;
// use the following instead, for the older Arduboy library:
//Arduboy arduboy;

// define the screen buffer pointer expression
#define ARDBITMAP_SBUF arduboy.getBuffer()
// Arduboy2 library verson 3.1.0 and higher exposes the screen buffer as public,
// so the following could be used instead and may reduce code size:
//#define ARDBITMAP_SBUF arduboy.sBuffer

// we can now include the ArdBitmap header file, which will use the
// ARDBITMAP_SBUF macro when creating the template
#include <ArdBitmap.h>

// make an ArdBitmap instance, providing screen width and height arguments that
// were defined by the Arduboy2 (or Arduboy) library
ArdBitmap<WIDTH, HEIGHT> ardbitmap;
```

