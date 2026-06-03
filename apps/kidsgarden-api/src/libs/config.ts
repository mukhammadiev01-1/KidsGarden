import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'bson';

export const availableKindergartenAdminSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];

export const availableKindergartenSorts = [
	'createdAt',
	'updatedAt',
	'kindergartenLikes',
	'kindergartenViews',
	'kindergartenRank',
	'kindergartenPrice',
	'monthlyFee',
];

export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];

/** IMAGE CONFIGURATION **/
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';
import { Message } from './enums/common.enum';
import { MemberStatus } from './enums/member.enum';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
export const validApplicationDocumentMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
export const maxApplicationDocuments = 5;
export const maxApplicationDocumentSize = 1 * 1024 * 1024;
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const escapeRegex = (text: string): string => {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const capPaginationLimit = (limit: number, maxLimit: number): number => {
	const numericLimit = Number(limit);
	if (!Number.isFinite(numericLimit)) return maxLimit;

	return Math.min(Math.max(numericLimit, 1), maxLimit);
};

export const shapeIntoMongoObjectId = (target: any) => {
	if (!target) throw new BadRequestException(Message.BAD_REQUEST);
	if (typeof target === 'string') {
		if (!ObjectId.isValid(target)) throw new BadRequestException(Message.BAD_REQUEST);
		return new ObjectId(target);
	}

	if (
		target instanceof ObjectId ||
		(typeof target === 'object' &&
			target?._bsontype === 'ObjectId' &&
			typeof target.toHexString === 'function' &&
			ObjectId.isValid(target.toHexString()))
	) {
		return target;
	}

	throw new BadRequestException(Message.BAD_REQUEST);
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
	//memberId T
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$likeRefId', '$$localLikeRefId'] }, { $eq: ['$memberId', '$$localMemberId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T;
	followingId: string;
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$followerId', '$$localFollowerId'] }, { $eq: ['$followingId', '$$localFollowingId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const publicMemberProjection = {
	_id: 1,
	memberNick: 1,
	memberImage: 1,
	memberFullName: 1,
	memberDesc: 1,
};

export const memberPreviewProjection = {
	_id: 1,
	memberNick: 1,
	memberFullName: 1,
	memberImage: 1,
	memberPhone: 1,
	memberType: 1,
	memberStatus: 1,
};

export const lookupPublicMember = {
	$lookup: {
		from: 'members',
		let: { localMemberId: '$memberId' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [{ $eq: ['$_id', '$$localMemberId'] }, { $eq: ['$memberStatus', MemberStatus.ACTIVE] }],
					},
				},
			},
			{ $project: publicMemberProjection },
		],
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupPublicFollowingData = {
	$lookup: {
		from: 'members',
		let: { localMemberId: '$followingId' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [{ $eq: ['$_id', '$$localMemberId'] }, { $eq: ['$memberStatus', MemberStatus.ACTIVE] }],
					},
				},
			},
			{ $project: publicMemberProjection },
		],
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupPublicFollowerData = {
	$lookup: {
		from: 'members',
		let: { localMemberId: '$followerId' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [{ $eq: ['$_id', '$$localMemberId'] }, { $eq: ['$memberStatus', MemberStatus.ACTIVE] }],
					},
				},
			},
			{ $project: publicMemberProjection },
		],
		as: 'followerData',
	},
};

export const lookupFavoriteKindergarten = {
	$lookup: {
		from: 'members',
		localField: 'favoriteKindergarten.memberId',
		foreignField: '_id',
		as: 'favoriteKindergarten.memberData',
	},
};

export const lookupPublicFavoriteKindergarten = {
	$lookup: {
		from: 'members',
		let: { localMemberId: '$favoriteKindergarten.memberId' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [{ $eq: ['$_id', '$$localMemberId'] }, { $eq: ['$memberStatus', MemberStatus.ACTIVE] }],
					},
				},
			},
			{ $project: publicMemberProjection },
		],
		as: 'favoriteKindergarten.memberData',
	},
};

export const lookupVisitedKindergarten = {
	$lookup: {
		from: 'members',
		localField: 'visitedKindergarten.memberId',
		foreignField: '_id',
		as: 'visitedKindergarten.memberData',
	},
};

export const lookupPublicVisitedKindergarten = {
	$lookup: {
		from: 'members',
		let: { localMemberId: '$visitedKindergarten.memberId' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [{ $eq: ['$_id', '$$localMemberId'] }, { $eq: ['$memberStatus', MemberStatus.ACTIVE] }],
					},
				},
			},
			{ $project: publicMemberProjection },
		],
		as: 'visitedKindergarten.memberData',
	},
};
