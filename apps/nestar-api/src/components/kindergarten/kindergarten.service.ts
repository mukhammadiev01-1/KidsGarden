import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Kindergartens, Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	OwnerKindergartensInquiry,
	AllKindergartensInquiry,
	OrdinaryInquiry,
	KindergartensInquiry,
	KindergartenInput,
} from '../../libs/dto/kindergarten/kindergarten.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import moment from 'moment';
import { KindergartenUpdate } from '../../libs/dto/kindergarten/kindergarten.update';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';

@Injectable()
export class KindergartenService {
	constructor(
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
	) {}

	public async createKindergarten(input: KindergartenInput): Promise<Kindergarten> {
		try {
			const result = await this.kindergartenModel.create(input);
			await this.kindergartenStaffModel.create({
				kindergartenId: result._id,
				memberId: result.memberId,
				staffRole: StaffRole.OWNER,
				staffStatus: StaffStatus.ACTIVE,
			});
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberKindergartens',
				modifier: 1,
			});
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getKindergarten(memberId: ObjectId, kindergartenId: ObjectId): Promise<Kindergarten> {
		const search: T = {
			// search obyekti, bu yerda kindergartenId va kindergartenStatus ACTIVE bo'lgan mulkni qidirishini talab qilyabmiz
			_id: kindergartenId,
			kindergartenStatus: KindergartenStatus.ACTIVE,
		};

		const targetKindergarten: Kindergarten = await this.kindergartenModel.findOne(search).lean().exec(); //kindergartenschemamodel findone static methodini chaqitib o'zimiz yaratgan search objectini pass qilyabmiz. lean() methodi query natijasini plain JavaScript object sifatida qaytaradi, exec() methodi esa queryni bajaradi va natijani qaytaradi.
		if (!targetKindergarten) throw new InternalServerErrorException(Message.NO_DATA_FOUND); // agar targetKindergarten null bo'lsa InternalServerErrorException xatosi tashlanadi va Message.NO_DATA_FOUND xabarini beradi

		if (memberId) {
			//
			const viewInput = { memberId: memberId, viewRefId: kindergartenId, viewGroup: ViewGroup.KINDERGARTEN }; // viewInput obyekti, bu yerda memberId, viewRefId (kindergartenId) va viewGroup (KINDERGARTEN) ni o'z ichiga oladi
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.kindergartenStatsEditor({ _id: kindergartenId, targetKey: 'kindergartenViews', modifier: 1 });
				targetKindergarten.kindergartenViews++;
			}

			const likeInput = { memberId: memberId, likeRefId: kindergartenId, likeGroup: LikeGroup.KINDERGARTEN };
			targetKindergarten.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetKindergarten.memberData = await this.memberService.getMember(null, targetKindergarten.memberId); // targetKindergarten ga memberData ni qo'shadi, bu yerda memberService ning getMember metodini chaqiradi va targetKindergarten.memberId ni pass qilyabmiz, bu memberId asosida kindergarten egasi haqida ma'lumot olish uchun ishlatiladi
		return targetKindergarten;
	}

	public async updateKindergarten(memberId: ObjectId, input: KindergartenUpdate): Promise<Kindergarten> {
		const { kindergartenStatus } = input;
		const search: T = {
			// search obyekti, bu yerda _id, memberId va kindergartenStatus ACTIVE bo'lgan mulkni qidirishini talab qilyabmiz
			_id: input._id,
			memberId: memberId,
			kindergartenStatus: KindergartenStatus.ACTIVE,
		};

		if (kindergartenStatus === KindergartenStatus.DELETE) input.deletedAt = moment().toDate();

		const result = await this.kindergartenModel
			.findOneAndUpdate(search, input, {
				// findOneAndUpdate metodi, bu yerda search obyekti bilan mulk qidiradi va input obyekti bilan yangilaydi
				new: true, //yangilangan document ni qaytaradi, agar false bo'lsa eski document ni qaytaradi
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (kindergartenStatus === KindergartenStatus.SOLD || input.deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberKindergartens',
				modifier: -1,
			});
		}

		return result;
	}

