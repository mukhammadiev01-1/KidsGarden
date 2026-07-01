import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import {
	AllBoardArticlesInquiry,
	BoardArticleInput,
	BoardArticlesInquiry,
} from '../../libs/dto/board-article/board-article.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { BoardArticleCategory, BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { lookupAuthMemberLiked, lookupPublicMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { NotificationTargetType, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BoardArticleService {
	private readonly publicBoardArticleListMaxLimit = 50;
	private readonly adminBoardArticleListMaxLimit = 100;

	constructor(
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
		private readonly notificationService: NotificationService,
	) {}

	public async createBoardArticle(authMember: Member, input: BoardArticleInput): Promise<BoardArticle> {
		this.validateBoardArticleCreatePermission(authMember, input.articleCategory);
		input.memberId = authMember._id; // inputni memberIdsini kirib kelgan memberId bilan tenglashtiramiz, shunda article kim tomonidan yozilganini bilib olamiz
		try {
			const result = await this.boardArticleModel.create(input); //boardArticleschema modelimizni create static methodidan foydalanib yangi article yaratamiz va natijani kuttirib result ga tenglashtiramiz
			await this.memberService.memberStatsEditor({
				//memberService instancedan foydalanib memberStatsEditor methodidan foyadalanyabmiz
				_id: authMember._id, // qaysi memberning statsini o'zgartirmoqchi ekanligimizni memberId orqali belgilaymiz
				targetKey: 'memberArticles', // member schema ichida memberArticles degan field bor, biz shuni targetKey qilib beramiz, shunda memberStatsEditor methodi bilib oladiki memberArticles fieldini o'zgartirmoqchi
				modifier: 1, // memberArticles fieldi number tipida va har safar yangi article yaratilganda 1 ga oshishi kerak, shuning uchun modifierga 1 beramiz, agar article o'chirilsa bu field 1 ga kamayishi kerak bo'ladi, shunda modifierga -1 beramiz
			});

			return result;
		} catch (err) {
			// validationga xatolik yuzaga kelganda biz bu xatolikni konsolga chiqaramiz va frontendga CREATE_FAILED xabarini yuboramiz
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBoardArticle(memberId: ObjectId, articleId: ObjectId): Promise<BoardArticle> {
		const search: T = {
			//searrchiing object hosil qilyabmiz
			_id: articleId, //biz ko'rmoqchi bo'lgan article ni id sini search objectiga "_id" keysi orqali beramiz
			articleStatus: BoardArticleStatus.ACTIVE, //foyadalanuvchilar faqat ACTIVE statusdagi articlelarni ko'ra olishi kerak
			articleCategory: { $in: [BoardArticleCategory.FREE, BoardArticleCategory.NEWS] },
		};

		const targetBoardArticle: BoardArticle = await this.boardArticleModel.findOne(search).lean().exec(); //boardArticleSchemaModelni static findOne methodini chaqiramiz va unga search objectini beramiz, lean() methodi query natijasini plain javascript objectiga o'zgartiradi, va execution qilyabmiz.
		if (!targetBoardArticle) throw new InternalServerErrorException(Message.NO_DATA_FOUND); //xato bo'lsa, ya'ni bunday article topilmasa, biz frontendga NO_DATA_FOUND xabarini yuboramiz

		if (memberId) {
			//agar user auth bo'lgan bo'lsa, biz unga article ni ko'rsatishdan oldin view ni record qilamiz, shunda biz article ni nechta marta ko'rilganini bilib olamiz
			const viewInput = { memberId: memberId, viewRefId: articleId, viewGroup: ViewGroup.ARTICLE };
			const newView = await this.viewService.recordView(viewInput); //viewService instance dan recordView methodini chaqiramiz va unga viewInput ni argument sifatida beramiz, natijani kuttiramiz va newView ga tenglashtiramiz, agar newView true bo'lsa, ya'ni bu user bu article ni ilgari ko'rmagan bo'lsa, biz article ning view countini 1 ga oshiramiz
			if (newView) {
				await this.boardArticleStatsEditor({ _id: articleId, targetKey: 'articleViews', modifier: 1 }); //unga articleId, targetKey sifatida articleViews va modifier sifatida 1 beramiz, shunda article ning view counti 1 ga oshadi
				targetBoardArticle.articleViews++; //bu qatorni yozishimiz kerak, chunki agar biz yangilangan view countni darhol qaytarmoqchi bo'lsak, biz yangilangan view countni database dan qaytarib olishimiz kerak bo'ladi, bu esa qo'shimcha query degani, shuning uchun biz oldindan targetBoardArticle ning articleViews fieldini 1 ga oshirib qo'yamiz, shunda biz yangilangan view countni darhol qaytara olamiz
			}

			const likeInput = { memberId: memberId, likeRefId: articleId, likeGroup: LikeGroup.ARTICLE };
			targetBoardArticle.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetBoardArticle.memberData = await this.memberService.getMember(null, targetBoardArticle.memberId); //
		return targetBoardArticle;
	}

	public async updateBoardArticle(memberId: ObjectId, input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input; //destruction qilyabmiz
		const update = this.shapeOwnerBoardArticleUpdate(input);

		const result = await this.boardArticleModel
			.findOneAndUpdate({ _id: _id, memberId: memberId, articleStatus: BoardArticleStatus.ACTIVE, articleCategory: BoardArticleCategory.FREE }, update, {
				//3 ta argument pass qilyabmiz. Id va u murojaatchini ID si bilan va articleStatus ACTIVE bo'lishi shart //input bu biz o'zgartirmoqchi bo'lgan fieldlar va ularning yangi qiymatlari
				new: true, //yangilangan documentni qaytaradi
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (articleStatus === BoardArticleStatus.DELETE) {
			await this.memberService.memberStatsEditor({
				// memberni statsni minusga o'zgartiramiz, chunki article o'chirilgan bo'ladi
				_id: memberId,
				targetKey: 'memberArticles',
				modifier: -1,
			});
		}

		return result;
	}

	public async getBoardArticles(memberId: ObjectId, input: BoardArticlesInquiry): Promise<BoardArticles> {
		const { articleCategory, text } = input.search; //destruction qilyabmiz
		const limit = Math.min(input.limit, this.publicBoardArticleListMaxLimit);
		const match: T = {
			articleStatus: BoardArticleStatus.ACTIVE,
			articleCategory: { $in: [BoardArticleCategory.FREE, BoardArticleCategory.NEWS] },
		}; //mathc qilyabmiz, bunda articleStatus ACTIVE bo'lishi kerak
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC }; // standard sort qilyabmiz agar frontend dan sort va direction kelmasa, createdAt ga qarab DESC sort qilyabmiz

		if (articleCategory) {
			if (![BoardArticleCategory.FREE, BoardArticleCategory.NEWS].includes(articleCategory)) {
				throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
			}
			match.articleCategory = articleCategory;
		} //articleCategory talab qilinsa, match objectiga articleCategory ni ham qo'shamiz
		if (text?.trim()) match.articleTitle = { $regex: new RegExp(this.escapeRegex(text.trim()), 'i') }; // text bo'lsa regex orqali articleTitle da text bor-yo'qligini tekshiramiz, 'i' flagi case-insensitive qilyapti, ya'ni katta-kichik harflarga e'tibor bermay tekshiradi
		if (input.search?.memberId) {
			// aynan bir memberning articlelarini ko'rsatish kerak bo'lsa, match objectiga memberId ni ham qo'shamiz, lekin frontend dan kelgan memberId ni MongoDB ning ObjectId tipiga o'zgartiramiz, chunki database da memberId lar ObjectId tipida saqlanadi
			match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}
		console.log('match:', match);

		const result = await this.boardArticleModel //boardArticleSchemaModelimizni static aggregate methodini chaqiramiz, pipeline ni argument sifatida beramiz
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * limit }, //list orqali pagination qilyabmiz
							{ $limit: limit },
								lookupAuthMemberLiked(memberId), // lookupAuthMemberLiked metodi, bu yerda memberId ni pass qilyabmiz, bu mulklarni like qilish imkoniyatini tekshirish uchun ishlatiladi, bu yerda memberId asosida mulklarni like qilgan yoki qilmaganligini tekshiradi va natijani meLiked field ga qo'shadi
								lookupPublicMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }], //metacounter orqali total sonini qaytaryabmiz
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND); //agar natija bo'sh bo'lsa, ya'ni bunday article lar topilmasa, biz frontendga NO_DATA_FOUND xabarini yuboramiz

		return result[0];
	}

	public async likeTargetBoardArticle(memberId: ObjectId, likeRefId: ObjectId): Promise<BoardArticle> {
		const target: BoardArticle = await this.boardArticleModel
			.findOne({ _id: likeRefId, articleStatus: BoardArticleStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.ARTICLE,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.boardArticleStatsEditor({
			_id: likeRefId,
			targetKey: 'articleLikes',
			modifier: modifier,
		});

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		if (modifier > 0) {
			void this.reserveBoardArticleLikedHook(target, memberId).catch((err) => {
				console.log('Board article like notification hook failed:', err.message);
			});
		}
		return result;
	}

	public async getAllBoardArticlesByAdmin(input: AllBoardArticlesInquiry): Promise<BoardArticles> {
		const { articleStatus, articleCategory } = input.search; //destruction qilyabmiz
		const limit = Math.min(input.limit, this.adminBoardArticleListMaxLimit);
		const match: T = {}; //searching object hosil qilyabmiz
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC }; // standard sort qilyabmiz, agar frontend dan sort va direction kelmasa, createdAt ga qarab DESC sort qilyabmiz

		if (articleStatus) match.articleStatus = articleStatus; //aynan bir statusdagi article larni ko'rsatish kerak bo'lsa, match objectiga articleStatus ni ham qo'shamiz
		if (articleCategory) match.articleCategory = articleCategory; //ayan bir categorydagi article larni ko'rsatish kerak bo'lsa, match objectiga articleCategory ni ham qo'shamiz

		const result = await this.boardArticleModel //boardArticleSchemaModelimizni static aggregate methodini chaqiramiz, pipeline ni argument sifatida beramiz
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						//list orqali pagination qilyabmiz va metaCounter orqali total sonini qaytaryabmiz */
						list: [
							{ $skip: (input.page - 1) * limit },
							{ $limit: limit },
								lookupPublicMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }], //metacounter orqali total sonini qaytaryabmiz
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND); //agar natija bo'sh bo'lsa, ya'ni bunday article lar topilmasa, biz frontendga NO_DATA_FOUND xabarini yuboramiz

		return result[0];
	}

	public async updateBoardArticleByAdmin(input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input; //destruction qilyabmiz
		const update = this.shapeAdminBoardArticleUpdate(input);

		const result = await this.boardArticleModel //boardArticleSchemaModelimizni static findOneAndUpdate methodini chaqiramiz va unga 3 ta argument pass qilyabmiz
			.findOneAndUpdate({ _id: _id, articleStatus: BoardArticleStatus.ACTIVE }, update, {
				//birinchisi search objecti, bunda article ning _id si va articleStatus ACTIVE bo'lishi shart, ikkinchisi input bu biz o'zgartirmoqchi bo'lgan fieldlar va ularning yangi qiymatlari
				new: true, // uchinchisi options, bunda new: true ni beramiz, shunda yangilangan document qaytadi
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED); //agar xato bo'lsa, ya'ni bunday article topilmasa yoki yangilash amalga oshmasa, biz frontendga UPDATE_FAILED xabarini yuboramiz

		if (articleStatus === BoardArticleStatus.DELETE) {
			// agar article ning statusi DELETE ga o'zgartirilgan bo'lsa, biz memberning statsini minusga o'zgartiramiz, chunki article o'chirilgan bo'ladi
			await this.memberService.memberStatsEditor({
				// memberni statsni minusga o'zgartiramiz, chunki article o'chirilgan bo'ladi
				_id: result.memberId, //
				targetKey: 'memberArticles',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeBoardArticleByAdmin(articleId: ObjectId): Promise<BoardArticle> {
		const search: T = { _id: articleId, articleStatus: BoardArticleStatus.DELETE }; //searching object hosil qilyabmiz, bunda article ning _id si va articleStatus DELETE bo'lishi shart
		const result = await this.boardArticleModel.findOneAndDelete(search).exec(); // boardArticleSchemaModelimizni static findOneAndDelete methodini chaqiramiz va unga search objectini beramiz, natijani kuttirib result ga tenglashtiramiz, agar result bo'sh bo'lsa
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED); //ya'ni bunday article topilmasa yoki o'chirish amalga oshmasa, biz frontendga REMOVE_FAILED xabarini yuboramiz

		return result;
	}

	public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle> {
		const { _id, targetKey, modifier } = input;
		return await this.boardArticleModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
	}

	private validateBoardArticleCreatePermission(authMember: Member, articleCategory: BoardArticleCategory): void {
		if ([BoardArticleCategory.HUMOR, BoardArticleCategory.RECOMMEND].includes(articleCategory)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if (authMember.memberType === MemberType.PARENT) {
			if (articleCategory !== BoardArticleCategory.FREE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
			return;
		}

		if (authMember.memberType === MemberType.SUPER_ADMIN) {
			if (![BoardArticleCategory.FREE, BoardArticleCategory.NEWS].includes(articleCategory)) {
				throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
			}
			return;
		}

		throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private shapeOwnerBoardArticleUpdate(input: BoardArticleUpdate): Partial<BoardArticleUpdate> {
		const allowedFields = ['_id', 'articleStatus', 'articleTitle', 'articleContent', 'articleImage'];
		const unknownFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
		if (unknownFields.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const update = {
			...(input.articleStatus ? { articleStatus: input.articleStatus } : {}),
			...(input.articleTitle ? { articleTitle: input.articleTitle } : {}),
			...(input.articleContent ? { articleContent: input.articleContent } : {}),
			...(input.articleImage ? { articleImage: input.articleImage } : {}),
		};
		if (!Object.keys(update).length) throw new BadRequestException(Message.BAD_REQUEST);

		return update;
	}

	private shapeAdminBoardArticleUpdate(input: BoardArticleUpdate): Partial<BoardArticleUpdate> {
		const allowedFields = ['_id', 'articleStatus'];
		const unknownFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
		if (unknownFields.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (!input.articleStatus) throw new BadRequestException(Message.BAD_REQUEST);

		return { articleStatus: input.articleStatus };
	}

	private escapeRegex(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private async reserveBoardArticleLikedHook(article: BoardArticle, senderId: ObjectId): Promise<void> {
		if (!article?.memberId || article.memberId.toString() === senderId.toString()) return;

		await this.createNotificationBestEffort({
			recipientId: article.memberId,
			senderId,
			type: NotificationType.BOARD_ARTICLE_LIKED,
			title: 'Someone liked your article',
			message: this.shapeArticleNotificationMessage('Your article was liked', article.articleTitle),
			targetType: NotificationTargetType.BOARD_ARTICLE,
			targetId: article._id,
			metadata: {
				articleId: article._id.toString(),
				articleCategory: article.articleCategory,
			},
		});
	}

	private async createNotificationBestEffort(input: NotificationInput): Promise<void> {
		try {
			await this.notificationService.createNotification(input);
		} catch (err) {
			console.log('Board article notification failed:', err.message);
		}
	}

	private shapeArticleNotificationMessage(prefix: string, articleTitle?: string): string {
		const title = this.trimNotificationText(articleTitle, 90);
		return title ? `${prefix}: ${title}` : prefix;
	}

	private trimNotificationText(value?: string, maxLength = 120): string {
		const normalized = value?.replace(/\s+/g, ' ').trim() ?? '';
		if (normalized.length <= maxLength) return normalized;
		return `${normalized.slice(0, maxLength - 3).trim()}...`;
	}
}
