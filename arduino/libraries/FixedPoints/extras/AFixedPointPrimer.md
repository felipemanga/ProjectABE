# A Fixed Point Primer

## What Are Fixed Point Numbers?

Normally computers operate on what are called 'integers'.
Integers are numbers that do not have a fractional component in them.
For example 0, 1, 42, 128, 10000 are all integers

Numbers that do have a fractional component are called 'rational' numbers.
They are often represented either as fractions or as numbers with a 'radix point'in them (often called a 'decimal point' in day-to-day maths)
For example 0.5, 1.75, 42.42, 128.367 and 10000.00001 are all rational numbers.

Normally computers represent these in what is called a 'floating point' format.
The name 'floating point' refers to the fact that the radix point can change position within the number, i.e. the radix point can 'float' around.

Another way to represent real numbers is what is called a 'fixed point' format.
The name 'fixed point' refers to the fact that the radix point does not change position within the number, i.e. it is 'fixed' in place.
This means that the range of numbers that can be represented by a fixed point is much more limited in terms of scale (how large or small the numbers can be).

## Why Use Fixed Point Numbers?

To allow the ability to move the radix point, the most common floating point formats are quite complicated and typically need special hardware or lots of complicated functions to implement them.

Almost all modern CPUs have floating point capabilities built into them.
However many CPUs intended for use in embedded systems do not have this capability built in because it is not always needed and it is often cheaper to leave it out.

This is where fixed points come in.

By limiting the format so that the radix point is fixed in place, the implementation of fixed point numbers becomes a lot simpler.

In fact for the most basic operations, addition and subtraction, the operations are exactly the same as they are for integers. Some of the more complicated operations like multiplication and division are very similar and merely involve a bit of bit shifting to adjust the results.

This means that even the simplest of CPUs can use fixed point numbers without any special hardware support. As long as they support integer and bit shifting operations, they can support fixed point numbers.

## Why Aren't Fixed Point Numbers Used More Often?

Fixed point numbers have fallen out of favour because modern CPUs tend to come with floating point support as standard. The wide range of support for floating points and the sheer dominance of the IEEE 754 floating point format means that for most cases using floating points to perform operations on real numbers is preferred.

Even if a particular application could be sped up by switching to fixed points, there are many reasons why people tend not to choose this option, not least because of the lack of awareness of fixed point numbers and because of the lack of available fixed point libraries.

Indeed, finding information about fixed point numbers can be quite a struggle.

## How Do Fixed Points Work?

Fixed point numbers are comprised of two parts, the integer part and the fractional part.
Each part takes up a set number of bits. For example, a common format (often called `Q8.8`) has `8` bits for the integer part and 8 bits for the fractional part.

The integer part stores the digits to the left of the radix point.
This part behaves exactly like a regular integer and for all intents and purposes can be imagined as one. If you understand how computers represent integers, you already understand the integer part.

For example, in the `Q8.8` format, there are `8` bits in the integer part, thus it is capable of holding `256` values. The values are `0` to `255` when unsigned or `-128` to `127` when signed and in two's complement format.

The fractional part stores the digits to the right of the radix point.
This part has special behaviour that can be a bit tricky to comprehend at first.
The simplest way to think of it is as a fraction.

For example in the `Q8.8` format, there are `8` bits for the fractional part, which means it is capable of holding `256` values.
When thought of as a fraction, the fractional part is treated as an unsigned integer, meaning it can hold values of `0` to `255`. This integer is then imagined as the numerator of a fraction in which the denominator is the number of possible values that can be held, i.e. `256`.

If the fractional part had the integer value of `64`, then its effective value can be represented as `64/256`, which would be equivalent to the decimal value of `0.25`.

As a more in depth example, consider a Q8.8 value where the integer part is `5` and the fractional part has an integer value of `37`. This can be thought of as a mixed fraction `5 37/256`.
Using a calculator to divide `37` by `256` you will find that `37/256 = 0.14453125`, which means that the number being represented is `5.14453125`.

## Further Reading

- Wikipedia's article about [Radix Points](https://en.wikipedia.org/wiki/Radix_point)
- Wikipedia's article about [Integers](https://en.wikipedia.org/wiki/Integer)
- Wikipedia's article about [Rational Numbers](https://en.wikipedia.org/wiki/Rational_number)
