import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { KindergartenService } from './kindergarten.service';
import { KindergartenAddressLocation, Kindergartens, Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import {
	OwnerKindergartensInquiry,
	AllKindergartensInquiry,
	OrdinaryInquiry,
	KindergartensInquiry,
	KindergartenInput,
	NearbyKindergartensInput,
	NearbyKindergartensByAddressInput,
} from '../../libs/dto/kindergarten/kindergarten.input';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { KindergartenUpdate } from '../../libs/dto/kindergarten/kindergarten.update';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver(() => Kindergarten)
export class KindergartenResolver {
	constructor(private readonly kindergartenService: KindergartenService) {}

	@ResolveField(() => Number, { name: 'monthlyFee' })
	public resolveMonthlyFee(@Parent() kindergarten: Kindergarten): number {
		return kindergarten.kindergartenPrice;
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN) // createKindergarten mutation faqat kindergarten adminlar uchun mavjud
	@UseGuards(RolesGuard) //bu yerda RolesGuard foydalanuvchining roli MemberType.KINDERGARTEN_ADMIN ekanligini tekshiradi
	@Mutation(() => Kindergarten) // yangi mulk yaratish uchun kerakli input qabul qilinadi va natija sifatida yaratilgan mulk qaytariladi
	public async createKindergarten(
		// createKindergarten GraphQL mutation ni aniqlaydi, bu yerda kindergarten adminlar yangi mulk yaratishi mumkin
		@Args('input') input: KindergartenInput, // createKindergarten mutation uchun kerakli inputni qabul qiladi, bu yerda KindergartenInput mulk yaratish uchun kerakli ma'lumotlarni o'z ichiga oladi
		@AuthMember('_id') memberId: ObjectId, // AuthMember dekoratori orqali foydalanuvchining _id sini olish, bu yerda memberId mulk yaratishda mulk egasini aniqlash uchun ishlatiladi
	): Promise<Kindergarten> {
		console.log('Mutation: createKindergarten');
		input.memberId = memberId; // input ga memberId ni qo'shadi
		return await this.kindergartenService.createKindergarten(input);
	}

	@UseGuards(WithoutGuard) // getKindergarten query uchun auth guard ni o'chiradi, bu yerda har kim mulk haqida ma'lumot olishi mumkin
	@Query((returns) => Kindergarten) //kindergarten haqida ma'lumot olish uchun kerakli input qabul qilinadi va natija sifatida kindergarten qaytariladi
	public async getKindergarten(
		@Args('kindergartenId') input: string, // qaysi kindergarten haqida ma'lumot olish kerakligini aniqlash uchun kindergartenId ni qabul qiladi, input string
		@AuthMember('_id') memberId: ObjectId, // Authenticated foydalanuvchining _id sini olish, aks holda null MemberId qabul qiladi
	): Promise<Kindergarten> {
		// promise sifatida Kindergarten qaytaradi, bu yerda kindergarten haqida ma'lumotni o'z ichiga oladi
		console.log('Query: getKindergarten');
		const kindergartenId = shapeIntoMongoObjectId(input);
		return await this.kindergartenService.getKindergarten(memberId, kindergartenId);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN)
	@UseGuards(RolesGuard) // RolesGuard foydalanuvchining roli MemberType.KINDERGARTEN_ADMIN ekanligini tekshiradi
	@Mutation((returns) => Kindergarten)
	public async updateKindergarten(
		@Args('input') input: KindergartenUpdate,
		@AuthMember('_id') memberId: ObjectId, //  memberId mulkni yangilashda mulk egasini aniqlash uchun ishlatiladi
	): Promise<Kindergarten> {
		console.log('Mutation: updateKindergarten');
		input._id = shapeIntoMongoObjectId(input._id); // inputdagi _id ni stringdan MongoDB ObjectId formatiga o'zgartiradi
		return await this.kindergartenService.updateKindergarten(memberId, input); // kindergartenService (instance)ning updateKindergarten metodini chaqiradi
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Kindergartens)
	public async getKindergartens(
		@Args('input') input: KindergartensInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getKindergartens');
		return await this.kindergartenService.getKindergartens(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Kindergartens)
	public async getNearbyKindergartens(
		@Args('input') input: NearbyKindergartensInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getNearbyKindergartens');
		return await this.kindergartenService.getNearbyKindergartens(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Kindergartens)
	public async getNearbyKindergartensByAddress(
		@Args('input') input: NearbyKindergartensByAddressInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getNearbyKindergartensByAddress');
		return await this.kindergartenService.getNearbyKindergartensByAddress(memberId, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => KindergartenAddressLocation)
	public async geocodeKindergartenAddress(@Args('address') address: string): Promise<KindergartenAddressLocation> {
		console.log('Query: geocodeKindergartenAddress');
		return await this.kindergartenService.geocodeKindergartenAddress(address);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Kindergartens)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getFavorites');
		return await this.kindergartenService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Kindergartens)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getVisited');
		return await this.kindergartenService.getVisited(memberId, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Kindergartens)
	public async getOwnerKindergartens(
		@Args('input') input: OwnerKindergartensInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getOwnerKindergartens');
		return await this.kindergartenService.getOwnerKindergartens(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Kindergarten)
	public async likeTargetKindergarten(
		@Args('kindergartenId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergarten> {
		console.log('Mutation: likeTargetKindergarten');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.kindergartenService.likeTargetKindergarten(memberId, likeRefId);
	}

	/** SUPER_ADMIN **/
	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Kindergartens)
	public async getAllKindergartensByAdmin(
		@Args('input') input: AllKindergartensInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Kindergartens> {
		console.log('Query: getAllKindergartensByAdmin');
		return await this.kindergartenService.getAllKindergartensByAdmin(input);
	}

	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Kindergarten)
	public async updateKindergartenByAdmin(@Args('input') input: KindergartenUpdate): Promise<Kindergarten> {
		console.log('Mutation: updateKindergartenByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.kindergartenService.updateKindergartenByAdmin(input);
	}

	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Kindergarten)
	public async removeKindergartenByAdmin(@Args('kindergartenId') input: string): Promise<Kindergarten> {
		console.log('Mutation: removeKindergartenByAdmin');
		const kindergartenId = shapeIntoMongoObjectId(input);
		return await this.kindergartenService.removeKindergartenByAdmin(kindergartenId);
	}
}
