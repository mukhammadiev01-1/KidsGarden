import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'; // NestJS exception va service dekoratorlarini import qiladi
import { InjectModel } from '@nestjs/mongoose'; // Mongoose modelni inject qilish uchun import
import { Model, ObjectId } from 'mongoose'; // Mongoose Model type ni import qiladi
import { Member, Members } from '../../libs/dto/member/member'; // Member dto type ni import qiladi
import { KindergartenAdminsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input'; // signup va login input dto larni import qiladi
import { Direction, Message } from '../../libs/enums/common.enum'; // umumiy message enum larni import qiladi
import { MemberStatus, MemberType } from '../../libs/enums/member.enum'; // member status enum larni import qiladi
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { lookupAuthMemberLiked } from '../../libs/config';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private authService: AuthService,
		private viewService: ViewService,
		private likeService: LikeService,
	) {}

	public async signup(input: MemberInput): Promise<Member> {
		if (input.memberType && input.memberType !== MemberType.PARENT) {
			throw new BadRequestException('Public signup allows only PARENT role');
		}

		input.memberType = MemberType.PARENT;
		input.memberPassword = await this.authService.hashPassword(input.memberPassword);

		try {
			const result = await this.memberModel.create(input);
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = input;
		const response: Member = await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword);
		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

		delete response.memberPassword;
		response.accessToken = await this.authService.createToken(response);

		return response;
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		const result: Member = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberStatus: MemberStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPLOAD_FAILED);

		result.accessToken = await this.authService.createToken(result);

		return result;
	}

	public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK], //$in op
			},
		};

		const targetMember = await this.memberModel.findOne(search).lean().exec(); // leans bu yerda ishlatilgan, chunki bu query faqat o'qish uchun ishlatiladi va bizga mongoose document emas, balki oddiy JavaScript object kerak, shuning uchun lean() methodi ishlatiladi
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
			const newView = await this.viewService.recordView(viewInput);

			if (newView) {
				await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();

				targetMember.memberViews++;
			}

			const likeInput = { memberId: memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
			targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

			targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
		}

		return targetMember;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel.findOne({ followingId: followingId, followerId: followerId }).exec();
		return result ? [{ followerId: followerId, followingId: followingId, myFollowing: true }] : [];
	}

	public async getKindergartenAdmins(memberId: ObjectId, input: KindergartenAdminsInquiry): Promise<Members> {
		const { text } = input.search;

		const match: T = { memberType: MemberType.KINDERGARTEN_ADMIN, memberStatus: MemberStatus.ACTIVE };
		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC };

		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match:', match);

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId), // lookupAuthMemberLiked metodi, bu yerda memberId ni pass qilyabmiz, bu mulklarni like qilish imkoniyatini tekshirish uchun ishlatiladi, bu yerda memberId asosida mulklarni like qilgan yoki qilmaganligini tekshiradi va natijani meLiked field ga qo'shadi
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target: Member = await this.memberModel.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE });
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		// LIKE TOGGLE via Like modules
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({ _id: likeRefId, targetKey: 'memberLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;

		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (memberStatus) match.memberStatus = memberStatus; // memberStatus ga ko'ra filterlash, agar memberStatus bo'lsa match obyektiga memberStatus ni qo'shadi
		if (memberType) match.memberType = memberType; // memberType ga ko'ra filterlash, agar memberType bo'lsa match obyektiga memberType ni qo'shadi
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') }; // memberNick ni text ga regex orqali tekshiradi, 'i' flagi case-insensitive qidiruvni ta'minlaydi, ya'ni katta-kichik harflarga e'tibor bermaydi

		console.log('match:', match);

		const result = await this.memberModel
			.aggregate([
				// bizga memberlarni filterlash, sortlash va pagination qilish kerak, aggregate pipeline orqali bu operatsiyalarni bajarish osonroq va samaraliroq bo'ladi
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						// $facet stage ni ishlatish orqali pagination va total count ni bir vaqtda olish mumkin bo'ladi, chunki $facet ichida har bir stage o'z ishini bajaradi va natijani alohida array sifatida qaytaradi
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], // pagination uchun $skip va $limit stage larini ishlatadi, bu yerda page va limit ni input dan oladi, skip stage ni ishlatish orqali kerakli sahifaga o'tish mumkin bo'ladi, limit stage ni ishlatish orqali har bir sahifada nechta member ko'rsatilishini belgilaydi
						metaCounter: [{ $count: 'total' }], // total count ni olish uchun $count stage ni ishlatadi, bu yerda total deb nomlangan field da jami memberlar soni saqlanadi, bu metaCounter array ichida bo'ladi va bizga pagination uchun kerak bo'ladi, chunki frontend da jami sahifalar sonini hisoblash uchun total count kerak bo'ladi
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0]; // aggregate natijasi har doim array bo'ladi, bizga esa list va metaCounter kerak, shuning uchun result[0] ni qaytaramiz, bu yerda result[0].list va result[0].metaCounter mavjud bo'ladi
	}

	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const result: Member = await this.memberModel.findOneAndUpdate({ _id: input._id }, input, { new: true }).exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		// method article, comment, view va boshqa statslarni yangilash uchun ishlatiladi, bu yerda input da _id, targetKey va modifier mavjud bo'ladi, _id bu memberning _id si, targetKey bu yangilanishi kerak bo'lgan field nomi (masalan: memberArticles, memberComments, memberViews), modifier bu yangilanish qiymati (masalan: 1 yoki -1)
		const { _id, targetKey, modifier } = input;

		return await this.memberModel
			.findByIdAndUpdate(
				_id,
				{
					$inc: { [targetKey]: modifier },
				},
				{ new: true },
			)
			.exec();
	}
}
