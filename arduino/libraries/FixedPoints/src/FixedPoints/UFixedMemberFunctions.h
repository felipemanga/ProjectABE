// Copyright 2017 Pharap
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

FIXED_POINTS_BEGIN_NAMESPACE

//
// Constructors
//

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction>::UFixed(void)
	: Base()
{
}

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction>::UFixed(const IntegerType & integer)
	: Base(RawType(static_cast<InternalType>(integer) << FractionSize))
{
}

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction>::UFixed(const IntegerType & integer, const FractionType & fraction)
	: Base(RawType((static_cast<InternalType>(integer) << FractionSize) | fraction))
{
}

//
// Getters
//

template< unsigned Integer, unsigned Fraction >
constexpr typename UFixed<Integer, Fraction>::InternalType UFixed<Integer, Fraction>::getInternal(void) const
{
	return this->value;
}

template< unsigned Integer, unsigned Fraction >
constexpr typename UFixed<Integer, Fraction>::IntegerType UFixed<Integer, Fraction>::getInteger(void) const
{
	return static_cast<IntegerType>(this->value >> IntegerShift) & IntegerMask;
}

template< unsigned Integer, unsigned Fraction >
constexpr typename UFixed<Integer, Fraction>::FractionType UFixed<Integer, Fraction>::getFraction(void) const
{
	return static_cast<FractionType>(this->value >> FractionShift) & FractionMask;
}

//
// Cast Operators
//

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction>::operator IntegerType(void) const
{
	return this->getInteger();
}

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction>::operator float(void) const
{
	return ((this->value & IdentityMask) * (1.0f / Scale));
}

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction>::operator double(void) const
{
	return ((this->value & IdentityMask) * (1.0 / Scale));
}

template< unsigned Integer, unsigned Fraction >
template< unsigned IntegerOut, unsigned FractionOut >
constexpr UFixed<Integer, Fraction>::operator UFixed<IntegerOut, FractionOut>(void) const
{
	using OutputType = UFixed<IntegerOut, FractionOut>;
	using OutputInternalType = typename OutputType::InternalType;
	using OutputShiftType = typename OutputType::ShiftType;
	
	using InputType = UFixed<Integer, Fraction>;
	using InputShiftType = typename InputType::ShiftType;
	
	return
	(FractionOut > FractionSize) ?
		OutputType::fromInternal(static_cast<OutputInternalType>(static_cast<OutputShiftType>(this->value) << ((FractionOut > FractionSize) ? (FractionOut - FractionSize) : 0))) :
	(FractionSize > FractionOut) ?
		OutputType::fromInternal(static_cast<OutputInternalType>(static_cast<InputShiftType>(this->value) >> ((FractionSize > FractionOut) ? (FractionSize - FractionOut) : 0))) :
		OutputType::fromInternal(this->value);
}

//
// Static Functions
//

template< unsigned Integer, unsigned Fraction >
constexpr UFixed<Integer, Fraction> UFixed<Integer, Fraction>::fromInternal(const typename UFixed<Integer, Fraction>::InternalType & value)
{
	return UFixed<Integer, Fraction>(RawType(value));
}

//
// Member Operators
//

template< unsigned Integer, unsigned Fraction >
UFixed<Integer, Fraction> & UFixed<Integer, Fraction>::operator ++(void)
{
	this->value += (1 << FractionSize);
	return *this;
}

template< unsigned Integer, unsigned Fraction >
UFixed<Integer, Fraction> & UFixed<Integer, Fraction>::operator --(void)
{
	this->value -= (1 << FractionSize);
	return *this;
}

//
// Compound Assignment Operators
//

template< unsigned Integer, unsigned Fraction >
UFixed<Integer, Fraction> & UFixed<Integer, Fraction>::operator +=(const UFixed<Integer, Fraction> & other)
{
	this->value += other.value;
	return *this;
}

template< unsigned Integer, unsigned Fraction >
UFixed<Integer, Fraction> & UFixed<Integer, Fraction>::operator -=(const UFixed<Integer, Fraction> & other)
{
	this->value -= other.value;
	return *this;
}

template< unsigned Integer, unsigned Fraction >
UFixed<Integer, Fraction> & UFixed<Integer, Fraction>::operator *=(const UFixed<Integer, Fraction> & other)
{
	using InternalType = typename UFixed<Integer, Fraction>::InternalType;
	using PrecisionType = typename UFixed<Integer * 2, Fraction * 2>::InternalType;
	const PrecisionType temp = (static_cast<PrecisionType>(this->value) * static_cast<PrecisionType>(other.value)) >> FractionSize;
	this->value = static_cast<InternalType>(temp);
	return *this;
}

template< unsigned Integer, unsigned Fraction >
UFixed<Integer, Fraction> & UFixed<Integer, Fraction>::operator /=(const UFixed<Integer, Fraction> & other)
{
	using InternalType = typename UFixed<Integer, Fraction>::InternalType;
	using PrecisionType = typename UFixed<Integer * 2, Fraction * 2>::InternalType;
	const PrecisionType temp = (static_cast<PrecisionType>(this->value) << FractionSize) / static_cast<PrecisionType>(other.value);
	this->value = static_cast<InternalType>(temp);
	return *this;
}

FIXED_POINTS_END_NAMESPACE