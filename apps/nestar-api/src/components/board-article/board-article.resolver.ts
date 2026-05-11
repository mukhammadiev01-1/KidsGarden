import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { AllBoardArticlesInquiry, BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BoardArticleService } from './board-article.service';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class BoardArticleResolver {
  constructor(private readonly boardArticleService: BoardArticleService) {}

  @UseGuards(AuthGuard) // Auth bo'lgan memberlar uchun kirish Auth Guard chaqirdik
  @Mutation((returns) => BoardArticle) // bu mutation graphql API hisoblanadi va BoardArticle tipida data qaytaradi
  public async createBoardArticle( 
    @Args('input') input: BoardArticleInput, // frontend dan keladigan input ma'lumotlari BoardArticleInput tipida bo'ladi
    @AuthMember('_id') memberId: ObjectId, // Auth bo'lgan memberning _id sini AuthMember decorator orqali olamiz
  ): Promise<BoardArticle> { //Promiseda BoardArticle tipida data qaytaradi
    console.log('Mutation: createBoardArticle');
    return await this.boardArticleService.createBoardArticle(memberId, input); //boardarticleservice instance dan createBoardArticle methodini chaqiramiz va unga memberId va inputni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
  }

  @UseGuards(WithoutGuard) // Auth bo'lmagan memberlar ham bo'lganlarham kirishi mumkin, shuning uchun WithoutGuard chaqirdik
 @Query((returns) => BoardArticle)
public async getBoardArticle( // bu yerda getBoardArticle query graphql API hosil qildik va BoardArticle tipida data qaytaradi
  @Args('articleId') input: string, // biz ko'rmoqchi bo'lgan article ni id sini frontend dan string tipida beriladi
  @AuthMember('_id') memberId: ObjectId, //Agar member auth bo'lsa uning _id sini olamiz, agar auth bo'lmasa bu field null bo'ladi
): Promise<BoardArticle> {
  console.log('Query: getBoardArticle');
  const articleId = shapeIntoMongoObjectId(input); // frontend dan string tipida kelgan articleId ni MongoDB ning ObjectId tipiga o'zgartiramiz, chunki bizning database da articleId lar ObjectId tipida saqlanadi
  return await this.boardArticleService.getBoardArticle(memberId, articleId); //boardArticleService instance dan getBoardArticle methodini chaqiramiz va unga memberId va articleId ni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
}

@UseGuards(AuthGuard) // Auth bo'lgan memberlar uchun kirish Auth Guard chaqirdik
@Mutation(() => BoardArticle) // bu mutation graphql API hisoblanadi va BoardArticle tipida data qaytaradi
public async updateBoardArticle( // bu yerda updateBoardArticle mutation graphql API hosil qildik va BoardArticle tipida data qaytaradi
  @Args('input') input: BoardArticleUpdate, // frontend dan keladigan input ma'lumotlari BoardArticleUpdate tipida bo'ladi
  @AuthMember('_id') memberId: ObjectId, // Agar member auth bo'lsa uning _id sini olamiz, agar auth bo'lmasa bu field null bo'ladi
): Promise<BoardArticle> {
  console.log('Mutation: updateBoardArticle'); // mutation chaqirilganda konsolga Mutation: updateBoardArticle deb yozadi, bu debugging uchun foydali
  input._id = shapeIntoMongoObjectId(input._id); // frontend dan string tipida kelgan articleId ni MongoDB ning ObjectId tipiga o'zgartiramiz, chunki bizning database da articleId lar ObjectId tipida saqlanadi
  return await this.boardArticleService.updateBoardArticle(memberId, input); //boardArticleService instance dan updateBoardArticle methodini chaqiramiz va unga memberId va input ni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
}

@UseGuards(WithoutGuard)
@Query((returns) => BoardArticles)
public async getBoardArticles(
  @Args('input') input: BoardArticlesInquiry,
  @AuthMember('_id') memberId: ObjectId,
): Promise<BoardArticles> {
  console.log('Query: getBoardArticles');
  return await this.boardArticleService.getBoardArticles(memberId, input); //boardArticleService instance dan getBoardArticles methodini chaqiramiz va unga memberId va input ni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
}

@UseGuards(AuthGuard)
@Mutation(() => BoardArticle)
public async likeTargetBoardArticle(
  @Args('articleId') input: string,
  @AuthMember('_id') memberId: ObjectId,
): Promise<BoardArticle> {
  console.log('Mutation: likeTargetBoardArticle');
  const likeRefId = shapeIntoMongoObjectId(input);
  return await this.boardArticleService.likeTargetBoardArticle(memberId, likeRefId);
}


/** SUPER_ADMIN **/

@Roles(MemberType.SUPER_ADMIN) // bu query faqat admin role ga ega memberlar uchun ochiq bo'ladi
@UseGuards(RolesGuard) // bu guard memberning role sini tekshiradi va agar memberda kerakli role bo'lmasa unga kirishni taqiqlaydi
@Query((returns) => BoardArticles)
public async getAllBoardArticlesByAdmin(
  @Args('input') input: AllBoardArticlesInquiry,
  @AuthMember('_id') memberId: ObjectId,
): Promise<BoardArticles> {
  console.log('Query: getAllBoardArticlesByAdmin');
  return await this.boardArticleService.getAllBoardArticlesByAdmin(input); //boardArticleService instance dan getAllBoardArticlesByAdmin methodini chaqiramiz va unga input ni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
}

@Roles(MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Mutation(() => BoardArticle)
public async updateBoardArticleByAdmin(
  @Args('input') input: BoardArticleUpdate,
  @AuthMember('_id') memberId: ObjectId,
): Promise<BoardArticle> {
  console.log('Mutation: updateBoardArticleByAdmin');
  input._id = shapeIntoMongoObjectId(input._id);
  return await this.boardArticleService.updateBoardArticleByAdmin(input); //boardArticleService instance dan updateBoardArticleByAdmin methodini chaqiramiz va unga input ni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
}

@Roles(MemberType.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Mutation((returns) => BoardArticle)
public async removeBoardArticleByAdmin(
  @Args('articleId') input: string,
  @AuthMember('_id') memberId: ObjectId,
): Promise<BoardArticle> {
  console.log('Mutation: removeBoardArticleByAdmin');
  const articleId = shapeIntoMongoObjectId(input);
  return await this.boardArticleService.removeBoardArticleByAdmin(articleId); //boardArticleService instance dan removeBoardArticleByAdmin methodini chaqiramiz va unga articleId ni argument sifatida beramiz, natijani kuttiramiz va qaytaramiz
}
}