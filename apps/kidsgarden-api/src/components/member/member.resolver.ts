import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'; // GraphQL dekoratorlarini import qiladi
import { MemberService } from './member.service'; // member service business logic faylini import qiladi
import { BadRequestException, UseGuards } from '@nestjs/common'; // validation va error handling uchun import
import { KindergartenAdminsInquiry, LoginInput, MemberInput, MembersInquiry, PreviewKindergartenMemberInput } from '../../libs/dto/member/member.input'; // login va signup input dto larini import qiladi
import { Member, MemberPreview, Members, PublicMember, PublicMembers } from '../../libs/dto/member/member'; // Member return type dto ni import qiladi
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import {
	getSerialForImage,
	maxApplicationDocumentSize,
	maxApplicationDocuments,
	shapeIntoMongoObjectId,
	validApplicationDocumentMimeTypes,
	validMimeTypes,
} from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream, mkdirSync, unlinkSync } from 'fs';
import * as path from 'path';
import { Message } from '../../libs/enums/common.enum';
import { ApplicationDocument } from '../../libs/dto/application/application';


@Resolver() // bu class GraphQL resolver ekanini bildiradi
export class MemberResolver {
	private readonly allowedUploadTargets = new Set(['member', 'article', 'property', 'kindergarten']);
	private readonly applicationDocumentTarget = 'application';

	  constructor(private readonly memberService: MemberService) {} // service ni dependency injection orqali oladi

	private resolveUploadTarget(targetInput: String): string {
		const target = targetInput?.toString().trim();
		if (!target) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		let decodedTarget: string;
		try {
			decodedTarget = decodeURIComponent(target);
		} catch (err) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const hasPathTraversal =
			decodedTarget !== target ||
			target.includes('/') ||
			target.includes('\\') ||
			target.includes('..') ||
			path.isAbsolute(target);

		if (hasPathTraversal || !this.allowedUploadTargets.has(target)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		return target;
	}

	private buildUploadDestination(target: string, imageName: string): { url: string; filePath: string } {
		const uploadsRoot = path.resolve(process.cwd(), 'uploads');
		const targetDir = path.resolve(uploadsRoot, target);
		const filePath = path.resolve(targetDir, imageName);

		if (!this.isPathInside(uploadsRoot, targetDir) || !this.isPathInside(targetDir, filePath)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		mkdirSync(targetDir, { recursive: true });

		return {
			url: `uploads/${target}/${imageName}`,
			filePath,
		};
	}

	private isPathInside(parentPath: string, childPath: string): boolean {
		const relative = path.relative(parentPath, childPath);
		return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
	}

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
@Query(() => PublicMember)
public async getMember(
  @Args('memberId') input: string,
  @AuthMember('_id') memberId: ObjectId,
): Promise<PublicMember> {
  console.log('Query: getMember');
  const targetId = shapeIntoMongoObjectId(input);
  return await this.memberService.getMember(memberId, targetId);
}

@Roles(MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Query(() => PublicMembers)
public async getKindergartenAdmins(
  @Args('input') input: KindergartenAdminsInquiry,
  @AuthMember('_id') memberId: ObjectId,
): Promise<PublicMembers> {
  console.log('Query: getKindergartenAdmins');
  return await this.memberService.getKindergartenAdmins(memberId, input);
}

@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Query(() => MemberPreview)
public async previewKindergartenMember(
  @Args('input') input: PreviewKindergartenMemberInput,
  @AuthMember() authMember: Member,
): Promise<MemberPreview> {
  console.log('Query: previewKindergartenMember');
  return await this.memberService.previewKindergartenMember(authMember, input);
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
  @AuthMember() authMember: Member,
): Promise<Member> {
  console.log('Mutation: updateMemberByAdmin');
  return await this.memberService.updateMemberByAdmin(input, authMember);
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

		const safeTarget = this.resolveUploadTarget(target);
		const imageName = getSerialForImage(filename);
		const { url, filePath } = this.buildUploadDestination(safeTarget, imageName);
		const stream = createReadStream(); // createReadStream bu yerda file ni o'qish uchun stream yaratadi

		const result = await new Promise((resolve, reject) => { // file ni serverga upload qilish uchun promise yaratadi
			stream
				.pipe(createWriteStream(filePath))
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
		const safeTarget = this.resolveUploadTarget(target);
		const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<Promise<void>> => {
			try {
				const { filename, mimetype, createReadStream } = await img;

				const validMime = validMimeTypes.includes(mimetype);
				if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

				const imageName = getSerialForImage(filename);
				const { url, filePath } = this.buildUploadDestination(safeTarget, imageName);
				const stream = createReadStream();

				const result = await new Promise((resolve, reject) => {
					stream
						.pipe(createWriteStream(filePath))
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

@UseGuards(AuthGuard)
@Mutation(() => [ApplicationDocument])
	public async applicationDocumentsUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
	): Promise<ApplicationDocument[]> {
		console.log('Mutation: applicationDocumentsUploader');

		if (!Array.isArray(files) || !files.length || files.length > maxApplicationDocuments) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const uploadedDocuments: ApplicationDocument[] = [];
		const uploadedFilePaths: string[] = [];

		try {
			for (const file of files) {
				const { document, filePath } = await this.writeApplicationDocument(await file);
				uploadedDocuments.push(document);
				uploadedFilePaths.push(filePath);
			}

			return uploadedDocuments;
		} catch (err) {
			uploadedFilePaths.forEach((filePath) => {
				try {
					unlinkSync(filePath);
				} catch (cleanupErr) {
					console.log('Application document cleanup failed:', cleanupErr?.message);
				}
			});

			throw err;
		}
	}

	private async writeApplicationDocument(
		{ createReadStream, filename, mimetype }: FileUpload,
	): Promise<{ document: ApplicationDocument; filePath: string }> {
		if (!filename || !mimetype || typeof createReadStream !== 'function') {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		if (!validApplicationDocumentMimeTypes.includes(mimetype)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const fileName = getSerialForImage(filename);
		const { url, filePath } = this.buildUploadDestination(this.applicationDocumentTarget, fileName);
		let size = 0;

		try {
			await new Promise<void>((resolve, reject) => {
				const stream = createReadStream();
				const writeStream = createWriteStream(filePath);

				stream.on('data', (chunk: Buffer) => {
					size += chunk.length;
					if (size > maxApplicationDocumentSize) {
						stream.destroy();
						writeStream.destroy();
						reject(new BadRequestException(Message.BAD_REQUEST));
					}
				});
				stream.on('error', () => reject(new Error(Message.UPLOAD_FAILED)));
				writeStream.on('finish', () => resolve());
				writeStream.on('error', () => reject(new Error(Message.UPLOAD_FAILED)));

				stream.pipe(writeStream);
			});

			if (size <= 0 || size > maxApplicationDocumentSize) {
				throw new BadRequestException(Message.BAD_REQUEST);
			}

			return {
				document: {
					url,
					name: filename,
					mimeType: mimetype,
					size,
				},
				filePath,
			};
		} catch (err) {
			try {
				unlinkSync(filePath);
			} catch (cleanupErr) {
				console.log('Application document cleanup failed:', cleanupErr?.message);
			}

			if (err instanceof BadRequestException) throw err;
			throw new Error(Message.UPLOAD_FAILED);
		}
	}
}
