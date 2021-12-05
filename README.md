# ProjectABE - 8BitCADE fork

Forked from https://github.com/felipemanga/ProjectABE

ArduBoyEmulator and IDE in HTML5

# Build and run locally

Steps to build and run locally:

- Install nvm
- Install lts/dubnium node version and use that version
- cd into project dir
- Run following commands:

```
npm install -g gulp-cli
npm install -g serve
npm install
mkdir build
gulp copy
gulp web-build
serve build
```

# Emulator interface

You can play by touching the buttons, if you have a touchscreen. If your device has a keyboard, use the **arrow keys** and <kbd>Ctrl</kbd>/<kbd>**A**</kbd>/<kbd>Z</kbd> for button A and <kbd>Alt</kbd>/<kbd>**B**</kbd>/<kbd>S</kbd>/<kbd>X</kbd> for button B. Joysticks/pads are also supported, if your browser supports the gamepad API.

Press <kbd>**F**</kbd> to toggle fullscreen mode.

You can start/stop recording a GIF of the game by pressing <kbd>**R**</kbd>. If you want a PNG screenshot, press <kbd>**P**</kbd>.

To exit a game and go back to the list, press <kbd>**Esc**</kbd> or click on the **power button** above the screen.

Some games look/play better on a vertical screen, like [1943](https://felipemanga.github.io/ProjectABE/?url=https://raw.githubusercontent.com/eried/ArduboyCollection/master/Arcade%2F1943%2F1943.hex) or [Breakout-V](https://felipemanga.github.io/ProjectABE/?url=http://www.crait.net/arduboy/breakoutv/app.hex). The emulator can be put in vertical mode by clicking on the **chip in the lower-right** of the Arduboy's screen.

Aside from the standard Arduboy and Microcard, other skins are available. Press <kbd>**F3**</kbd> to cycle through them. You can specify which skin to load by adding a parameter to the URL (`?hex=game.hex&skin=Tama`) or the commandline (`ProjectABE --skin=Tama game.hex`).

If you want to debug the game you're currently playing, click on the **USB port** (bottom-center).
To upload the game to your Arduboy, press <kbd>**U**</kbd> (offline version only).

### Keyboard bindings:

| Key | Function |
| :---: | -------- |
| Arrow keys | Arrow keys |
| <kbd>Ctrl</kbd>/<kbd>A</kbd>/<kbd>Z</kbd> | Button A |
| <kbd>Alt</kbd>/<kbd>B</kbd>/<kbd>S</kbd>/<kbd>X</kbd> | Button B |
| <kbd>F</kbd> | Fullscreen |
| <kbd>R</kbd> | Record GIF |
| <kbd>P</kbd> | PNG screenshot |
| <kbd>Esc</kbd> | Exit game |
| <kbd>F3</kbd> | Change skin |
| <kbd>U</kbd> | Upload to physical device |
| <kbd>F6</kbd> | Reset game |

