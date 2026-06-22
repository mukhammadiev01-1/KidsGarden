import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, ObjectId } from 'mongoose';
import { Kindergartens, Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	OwnerKindergartensInquiry,
	AllKindergartensInquiry,
	OrdinaryInquiry,
	KindergartensInquiry,
	KindergartenInput,
	NearbyKindergartensInput,
	NearbyKindergartensByAddressInput,
} from '../../libs/dto/kindergarten/kindergarten.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { KindergartenStatus, KindergartenType } from '../../libs/enums/kindergarten.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import moment from 'moment';
import { KindergartenUpdate } from '../../libs/dto/kindergarten/kindergarten.update';
import {
	capPaginationLimit,
	escapeRegex,
	lookupAuthMemberLiked,
	lookupPublicMember,
	shapeIntoMongoObjectId,
} from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { Member } from '../../libs/dto/member/member';
import {
	buildKindergartenGeoLocation,
	KindergartenGeoLocation,
} from '../../libs/utils/kindergarten-geo-location.util';
import { NaverMapsService } from './services/naver-maps.service';

interface MonthlyFeeCompatibleInput {
	kindergartenPrice?: number;
	monthlyFee?: number;
}

interface KindergartenCoordinateCompatibleInput {
	kindergartenLatitude?: number;
	kindergartenLongitude?: number;
	kindergartenAddress?: string;
	kindergartenGeoLocation?: KindergartenGeoLocation;
}

interface KindergartenEnumCompatibleInput {
	kindergartenType?: KindergartenType;
	kindergartenStatus?: KindergartenStatus;
}

const legacyKindergartenTypeAliases: Partial<Record<KindergartenType, KindergartenType>> = {
	[KindergartenType.APARTMENT]: KindergartenType.PRIVATE_KINDERGARTEN,
	[KindergartenType.VILLA]: KindergartenType.PUBLIC_KINDERGARTEN,
	[KindergartenType.HOUSE]: KindergartenType.DAYCARE_CENTER,
};

const kindergartenTypeFilterAliases: Partial<Record<KindergartenType, KindergartenType[]>> = {
	[KindergartenType.PRIVATE_KINDERGARTEN]: [KindergartenType.PRIVATE_KINDERGARTEN, KindergartenType.APARTMENT],
	[KindergartenType.APARTMENT]: [KindergartenType.PRIVATE_KINDERGARTEN, KindergartenType.APARTMENT],
	[KindergartenType.PUBLIC_KINDERGARTEN]: [KindergartenType.PUBLIC_KINDERGARTEN, KindergartenType.VILLA],
	[KindergartenType.VILLA]: [KindergartenType.PUBLIC_KINDERGARTEN, KindergartenType.VILLA],
	[KindergartenType.DAYCARE_CENTER]: [KindergartenType.DAYCARE_CENTER, KindergartenType.HOUSE],
	[KindergartenType.HOUSE]: [KindergartenType.DAYCARE_CENTER, KindergartenType.HOUSE],
};

const legacyKindergartenStatusAliases: Partial<Record<KindergartenStatus, KindergartenStatus>> = {
	[KindergartenStatus.SOLD]: KindergartenStatus.CLOSED,
};

const kindergartenStatusFilterAliases: Partial<Record<KindergartenStatus, KindergartenStatus[]>> = {
	[KindergartenStatus.CLOSED]: [KindergartenStatus.CLOSED, KindergartenStatus.SOLD],
	[KindergartenStatus.SOLD]: [KindergartenStatus.CLOSED, KindergartenStatus.SOLD],
};

@Injectable()
export class KindergartenService {
	private readonly publicKindergartenListMaxLimit = 50;
	private readonly nearbyKindergartenListMaxLimit = 20;
	private readonly nearbyDefaultRadiusMeters = 5000;
	private readonly nearbyMaxRadiusMeters = 30000;
	private readonly nearbyAddressMaxLength = 200;
	private readonly ownerKindergartenListMaxLimit = 100;
	private readonly adminKindergartenListMaxLimit = 100;

	constructor(
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectConnection() private readonly connection: Connection,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private naverMapsService: NaverMapsService,
	) {}

