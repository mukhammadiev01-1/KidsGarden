import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';
import type { ObjectId } from 'mongoose';
import { availableKindergartenSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class KindergartenInput {
	@IsNotEmpty()
	@Field(() => KindergartenType)
	kindergartenType: KindergartenType;

	@IsNotEmpty()
	@Field(() => KindergartenLocation)
	kindergartenLocation: KindergartenLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	kindergartenAddress: string;

	@IsOptional()
	@Min(-90)
	@Max(90)
	@Field(() => Number, { nullable: true })
	kindergartenLatitude?: number;

	@IsOptional()
	@Min(-180)
	@Max(180)
	@Field(() => Number, { nullable: true })
	kindergartenLongitude?: number;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	kindergartenTitle: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	kindergartenPrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	monthlyFee?: number;

	@IsNotEmpty()
	@Field(() => Number)
	kindergartenCapacity: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	kindergartenAgeRange: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	kindergartenPrograms: number;

	@IsNotEmpty()
	@Field(() => [String])
	kindergartenImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	kindergartenDesc?: string;

	memberId?: ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	establishedAt?: Date;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class CapacityRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class PISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [KindergartenLocation], { nullable: true })
	locationList?: KindergartenLocation[];

	@IsOptional()
	@Field(() => [KindergartenType], { nullable: true })
	typeList?: KindergartenType[];

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	programsList?: Number[];

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	ageRangeList?: Number[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	monthlyFeeRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => CapacityRange, { nullable: true })
	capacityRange?: CapacityRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class KindergartensInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableKindergartenSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
export class NearbyKindergartensInput {
	@IsNotEmpty()
	@IsNumber()
	@Min(-90)
	@Max(90)
	@Field(() => Number)
	latitude: number;

	@IsNotEmpty()
	@IsNumber()
	@Min(-180)
	@Max(180)
	@Field(() => Number)
	longitude: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(30000)
	@Field(() => Number, { nullable: true })
	radiusMeters?: number;
}

@InputType()
export class NearbyKindergartensByAddressInput {
	@IsNotEmpty()
	@IsString()
	@Length(1, 200)
	@Field(() => String)
	address: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(30000)
	@Field(() => Number, { nullable: true })
	radiusMeters?: number;
}

@InputType()
class APISearch {
	@IsOptional()
	@Field(() => KindergartenStatus, { nullable: true })
	kindergartenStatus?: KindergartenStatus;
}

@InputType()
export class OwnerKindergartensInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableKindergartenSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search: APISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => KindergartenStatus, { nullable: true })
	kindergartenStatus?: KindergartenStatus;

	@IsOptional()
	@Field(() => [KindergartenLocation], { nullable: true })
	kindergartenLocationList?: KindergartenLocation[];
}

@InputType()
export class AllKindergartensInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableKindergartenSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
