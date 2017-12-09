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

FIXED_POINTS_BEGIN_NAMESPACE
namespace FIXED_POINTS_DETAILS
{
	template< unsigned Integer, unsigned Fraction >
	class UFixedBase
	{
	public:
		using IntegerType = FIXED_POINTS_DETAILS::LeastInt<Integer + 1>;
		using FractionType = FIXED_POINTS_DETAILS::LeastUInt<Fraction>;
		using InternalType = FIXED_POINTS_DETAILS::LeastUInt<Integer + Fraction>;

		constexpr const static unsigned long long Scale = 1ULL << Fraction;

	protected:
		class RawType
		{
		private:
			const InternalType value;

		public:
			constexpr inline explicit RawType(const InternalType & value) : value(value) {}
			constexpr inline explicit operator InternalType(void) const { return this->value; }
		};

	protected:
		InternalType value;

		constexpr UFixedBase(void) : value(0) {}
		constexpr UFixedBase(const RawType & value) : value(static_cast<InternalType>(value)) {}

	public:
		constexpr UFixedBase(const IntegerLiteral & value)
			: value(static_cast<InternalType>(static_cast< LargerType<IntegerLiteral, InternalType> >(value) << Fraction)) {}
			
		constexpr UFixedBase(const IntegerLiteralU & value)
			: value(static_cast<InternalType>(static_cast< LargerType<IntegerLiteralU, InternalType> >(value) << Fraction)) {}
			
		constexpr UFixedBase(const IntegerLiteralL & value)
			: value(static_cast<InternalType>(static_cast< LargerType<IntegerLiteralL, InternalType> >(value) << Fraction)) {}
			
		constexpr UFixedBase(const IntegerLiteralUL & value)
			: value(static_cast<InternalType>(static_cast< LargerType<IntegerLiteralUL, InternalType>>(value) << Fraction)) {}
			
		constexpr UFixedBase(const IntegerLiteralLL & value)
			: value(static_cast<InternalType>(static_cast< LargerType<IntegerLiteralLL, InternalType>>(value) << Fraction)) {}
			
		constexpr UFixedBase(const IntegerLiteralULL & value)
			: value(static_cast<InternalType>(static_cast< LargerType<IntegerLiteralULL, InternalType> >(value) << Fraction)) {}
			
		constexpr UFixedBase(const DecimalLiteral & value)
			: value(static_cast<InternalType>(value * Scale)) {}
			
		constexpr UFixedBase(const DecimalLiteralF & value)
			: value(static_cast<InternalType>(value * Scale)) {}
			
		constexpr UFixedBase(const DecimalLiteralL & value)
			: value(static_cast<InternalType>(value * Scale)) {}
	};
}
FIXED_POINTS_END_NAMESPACE