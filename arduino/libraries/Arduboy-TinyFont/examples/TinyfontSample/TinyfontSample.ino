#include <Arduboy2.h>
#include <Tinyfont.h>

Arduboy2 arduboy;
Tinyfont tinyfont = Tinyfont(arduboy.sBuffer, Arduboy2::width(), Arduboy2::height());
char allLetters[101];

void setup() {
  arduboy.begin();
  Serial.begin(9600);

  // create all ascii letters from 32-126
  size_t newLineCounter = 0;
  for (size_t i = 0; i < 100; i++) {
    if ((i % 26) == 0) {
      allLetters[i] = '\n';
      newLineCounter++;
    }
    else{
      allLetters[i] = (char) (i+32) - newLineCounter;
    }
  }
  allLetters[100] = '\0';
}

void loop() {
  // put your main code here, to run repeatedly:

  arduboy.clear();

  tinyfont.setCursor(1, 0);
  tinyfont.print("THE QUICK BROWN FOX JUMPS\nOVER THE LAZY DOG.");
  tinyfont.setCursor(1, 11);
  tinyfont.print("The quick brown fox jumps\nover the lazy dog.");

  // all letters
  tinyfont.setCursor(1, 22);
  tinyfont.print(allLetters);

  // for comparison
  arduboy.setCursor(1, 52);
  arduboy.print("THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.");

  // screen capture
  Serial.write(arduboy.getBuffer(), 128 * 64 / 8);
  arduboy.display();
}
