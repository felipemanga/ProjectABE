#include <FixedPoints.h>
#include <FixedPointsCommon.h>

void TestUQ8x8(void)
{
	Serial.println(F("The size of UQ8x8 on your system is:"));
	Serial.println(sizeof(UQ8x8));
	Serial.println();
	
	UQ8x8 a = 1.5;
	Serial.println(F("Displaying a as float:"));
	Serial.println(static_cast<float>(a));
	Serial.println();
	
	Serial.println(F("Displaying the integer part of a"));
	Serial.println(a.getInteger());
	Serial.println();
	
	Serial.println(F("Displaying floorFixed(a):"));
	Serial.println(static_cast<float>(floorFixed(a)));
	Serial.println();
	
	Serial.println(F("Displaying ceilFixed(a):"));
	Serial.println(static_cast<float>(ceilFixed(a)));
	Serial.println();
	
	Serial.println(F("Displaying roundFixed(a):"));
	Serial.println(static_cast<float>(roundFixed(a)));
	Serial.println();
	
	Serial.println(F("Displaying truncFixed(a):"));
	Serial.println(static_cast<float>(truncFixed(a)));
	Serial.println();
	
	UQ8x8 b = 5.25;
	Serial.println(F("Displaying b as float:"));
	Serial.println(static_cast<float>(b));
	Serial.println();
	
	Serial.println(F("Displaying the integer part of b"));
	Serial.println(b.getInteger());
	Serial.println();
	
	Serial.println(F("Displaying floorFixed(b):"));
	Serial.println(static_cast<float>(floorFixed(b)));
	Serial.println();
	
	Serial.println(F("Displaying ceilFixed(b):"));
	Serial.println(static_cast<float>(ceilFixed(b)));
	Serial.println();
	
	Serial.println(F("Displaying roundFixed(b):"));
	Serial.println(static_cast<float>(roundFixed(b)));
	Serial.println();
	
	Serial.println(F("Displaying truncFixed(b):"));
	Serial.println(static_cast<float>(truncFixed(b)));
	Serial.println();

	Serial.println(F("Displaying a + b as float:"));
	Serial.println(static_cast<float>(a + b));
	Serial.println();

	Serial.println(F("Displaying a - b as float:"));
	Serial.println(F("(Note the underflow due lack of sign bit)"));
	Serial.println(static_cast<float>(a - b));
	Serial.println();

	Serial.println(F("Displaying b - a as float:"));
	Serial.println(static_cast<float>(b - a));
	Serial.println();
	
	Serial.println(F("Displaying a * b as float:"));
	Serial.println(static_cast<float>(a * b));
	Serial.println();
	
	Serial.println(F("Displaying a / b as float:"));
	Serial.println(static_cast<float>(a / b));
	Serial.println();
}

void TestSQ7x8(void)
{
	Serial.println(F("The size of SQ7x8 on your system is:"));
	Serial.println(sizeof(SQ7x8));
	Serial.println();
	
	SQ7x8 a = 1.5;
	Serial.println(F("Displaying a as float:"));
	Serial.println(static_cast<float>(a));
	Serial.println();
	
	Serial.println(F("Displaying the integer part of a"));
	Serial.println(a.getInteger());
	Serial.println();
	
	Serial.println(F("Displaying floorFixed(a):"));
	Serial.println(static_cast<float>(floorFixed(a)));
	Serial.println();
	
	Serial.println(F("Displaying ceilFixed(a):"));
	Serial.println(static_cast<float>(ceilFixed(a)));
	Serial.println();
	
	Serial.println(F("Displaying roundFixed(a):"));
	Serial.println(static_cast<float>(roundFixed(a)));
	Serial.println();
	
	Serial.println(F("Displaying truncFixed(a):"));
	Serial.println(static_cast<float>(truncFixed(a)));
	Serial.println();
	
	SQ7x8 b = 5.25;
	Serial.println(F("Displaying b as float:"));
	Serial.println(static_cast<float>(b));
	Serial.println();
	
	Serial.println(F("Displaying the integer part of b"));
	Serial.println(b.getInteger());
	Serial.println();
	
	Serial.println(F("Displaying floorFixed(b):"));
	Serial.println(static_cast<float>(floorFixed(b)));
	Serial.println();
	
	Serial.println(F("Displaying ceilFixed(b):"));
	Serial.println(static_cast<float>(ceilFixed(b)));
	Serial.println();
	
	Serial.println(F("Displaying roundFixed(b):"));
	Serial.println(static_cast<float>(roundFixed(b)));
	Serial.println();
	
	Serial.println(F("Displaying truncFixed(b):"));
	Serial.println(static_cast<float>(truncFixed(b)));
	Serial.println();

	Serial.println(F("Displaying a + b as float:"));
	Serial.println(static_cast<float>(a + b));
	Serial.println();

	Serial.println(F("Displaying a - b as float:"));
	Serial.println(F("(Note this is correct due to sign bit)"));
	Serial.println(static_cast<float>(a - b));
	Serial.println();

	Serial.println(F("Displaying b - a as float:"));
	Serial.println(static_cast<float>(b - a));
	Serial.println();
	
	Serial.println(F("Displaying a * b as float:"));
	Serial.println(static_cast<float>(a * b));
	Serial.println();
	
	Serial.println(F("Displaying a / b as float:"));
	Serial.println(static_cast<float>(a / b));
	Serial.println();
}

void setup()
{
	while(!Serial);

	TestUQ8x8();
	TestSQ7x8();
}

void loop()
{
}