	public async createKindergarten(input: KindergartenInput): Promise<Kindergarten> {
		const normalizedInput = await this.prepareKindergartenLocationInput(
			this.normalizeKindergartenEnums(this.normalizeMonthlyFeeInput({ ...input }, { requireFee: true })),
		);
		const session = await this.connection.startSession();

		try {
			const result = await session.withTransaction(async () => {
				const [kindergarten] = await this.kindergartenModel.create([normalizedInput], { session });
				await this.kindergartenStaffModel.create(
					[
						{
							kindergartenId: kindergarten._id,
							memberId: kindergarten.memberId,
							staffRole: StaffRole.OWNER,
							staffStatus: StaffStatus.ACTIVE,
						},
					],
					{ session },
				);
				const updatedMember = await this.memberModel
					.findByIdAndUpdate(
						kindergarten.memberId,
						{ $inc: { memberKindergartens: 1 } },
						{
							new: true,
							session,
						},
					)
					.exec();
				if (!updatedMember) throw new InternalServerErrorException(Message.UPDATE_FAILED);

				return kindergarten;
			});

			if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		} finally {
			await session.endSession();
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
		const normalizedInput = await this.prepareKindergartenLocationInput(
			this.normalizeKindergartenEnums(this.normalizeMonthlyFeeInput({ ...input }, { requireFee: false })),
		);
		const { kindergartenStatus } = normalizedInput;
		const search: T = {
			// search obyekti, bu yerda _id, memberId va kindergartenStatus ACTIVE bo'lgan mulkni qidirishini talab qilyabmiz
			_id: normalizedInput._id,
			memberId: memberId,
			kindergartenStatus: KindergartenStatus.ACTIVE,
		};

		if (kindergartenStatus === KindergartenStatus.DELETE) normalizedInput.deletedAt = moment().toDate();

		const result = await this.kindergartenModel
			.findOneAndUpdate(search, normalizedInput, {
				// findOneAndUpdate metodi, bu yerda search obyekti bilan mulk qidiradi va input obyekti bilan yangilaydi
				new: true, //yangilangan document ni qaytaradi, agar false bo'lsa eski document ni qaytaradi
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (this.isClosedKindergartenStatus(kindergartenStatus) || normalizedInput.deletedAt) {
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
		const sort: T = { [this.getKindergartenSortField(input?.sort)]: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.publicKindergartenListMaxLimit);

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
							{ $skip: (input.page - 1) * limit },
							{ $limit: limit },
							lookupAuthMemberLiked(memberId), // lookupAuthMemberLiked metodi, bu yerda memberId ni pass qilyabmiz, bu mulklarni like qilish imkoniyatini tekshirish uchun ishlatiladi, bu yerda memberId asosida mulklarni like qilgan yoki qilmaganligini tekshiradi va natijani meLiked field ga qo'shadi
							lookupPublicMember,
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

	public async getNearbyKindergartens(memberId: ObjectId, input: NearbyKindergartensInput): Promise<Kindergartens> {
		const latitude = Number(input.latitude);
		const longitude = Number(input.longitude);
		const radiusMeters = this.normalizeNearbyRadius(input.radiusMeters);

		this.validateNearbyCoordinates(latitude, longitude);
		return await this.getNearbyKindergartensByCoordinates(memberId, latitude, longitude, radiusMeters);
	}

	public async getNearbyKindergartensByAddress(
		memberId: ObjectId,
		input: NearbyKindergartensByAddressInput,
	): Promise<Kindergartens> {
		const address = this.normalizeNearbyAddress(input.address);
		const radiusMeters = this.normalizeNearbyRadius(input.radiusMeters);
		const geocodedAddress = await this.naverMapsService.geocodeAddress(address);

		if (!geocodedAddress) return { list: [], metaCounter: [] };

		this.validateNearbyCoordinates(geocodedAddress.latitude, geocodedAddress.longitude);
		return await this.getNearbyKindergartensByCoordinates(
			memberId,
			geocodedAddress.latitude,
			geocodedAddress.longitude,
			radiusMeters,
		);
	}

	private async getNearbyKindergartensByCoordinates(
		memberId: ObjectId,
		latitude: number,
		longitude: number,
		radiusMeters: number,
	): Promise<Kindergartens> {
		const result = await this.kindergartenModel
			.aggregate([
				{
					$geoNear: {
						near: {
							type: 'Point',
							coordinates: [longitude, latitude],
						},
						key: 'kindergartenGeoLocation',
						distanceField: 'distanceMeters',
						maxDistance: radiusMeters,
						spherical: true,
						query: {
							kindergartenStatus: KindergartenStatus.ACTIVE,
							kindergartenGeoLocation: { $exists: true, $ne: null },
							'kindergartenGeoLocation.type': 'Point',
						},
					},
				},
				{ $sort: { distanceMeters: 1 } },
				{
					$facet: {
						list: [
							{ $limit: this.nearbyKindergartenListMaxLimit },
							lookupAuthMemberLiked(memberId),
							lookupPublicMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0] ?? { list: [], metaCounter: [] };
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
			monthlyFeeRange,
			capacityRange,
			text,
		} = input.search; //
		const feeRange = monthlyFeeRange ?? pricesRange;

		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId); // agar memberId mavjud bo'lsa, match obyekti ichiga memberId ni MongoDB ObjectId formatida qo'shadi
		if (locationList) match.kindergartenLocation = { $in: locationList }; // agar locationList mavjud bo'lsa, match obyekti ichiga kindergartenLocation ni $in operatori bilan qo'shadi, bu yerda locationList ichidagi har qanday değere sahip kindergartenLocation ni qidiradi
		if (programsList) match.kindergartenPrograms = { $in: programsList }; // agar programsList mavjud bo'lsa, match obyekti ichiga kindergartenPrograms ni $in operatori bilan qo'shadi, bu yerda programsList ichidagi har qanday değere sahip kindergartenPrograms ni qidiradi
		if (ageRangeList) match.kindergartenAgeRange = { $in: ageRangeList }; // agar ageRangeList mavjud bo'lsa, match obyekti ichiga kindergartenAgeRange ni $in operatori bilan qo'shadi, bu yerda ageRangeList ichidagi har qanday değere sahip kindergartenAgeRange ni qidiradi
		if (typeList) match.kindergartenType = { $in: this.expandKindergartenTypeFilter(typeList) }; // agar typeList mavjud bo'lsa, match obyekti ichiga kindergartenType ni $in operatori bilan qo'shadi, bu yerda typeList içindeki herhangi bir değere sahip kindergartenType ni qidiradi

		if (feeRange) match.kindergartenPrice = { $gte: feeRange.start, $lte: feeRange.end }; // agar fee range mavjud bo'lsa, match obyekti ichiga kindergartenPrice ni $gte (greater than or equal) va $lte (less than or equal) operatorlari bilan qo'shadi
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (capacityRange) match.kindergartenCapacity = { $gte: capacityRange.start, $lte: capacityRange.end };

		if (text) match.kindergartenTitle = { $regex: new RegExp(escapeRegex(text), 'i') };
	}

	private validateNearbyCoordinates(latitude: number, longitude: number): void {
		if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private normalizeNearbyRadius(radiusMeters?: number): number {
		if (radiusMeters === undefined || radiusMeters === null) return this.nearbyDefaultRadiusMeters;

		const normalizedRadius = Number(radiusMeters);
		if (!Number.isFinite(normalizedRadius) || normalizedRadius <= 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		return Math.min(normalizedRadius, this.nearbyMaxRadiusMeters);
	}

	private normalizeNearbyAddress(address: string): string {
		const normalizedAddress = address?.trim();

		if (!normalizedAddress || normalizedAddress.length > this.nearbyAddressMaxLength) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		return normalizedAddress;
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Kindergartens> {
		return await this.likeService.getFavoriteKindergartens(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Kindergartens> {
		return await this.viewService.getVisitedKindergartens(memberId, input);
	}

	public async getOwnerKindergartens(memberId: ObjectId, input: OwnerKindergartensInquiry): Promise<Kindergartens> {
		const { kindergartenStatus } = input.search;
		if (kindergartenStatus === KindergartenStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			kindergartenStatus: this.shapeKindergartenStatusFilter(kindergartenStatus),
		};

		const sort: T = { [this.getKindergartenSortField(input?.sort)]: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.ownerKindergartenListMaxLimit);

		const result = await this.kindergartenModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * limit },
							{ $limit: limit },
							lookupPublicMember,
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
		const sort: T = { [this.getKindergartenSortField(input?.sort)]: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.adminKindergartenListMaxLimit);
		const skip = (input.page - 1) * limit;

		if (kindergartenStatus) match.kindergartenStatus = this.shapeKindergartenStatusFilter(kindergartenStatus);
		if (kindergartenLocationList) match.kindergartenLocation = { $in: kindergartenLocationList };

		const result = await this.kindergartenModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: skip }, // pagination uchun $skip operatori, bu yerda (input.page - 1) * input.limit ni skip qiladi, bu sayfa numarasına göre doğru kayıtları getirir
							{ $limit: limit },
							lookupPublicMember,
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
		const { kindergartenStatus, deletedAt } = this.shapeAdminKindergartenUpdateInput(input);
		const search: T = {
			_id: input._id,
			kindergartenStatus: KindergartenStatus.ACTIVE,
		};

		const update: Partial<KindergartenUpdate> = { kindergartenStatus };
		if (deletedAt) update.deletedAt = deletedAt;

		const result = await this.kindergartenModel
			.findOneAndUpdate(search, update, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (this.isClosedKindergartenStatus(kindergartenStatus) || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberKindergartens',
				modifier: -1,
			});
		}

		return result;
	}

	private shapeAdminKindergartenUpdateInput(input: KindergartenUpdate): Partial<KindergartenUpdate> {
		const allowedFields: (keyof KindergartenUpdate)[] = ['kindergartenStatus'];
		const allowedFieldSet = new Set<string>(allowedFields);
		const inputKeys = Object.keys(input).filter((key) => key !== '_id');
		const blockedFields = inputKeys.filter((key) => !allowedFieldSet.has(key));

		if (blockedFields.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (!input.kindergartenStatus) throw new BadRequestException(Message.BAD_REQUEST);
		if (!Object.values(KindergartenStatus).includes(input.kindergartenStatus)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const kindergartenStatus = this.normalizeKindergartenStatus(input.kindergartenStatus);
		if (!kindergartenStatus) throw new BadRequestException(Message.BAD_REQUEST);
		const update: Partial<KindergartenUpdate> = { kindergartenStatus };

		if (kindergartenStatus === KindergartenStatus.DELETE) {
			update.deletedAt = moment().toDate();
		}

		return update;
	}

	private normalizeKindergartenEnums<TInput extends KindergartenEnumCompatibleInput>(input: TInput): TInput {
		const kindergartenType = this.normalizeKindergartenType(input.kindergartenType);
		const kindergartenStatus = this.normalizeKindergartenStatus(input.kindergartenStatus);

		if (kindergartenType) input.kindergartenType = kindergartenType;
		if (kindergartenStatus) input.kindergartenStatus = kindergartenStatus;

		return input;
	}

	private normalizeKindergartenType(kindergartenType?: KindergartenType): KindergartenType | undefined {
		if (!kindergartenType) return undefined;
		return legacyKindergartenTypeAliases[kindergartenType] ?? kindergartenType;
	}

	private normalizeKindergartenStatus(kindergartenStatus?: KindergartenStatus): KindergartenStatus | undefined {
		if (!kindergartenStatus) return undefined;
		return legacyKindergartenStatusAliases[kindergartenStatus] ?? kindergartenStatus;
	}

	private expandKindergartenTypeFilter(typeList: KindergartenType[]): KindergartenType[] {
		return Array.from(
			new Set(typeList.flatMap((kindergartenType) => kindergartenTypeFilterAliases[kindergartenType] ?? [kindergartenType])),
		);
	}

	private shapeKindergartenStatusFilter(kindergartenStatus?: KindergartenStatus): KindergartenStatus | T {
		if (!kindergartenStatus) return { $ne: KindergartenStatus.DELETE };

		const normalizedStatus = this.normalizeKindergartenStatus(kindergartenStatus) ?? kindergartenStatus;
		const statusAliases = kindergartenStatusFilterAliases[kindergartenStatus] ?? kindergartenStatusFilterAliases[normalizedStatus];

		return statusAliases ? { $in: statusAliases } : normalizedStatus;
	}

	private isClosedKindergartenStatus(kindergartenStatus?: KindergartenStatus): boolean {
		return kindergartenStatus === KindergartenStatus.CLOSED || kindergartenStatus === KindergartenStatus.SOLD;
	}

	private normalizeMonthlyFeeInput<T extends MonthlyFeeCompatibleInput>(
		input: T,
		options: { requireFee: boolean },
	): T {
		const hasMonthlyFee = input.monthlyFee !== undefined && input.monthlyFee !== null;
		const hasKindergartenPrice = input.kindergartenPrice !== undefined && input.kindergartenPrice !== null;

		if (hasMonthlyFee && hasKindergartenPrice && input.monthlyFee !== input.kindergartenPrice) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if (hasMonthlyFee && !hasKindergartenPrice) input.kindergartenPrice = input.monthlyFee;
		if (options.requireFee && (input.kindergartenPrice === undefined || input.kindergartenPrice === null)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		delete input.monthlyFee;
		return input;
	}

	private async prepareKindergartenLocationInput<T extends KindergartenCoordinateCompatibleInput>(input: T): Promise<T> {
		const directGeoLocation = buildKindergartenGeoLocation(input.kindergartenLatitude, input.kindergartenLongitude);
		if (directGeoLocation) {
			input.kindergartenGeoLocation = directGeoLocation;
			return input;
		}

		if (!input.kindergartenAddress) return input;

		const geocodedAddress = await this.naverMapsService.geocodeAddress(input.kindergartenAddress);
		if (!geocodedAddress) return input;

		const geocodedGeoLocation = buildKindergartenGeoLocation(geocodedAddress.latitude, geocodedAddress.longitude);
		if (!geocodedGeoLocation) return input;

		input.kindergartenLatitude = geocodedAddress.latitude;
		input.kindergartenLongitude = geocodedAddress.longitude;
		input.kindergartenGeoLocation = geocodedGeoLocation;
		return input;
	}

	private getKindergartenSortField(sort?: string): string {
		return sort === 'monthlyFee' ? 'kindergartenPrice' : sort ?? 'createdAt';
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