	public async getKindergartens(memberId: ObjectId, input: KindergartensInquiry): Promise<Kindergartens> {
		const match: T = { kindergartenStatus: KindergartenStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		const result = await this.kindergartenModel
			.aggregate([
				{ $match: match }, //match obyekti bilan mulklarni filtrlash, bu yerda kindergartenStatus ACTIVE bo'lgan mulklarni qidiramiz va shapeMatchQuery metodi orqali match obyekti kerakli search kriteriyalariga ko'ra shakllantiriladi
				{ $sort: sort }, //sort obyekti bilan mulklarni tartiblash, bu yerda input dan sort va direction ni olamiz, agar input da sort yoki direction ko'rsatilmagan bo'lsa default qiymatlar sifatida createdAt va DESC ni ishlatamiz
				{
					$facet: {
						// $facet operatori, bu yerda list va metaCounter ni o'z ichiga olgan obyekti qaytaradi, list mulklarni pagination bilan qaytaradi va metaCounter esa total mulk sonini hisoblaydi
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId), // lookupAuthMemberLiked metodi, bu yerda memberId ni pass qilyabmiz, bu mulklarni like qilish imkoniyatini tekshirish uchun ishlatiladi, bu yerda memberId asosida mulklarni like qilgan yoki qilmaganligini tekshiradi va natijani meLiked field ga qo'shadi
							lookupMember,
							{ $unwind: '$memberData' }, // $unwind esa memberData ni array dan object ga o'zgartiradi
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND); // agar result arrayi bo'sh bo'lsa InternalServerErrorException xatosi tashlanadi va Message.NO_DATA_FOUND xabarini beradi

		return result[0];
	}

	private shapeMatchQuery(match: T, input: KindergartensInquiry): void {
		// shapeMatchQuery metodi, bu yerda match obyekti va input qabul qiladi, match obyekti input dan olingan search kriteriyalariga ko'ra shakllantiriladi
		const {
			memberId,
			locationList,
			programsList,
			ageRangeList,
			typeList,
			periodsRange,
			pricesRange,
			capacityRange,
			text,
		} = input.search; //

		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId); // agar memberId mavjud bo'lsa, match obyekti ichiga memberId ni MongoDB ObjectId formatida qo'shadi
		if (locationList) match.kindergartenLocation = { $in: locationList }; // agar locationList mavjud bo'lsa, match obyekti ichiga kindergartenLocation ni $in operatori bilan qo'shadi, bu yerda locationList ichidagi har qanday değere sahip kindergartenLocation ni qidiradi
		if (programsList) match.kindergartenPrograms = { $in: programsList }; // agar programsList mavjud bo'lsa, match obyekti ichiga kindergartenPrograms ni $in operatori bilan qo'shadi, bu yerda programsList ichidagi har qanday değere sahip kindergartenPrograms ni qidiradi
		if (ageRangeList) match.kindergartenAgeRange = { $in: ageRangeList }; // agar ageRangeList mavjud bo'lsa, match obyekti ichiga kindergartenAgeRange ni $in operatori bilan qo'shadi, bu yerda ageRangeList ichidagi har qanday değere sahip kindergartenAgeRange ni qidiradi
		if (typeList) match.kindergartenType = { $in: typeList }; // agar typeList mavjud bo'lsa, match obyekti ichiga kindergartenType ni $in operatori bilan qo'shadi, bu yerda typeList içindeki herhangi bir değere sahip kindergartenType ni qidiradi

		if (pricesRange) match.kindergartenPrice = { $gte: pricesRange.start, $lte: pricesRange.end }; // agar pricesRange mavjud bo'lsa, match obyekti ichiga kindergartenPrice ni $gte (greater than or equal) va $lte (less than or equal) operatorlari bilan qo'shadi, bu yerda kindergartenPrice ni pricesRange.start dan katta yoki teng va pricesRange.end dan kichik yoki teng qiymatlarda qidiradi
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (capacityRange) match.kindergartenCapacity = { $gte: capacityRange.start, $lte: capacityRange.end };

		if (text) match.kindergartenTitle = { $regex: new RegExp(text, 'i') };

	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Kindergartens> {
		return await this.likeService.getFavoriteKindergartens(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Kindergartens> {
		return await this.likeService.getFavoriteKindergartens(memberId, input);
	}

	public async getOwnerKindergartens(memberId: ObjectId, input: OwnerKindergartensInquiry): Promise<Kindergartens> {
		const { kindergartenStatus } = input.search;
		if (kindergartenStatus === KindergartenStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			kindergartenStatus: kindergartenStatus ?? { $ne: KindergartenStatus.DELETE },
		};

		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.kindergartenModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0]; //
	}

	public async likeTargetKindergarten(memberId: ObjectId, likeRefId: ObjectId): Promise<Kindergarten> {
		const target: Kindergarten = await this.kindergartenModel
			.findOne({ _id: likeRefId, kindergartenStatus: KindergartenStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.KINDERGARTEN,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.kindergartenStatsEditor({ _id: likeRefId, targetKey: 'kindergartenLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllKindergartensByAdmin(input: AllKindergartensInquiry): Promise<Kindergartens> {
		const { kindergartenStatus, kindergartenLocationList } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (kindergartenStatus) match.kindergartenStatus = kindergartenStatus;
		if (kindergartenLocationList) match.kindergartenLocation = { $in: kindergartenLocationList };

		const result = await this.kindergartenModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit }, // pagination uchun $skip operatori, bu yerda (input.page - 1) * input.limit ni skip qiladi, bu sayfa numarasına göre doğru kayıtları getirir
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateKindergartenByAdmin(input: KindergartenUpdate): Promise<Kindergarten> {
		let { kindergartenStatus, deletedAt } = input;
		const search: T = {
			_id: input._id,
			kindergartenStatus: KindergartenStatus.ACTIVE,
		};

		if (kindergartenStatus === KindergartenStatus.DELETE) {
			deletedAt = moment().toDate();
			input.deletedAt = deletedAt;
		}

		const result = await this.kindergartenModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (kindergartenStatus === KindergartenStatus.SOLD || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberKindergartens',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeKindergartenByAdmin(kindergartenId: ObjectId): Promise<Kindergarten> {
		const search: T = { _id: kindergartenId, kindergartenStatus: KindergartenStatus.DELETE };
		const result = await this.kindergartenModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async kindergartenStatsEditor(input: StatisticModifier): Promise<Kindergarten> {
		// kindergartenStatsEditor metodi, bu yerda kindergartenId, targetKey va modifier ni o'z ichiga olgan input qabul qiladi
		const { _id, targetKey, modifier } = input; //obejct destructuring orqali input dan _id, targetKey va modifier ni olish
		return await this.kindergartenModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } }, // $inc operatori, bu yerda targetKey ni modifier ga ko'paytiradi, bu kindergarten ning statistikasi (masalan, kindergartenViews) ni yangilash uchun ishlatiladi
				{
					new: true, //yangilangan document ni qaytaradi, agar false bo'lsa eski document ni qaytaradi
				},
			)
			.exec();
	}
}
