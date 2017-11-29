#ArdVoice: A library to play audio (voices) on the Arduboy
By @igvina
##Features:
###Voice library:
* Play compressed audio (works better with voices)
* Good speed but can cause slowdowns on 60 fps games 
* Configurable speed (from 0.8 to 1.4)

###Voice compressor (vocoder):
* Works with wav (only 8000 Hz, mono, 1 byte PCM_UNSIGNED). I recommend Audacity to convert to this format
* Configurable quality (from 0 to 10), default is 4
* Good compression (from 88 bytes/s to 530 bytes/s)

##Video:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=vtDYwqJ68gU
" target="_blank"><img src="http://img.youtube.com/vi/vtDYwqJ68gU/0.jpg" 
alt="DEMO" width="240" height="180" border="10" /></a>

##Usage:
###Vocoder (v0.2):
* Syntax: java -jar vocoder0.2.jar audio.wav [-options]
	* options:
		* -q VALUE		Quality (0 - 10) default: 4
		* -gs SKETCH_FOLDER	Generate sketch code
		* -v			Play compressed voice
		* -anp PREFIX		Array name prefix
		* -ver			Show vocoder version

	* examples:
	
        	"java -jar vocoder.jar dog.wav -gs DOG -v -q 6"
        	"java -jar vocoder.jar merry.wav -v"
	
###Voice library (v0.1):

* Install the ArdVoice library in the Arduino IDE.
* Add in .ino file:
	* `#include <ArdVoice.h>`
	* `ArdVoice ardvoice;`
* To play voice call function: ardvoice.playVoice (...).

####Methods:
* `void playVoice(const char *audio);`
* `void playVoice(const char *audio, uint16_t startTime, uint16_t endTime, float speed);`
* `void stopVoice();`
* `boolean isVoicePlaying();`
