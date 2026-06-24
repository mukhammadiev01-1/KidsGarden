import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';
import { PublicMember, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';
import type { KindergartenGeoLocation } from '../../utils/kindergarten-geo-location.util';

@ObjectType()
export class Kindergarten {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => KindergartenType)
	kindergartenType: KindergartenType;

	@Field(() => KindergartenStatus)
	kindergartenStatus: KindergartenStatus;

	@Field(() => KindergartenLocation)
	kindergartenLocation: KindergartenLocation;

	@Field(() => String)
	kindergartenAddress: string;

	@Field(() => Number, { nullable: true })
	kindergartenLatitude?: number;

	@Field(() => Number, { nullable: true })
	kindergartenLongitude?: number;

	kindergartenGeoLocation?: KindergartenGeoLocation;

	@Field(() => String)
	kindergartenTitle: string;

	@Field(() => Number)
	kindergartenPrice: number;

	@Field(() => Number)
	kindergartenCapacity: number;

	@Field(() => Int)
	kindergartenAgeRange: number;

	@Field(() => Int)
	kindergartenPrograms: number;

	@Field(() => Int)
	kindergartenViews: number;

	@Field(() => Int)
	kindergartenLikes: number;

	@Field(() => Int)
	kindergartenComments: number;

	@Field(() => Int)
	kindergartenRank: number;

	@Field(() => [String])
	kindergartenImages: string[];

	@Field(() => String, { nullable: true })
	kindergartenDesc: string;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	establishedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/
	@Field(() => PublicMember, { nullable: true })
	memberData?: PublicMember;

	/** from aggregation **/
	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	/** from nearby aggregation **/
	@Field(() => Number, { nullable: true })
	distanceMeters?: number;
}

@ObjectType()
export class Kindergartens {
	@Field(() => [Kindergarten])
	list: Kindergarten[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];

	@Field(() => Number, { nullable: true })
	searchCenterLatitude?: number;

	@Field(() => Number, { nullable: true })
	searchCenterLongitude?: number;

	@Field(() => String, { nullable: true })
	searchAddress?: string;

	@Field(() => String, { nullable: true })
	resolvedAddress?: string;
}

@ObjectType()
export class KindergartenAddressLocation {
	@Field(() => String)
	address: string;

	@Field(() => String, { nullable: true })
	roadAddress?: string;

	@Field(() => String, { nullable: true })
	jibunAddress?: string;

	@Field(() => Number)
	latitude: number;

	@Field(() => Number)
	longitude: number;
}
