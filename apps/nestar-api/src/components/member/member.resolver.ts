import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'; // GraphQL dekoratorlarini import qiladi
import { MemberService } from './member.service'; // member service business logic faylini import qiladi
import { InternalServerErrorException, UseGuards} from '@nestjs/common'; // validation va error handling uchun import
import { KindergartenAdminsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input'; // login va signup input dto larini import qiladi
import { Member, Members } from '../../libs/dto/member/member'; // Member return type dto ni import qiladi
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream } from 'fs';
import { Message } from '../../libs/enums/common.enum';


@Resolver() // bu class GraphQL resolver ekanini bildiradi
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {} // service ni dependency injection orqali oladi

  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> { 
    console.log('Mutation: signup');
    return await this.memberService.signup(input);
  }

  @Mutation(() => Member)
  public async login(@Args('input') input: LoginInput): Promise<Member> {
    console.log('Mutation: login');
    return await this.memberService.login(input);
  }
  
@UseGuards(AuthGuard)
@Mutation(() => Member)
public async updateMember(
  @Args('input') input: MemberUpdate,
  @AuthMember('_id') memberId: ObjectId, // authMember dekoratori orqali memberId ni oladi
): Promise<Member> {
  console.log('Mutation: updateMember');
  delete input._id; // input dan _id ni o'chiradi, chunki memberId authMember dekoratori orqali olinadi
  return await this.memberService.updateMember(memberId, input); // member ma'lumotini service dan oladi
}

@UseGuards(AuthGuard)
@Query(() => String)
public async checkAuth(
  @AuthMember('memberNick') memberNick: string, // authMember dekoratori orqali memberNick ni oladi
): Promise<string> {
  console.log('Query: checkAuth');
  console.log('memberNick:', memberNick);

  return await `Hi ${memberNick}`;
}

@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Query(() => String)
public async checkAuthRoles(
  @AuthMember() authMember: Member,
): Promise<string> {
  console.log('Query: checkAuthRoles');

  return await `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
}

@UseGuards(WithoutGuard)
@Query(() => Member)
public async getMember(
  @Args('memberId') input: string,
  @AuthMember('_id') memberId: ObjectId,
): Promise<Member> {
  console.log('Query: getMember');
  const targetId = shapeIntoMongoObjectId(input);
  return await this.memberService.getMember(memberId, targetId);
}

@UseGuards(WithoutGuard) // without guard bu yerda ishlatilgan, chunki bu query ni auth qilmasdan ham ishlatish mumkin, lekin authMember dekoratori orqali memberId ni olish mumkin, agar auth qilinsa
@Query(() => Members) // getKindergartenAdmins query si kindergarten adminlarni olish uchun ishlatiladi, bu yerda auth qilmasdan
public async getKindergartenAdmins(
  @Args('input') input: KindergartenAdminsInquiry,
  @AuthMember('_id') memberId: ObjectId,
): Promise<Members> {
  console.log('Query: getKindergartenAdmins');
  return await this.memberService.getKindergartenAdmins(memberId, input);
}

@UseGuards(AuthGuard)
@Mutation(() => Member)
public async likeTargetMember(
  @Args('memberId') input: string,
  @AuthMember('_id') memberId: ObjectId,
): Promise<Member> {
  console.log('Mutation: likeTargetMember');
  const likeRefId = shapeIntoMongoObjectId(input);
  return await this.memberService.likeTargetMember(memberId, likeRefId);
}


/** SUPER_ADMIN **/

// Authorization: SUPER_ADMIN
@Roles(MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Query(() => Members)
public async getAllMembersByAdmin(
  @Args('input') input: MembersInquiry, //args orqali input ni oladi, bu input members ni filterlash uchun ishlatiladi
): Promise<Members> {
  return await this.memberService.getAllMembersByAdmin(input);
}

@Roles(MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Mutation(() => Member)
public async updateMemberByAdmin(
  @Args('input') input: MemberUpdate,
): Promise<Member> {
  console.log('Mutation: updateMemberByAdmin');
  return await this.memberService.updateMemberByAdmin(input);
}


 /* IMAGE UPLOADER (member.resolver.ts) */

@UseGuards(AuthGuard)
@Mutation((returns) => String)
public async imageUploader(
	@Args({ name: 'file', type: () => GraphQLUpload }) 
{ createReadStream, filename, mimetype }: FileUpload, 
@Args('target') target: String,
): Promise<string> {
	console.log('Mutation: imageUploader');

	if (!filename) throw new Error(Message.UPLOAD_FAILED); // filename bo'lmasa error beradi
const validMime = validMimeTypes.includes(mimetype); // validMimeTypes bu yerda ruxsat etilgan mime turlarini tekshiradi
if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT); // agar mime turi ruxsat etilgan formatlarda bo'lmasa error beradi

const imageName = getSerialForImage(filename); 
const url = `uploads/${target}/${imageName}`; 
const stream = createReadStream(); // createReadStream bu yerda file ni o'qish uchun stream yaratadi

const result = await new Promise((resolve, reject) => { // file ni serverga upload qilish uchun promise yaratadi
	stream
		.pipe(createWriteStream(url))
		.on('finish', async () => resolve(true))
		.on('error', () => reject(false));
});
if (!result) throw new Error(Message.UPLOAD_FAILED);

return url;
}

@UseGuards(AuthGuard)
@Mutation((returns) => [String])
public async imagesUploader(
	@Args('files', { type: () => [GraphQLUpload] })
files: Promise<FileUpload>[],
@Args('target') target: String,
): Promise<string[]> {
	console.log('Mutation: imagesUploader');

	const uploadedImages = [];
	const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<Promise<void>> => {
		try {
			const { filename, mimetype, encoding, createReadStream } = await img;

			const validMime = validMimeTypes.includes(mimetype);
			if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

			const imageName = getSerialForImage(filename);
			const url = `uploads/${target}/${imageName}`;
			const stream = createReadStream();

			const result = await new Promise((resolve, reject) => {
				stream
					.pipe(createWriteStream(url))
					.on('finish', () => resolve(true))
					.on('error', () => reject(false));
			});
			if (!result) throw new Error(Message.UPLOAD_FAILED);

			uploadedImages[index] = url;
		} catch (err) {
			console.log('Error, file missing!');
		}
	});

	await Promise.all(promisedList);
	return uploadedImages;
}
}

