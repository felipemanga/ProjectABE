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

#pragma once

#include "Details.h"
#include "SFixedBase.h"

FIXED_POINTS_BEGIN_NAMESPACE

//
// Declaration
//

template< unsigned Integer, unsigned Fraction >
class SFixed : FIXED_POINTS_DETAILS::SFixedBase< Integer, Fraction >
{
public:
	static_assert(((Integer + 1) + Fraction) <= FIXED_POINTS_DETAILS::BitSize<intmax_t>::Value, "Platform does not have a native type large enough for SFixed.");

public:
	using IntegerType = FIXED_POINTS_DETAILS::LeastInt<Integer + 1>;
	using FractionType = FIXED_POINTS_DETAILS::LeastUInt<Fraction>;
	using InternalType = FIXED_POINTS_DETAILS::LeastInt<(Integer + 1) + Fraction>;
	
	using ShiftType = FIXED_POINTS_DETAILS::LeastUInt<(Integer + 1) + Fraction>;
	using MaskType = FIXED_POINTS_DETAILS::LeastUInt<(Integer + 1) + Fraction>;

	constexpr const static unsigned IntegerSize = Integer + 1;
	constexpr const static unsigned FractionSize = Fraction;
	constexpr const static unsigned LogicalSize = IntegerSize + FractionSize;
	constexpr const static unsigned InternalSize = FIXED_POINTS_DETAILS::BitSize<InternalType>::Value;	
	
	constexpr const static unsigned long long Scale = 1ULL << FractionSize;
	
public:
	constexpr const static ShiftType IntegerShift = FractionSize;
	constexpr const static ShiftType FractionShift = 0;
	
	constexpr const static MaskType IntegerMask = FIXED_POINTS_DETAILS::IdentityMask<IntegerSize>::Value;
	constexpr const static MaskType FractionMask = FIXED_POINTS_DETAILS::IdentityMask<FractionSize>::Value;
	
	constexpr const static MaskType IdentityMask = (IntegerMask << IntegerShift) | (FractionMask << FractionShift);
	
	constexpr const static MaskType MidpointMask = FIXED_POINTS_DETAILS::MsbMask<FractionSize>::Value;
	constexpr const static MaskType LesserMidpointMask = MidpointMask - 1;
	
private:
	using Base = FIXED_POINTS_DETAILS::SFixedBase<Integer, Fraction>;
	using RawType = typename Base::RawType;

public:
	using Base::Base;

	constexpr SFixed(void);
	constexpr SFixed(const IntegerType & integer);
	constexpr SFixed(const IntegerType & integer, const FractionType & fraction);

	constexpr InternalType getInternal(void) const;
	constexpr IntegerType getInteger(void) const;
	constexpr FractionType getFraction(void) const;

	constexpr explicit operator IntegerType(void) const;
	constexpr explicit operator float(void) const;
	constexpr explicit operator double(void) const;

	template< unsigned IntegerOut, unsigned FractionOut >
	constexpr explicit operator SFixed<IntegerOut, FractionOut>(void) const;

	constexpr static SFixed fromInternal(const InternalType & value);

	constexpr SFixed operator -(void) const;
	SFixed & operator ++(void);
	SFixed & operator --(void);
	SFixed & operator +=(const SFixed & other);
	SFixed & operator -=(const SFixed & other);
	SFixed & operator *=(const SFixed & other);
	SFixed & operator /=(const SFixed & other);
	
public:
	constexpr const static SFixed Epsilon = SFixed::fromInternal(1);
	constexpr const static SFixed MinValue = SFixed::fromInternal(FIXED_POINTS_DETAILS::MsbMask<InternalSize>::Value);
	constexpr const static SFixed MaxValue = SFixed::fromInternal(~FIXED_POINTS_DETAILS::MsbMask<InternalSize>::Value);
	
	// 40 digits is probably enough for these
	constexpr const static SFixed Pi = 3.1415926535897932384626433832795028841971;
	constexpr const static SFixed E = 2.718281828459045235360287471352662497757;
	constexpr const static SFixed Phi = 1.6180339887498948482045868343656381177203;
	constexpr const static SFixed Tau = 6.2831853071795864769252867665590057683943;
};


//
// Free functions
//

template< unsigned Integer, unsigned Fraction >
constexpr SFixed<Integer * 2, Fraction * 2> multiply(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

//
// Basic Logic Operations
//

template< unsigned Integer, unsigned Fraction >
constexpr bool operator ==(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr bool operator !=(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr bool operator <(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr bool operator >(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr bool operator <=(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr bool operator >=(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

//
// Inter-size Logic Operations
//

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr bool operator ==(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right);

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr bool operator !=(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right);

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr bool operator <(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right);

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr bool operator >(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right);

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr bool operator <=(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right);

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr bool operator >=(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right);

//
// Basic Arithmetic Operations
//

template< unsigned Integer, unsigned Fraction >
constexpr SFixed<Integer, Fraction> operator +(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr SFixed<Integer, Fraction> operator -(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr SFixed<Integer, Fraction> operator *(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

template< unsigned Integer, unsigned Fraction >
constexpr SFixed<Integer, Fraction> operator /(const SFixed<Integer, Fraction> & left, const SFixed<Integer, Fraction> & right);

//
// Inter-size Arithmetic Operations
//

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr auto operator +(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right)
	-> FIXED_POINTS_DETAILS::LargerType< SFixed<IntegerLeft, FractionLeft>, SFixed<IntegerRight, FractionRight> >;

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr auto operator -(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right)
	-> FIXED_POINTS_DETAILS::LargerType< SFixed<IntegerLeft, FractionLeft>, SFixed<IntegerRight, FractionRight> >;

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
constexpr auto operator *(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right)
	-> FIXED_POINTS_DETAILS::LargerType< SFixed<IntegerLeft, FractionLeft>, SFixed<IntegerRight, FractionRight> >;

template< unsigned IntegerLeft, unsigned FractionLeft, unsigned IntegerRight, unsigned FractionRight >
inline constexpr auto operator /(const SFixed<IntegerLeft, FractionLeft> & left, const SFixed<IntegerRight, FractionRight> & right)
	-> FIXED_POINTS_DETAILS::LargerType< SFixed<IntegerLeft, FractionLeft>, SFixed<IntegerRight, FractionRight> >;
	
FIXED_POINTS_END_NAMESPACE

#include "SFixedMemberFunctions.h"
#include "SFixedFreeFunctions.h"