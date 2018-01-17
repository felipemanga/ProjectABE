# ProjectABE
ArduBoyEmulator and IDE in HTML5

## Want to contribute?

     npm install -g gulp-cli
     npm install -g serve
     npm install -g cordova   # optional, for android build only
     git clone https://github.com/felipemanga/ProjectABE.git
     cd ProjectABE
     npm install
     mkdir build
     gulp copy
     gulp web-build
     cd build
     serve .

     
# Running the emulator

The emulator can be used in one of the following ways:
- Go to https://felipemanga.github.io/ProjectABE, pick a game and play.
- Download one of the offline builds [here](https://github.com/felipemanga/ProjectABE/releases) and run it.

If you want to use the online emulator, you can run a HEX/Arduboy directly by adding it to the URL like this:
https://felipemanga.github.io/ProjectABE/?url=https://site/file.hex

Offline is similar, if you have the executable in your PATH:
ProjectABE /path/to/file.hex

If you're using Chrome (not Firefox), you can also drag-and-drop a hex/arduboy file into the game list to play it.


# Emulator interface

You can play by touching the buttons, if you have a touchscreen. If your device has a keyboard, use the **arrow keys** and Ctrl/**A**/Z for button A and Alt/**B**/S/X for button B. Joysticks/pads are also supported, if your browser supports the gamepad API.

Press **F** to toggle fullscreen mode.

You can start/stop recording a GIF of the game by pressing **R**.

To exit a game and go back to the list, click on the **power button** above the screen.

Some games look/play better on a vertical screen, like [1942](https://felipemanga.github.io/ProjectABE/?url=https://raw.githubusercontent.com/eried/ArduboyCollection/master/Arcade%2F1943%2F1943.hex) or [Breakout-V](https://felipemanga.github.io/ProjectABE/?url=http://www.crait.net/arduboy/breakoutv/app.hex). The emulator can be put in vertical mode by clicking on the **chip in the lower-right** of the Arduboy's screen.

If you want to debug the game you're currently playing, click on the **USB port** (bottom-center, online version only, for now).


# IDE / Debugger

ProjectABE includes an IDE (based on the awesome [Ace](https://ace.c9.io) editor). It allows you to write, build and debug Arduboy games in your browser, without installing anything on your computer. Since it's a work-in-progress, the edges are still rough, but it's already possible to make entire games in it (see [Hello, Commander](https://felipemanga.github.io/ProjectABE/?url=https://github.com/felipemanga/HelloCommander)).

IDE Keyboard shortcuts:
- Ctrl-Enter: Build and run
- Ctrl-P: Jump to file
- F6: Reset
- F7: Step-In
- F8: Resume

You can drag-and-drop code (or a zip file containing code) into the editor. 

You can also drag-and-drop images to have them converted into source code, ready to be used with the Arduboy2 library, with an ascii-art preview (dashes are transparent, spaces are black, and sharps white):

<img src="https://gist.githubusercontent.com/felipemanga/9eaa3e96f4776aa36a0420c29d745b5d/raw/c27b632c6bcdc4cde50ab68d2671158068da54af/Walk.svg">

Simply ignore the arrays you do not need and GCC will not add them to the final build.