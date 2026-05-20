import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Follower, Followers, Following, Followings } from '../../libs/dto/follow/follow';
import { MemberService } from '../member/member.service';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	lookupAuthMemberFollowed,
	lookupAuthMemberLiked,
	capPaginationLimit,
	lookupPublicFollowerData,
	lookupPublicFollowingData,
} from '../../libs/config';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { T } from '../../libs/types/common';

@Injectable()
export class FollowService {
	private readonly followListMaxLimit = 50;

	constructor(
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private readonly memberService: MemberService,
	) {}

	public async subscribe(followerId: ObjectId, followingId: ObjectId): Promise<Follower> {
		if (followerId.toString() === followingId.toString()) {
			// o'ziga obuna bo'lishga ruxsat berilmaydi //string ga aylantirib tekshirish kerak, chunki ObjectId larni to'g'ridan-to'g'ri tenglashtirish noto'g'ri natija beradi // ObjectId('123') === ObjectId('123') // false, chunki bu yerda ikkita alohida obyekt yaratiladi va ular xotirada turli joylarda saqlanadi, shuning uchun ular teng emas deb hisoblanadi
			throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);
		}

		const targetMember = await this.memberService.getMember(null, followingId);
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const result = await this.registerSubscription(followerId, followingId);

		await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: 1 });
		await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers', modifier: 1 });

		return result;
	}

	private async registerSubscription(followerId: ObjectId, followingId: ObjectId): Promise<Follower> {
		try {
			return await this.followModel.create({
				followingId: followingId,
				followerId: followerId,
			});
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async unsubscribe(followerId: ObjectId, followingId: ObjectId): Promise<Follower> {
		const targetMember = await this.memberService.getMember(null, followingId);
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const result = await this.followModel.findOneAndDelete({
			followingId: followingId,
			followerId: followerId,
		});
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: -1 });
		await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers', modifier: -1 });

		return result;
	}

	public async getMemberFollowings(memberId: ObjectId, input: FollowInquiry): Promise<Followings> {
		const { page, limit, search } = input; // destructing input object to get page, limit and search parameters
		const cappedLimit = capPaginationLimit(limit, this.followListMaxLimit);
		if (!search?.followerId) throw new InternalServerErrorException(Message.BAD_REQUEST);
		const match: T = { followerId: search?.followerId }; // followerId bo'yicha obunalarni qidirish uchun match obyekti yaratamiz, bu MongoDB aggregate pipeline da ishlatiladi
		console.log('match:', match);

		const result = await this.followModel
			.aggregate([
				//aggragation pipeline boshlayabmiz
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } }, // obunalarni yaratish vaqtiga ko'ra kamayish tartibida sort qilamiz, ya'ni eng yangi obunalar birinchi bo'ladi
				{
					$facet: {
						// facet operatori bilan ikkita parallel pipeline yaratamiz, biri list uchun, ikkinchisi metaCounter uchun
						list: [
							{ $skip: (page - 1) * cappedLimit }, // masalan agar page 2 bo'lsa va limit 10 bo'lsa, biz birinchi 10 obunani o'tkazib yuboramiz va keyingi 10 obunani olamiz
							{ $limit: cappedLimit }, // limit ga muvofiq obunalarni cheklaymiz, masalan limit 10 bo'lsa, faqat 10 obunani olamiz
							lookupAuthMemberLiked(memberId, '$followingId'), // lookupAuthMemberLiked metodi, bu yerda memberId ni pass qilyabmiz, bu mulklarni like qilish imkoniyatini tekshirish uchun ishlatiladi, bu yerda memberId asosida mulklarni like qilgan yoki qilmaganligini tekshiradi va natijani meLiked field ga qo'shadi
							lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followingId' }), // followerId chunki
							lookupPublicFollowingData,
							{ $unwind: '$followingData' }, //array into object
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getMemberFollowers(memberId: ObjectId, input: FollowInquiry): Promise<Followers> {
		const { page, limit, search } = input;
		const cappedLimit = capPaginationLimit(limit, this.followListMaxLimit);
		if (!search?.followingId) throw new InternalServerErrorException(Message.BAD_REQUEST);

		const match: T = { followingId: search?.followingId };
		console.log('match:', match);

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * cappedLimit },
							{ $limit: cappedLimit },
							lookupAuthMemberLiked(memberId, '$followerId'), // lookupAuthMemberLiked metodi, bu yerda memberId ni pass qilyabmiz, bu mulklarni like qilish imkoniyatini tekshirish uchun ishlatiladi, bu yerda memberId asosida mulklarni like qilgan yoki qilmaganligini tekshiradi va natijani meLiked field ga qo'shadi
							lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followerId' }), //
							lookupPublicFollowerData,
							{ $unwind: '$followerData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
