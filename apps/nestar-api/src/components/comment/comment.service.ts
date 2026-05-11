import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BoardArticleService } from '../board-article/board-article.service';
import { MemberService } from '../member/member.service';
import { KindergartenService } from '../kindergarten/kindergarten.service';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupMember } from '../../libs/config';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { T } from '../../libs/types/common';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    private readonly memberService: MemberService,
    private readonly kindergartenService: KindergartenService,
    private readonly boardArticleService: BoardArticleService,
  ) {}

  public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
    input.memberId = memberId; //frontenddan kelgan inputga memberId ni qo'shamiz, chunki frontenddan memberId kelmaydi

    let result = null; //resultni nullga tenglayabmiz 
    try {
      result = await this.commentModel.create(input); // agar mantiq to'g'ri bo'lsa
    } catch (err) { //try catch mongodb errorni throw qiberadi
      console.log('Error, Service.model:', err.message);// o'zimiz print qilib 
      throw new BadRequestException(Message.CREATE_FAILED); // o'zimiz xato xabarini yuboramiz, chunki mongodb dan kelgan error xabarini frontendga yuborish xavfsizlik nuqtai nazaridan to'g'ri emas
    }

    switch (input.commentGroup) { // kirib kelgan comment groupiga qarab swith case hosil qildik 
      case CommentGroup.KINDERGARTEN: // agar shu bo'lsa
        await this.kindergartenService.kindergartenStatsEditor({ //shunga 
          _id: input.commentRefId,
          targetKey: 'kindergartenComments',
          modifier: 1,
        });
        break;

      case CommentGroup.ARTICLE:
        await this.boardArticleService.boardArticleStatsEditor({
          _id: input.commentRefId,
          targetKey: 'articleComments',
          modifier: 1,
        });
        break;

      case CommentGroup.MEMBER:
        await this.memberService.memberStatsEditor({
          _id: input.commentRefId,
          targetKey: 'memberComments',
          modifier: 1,
        });
        break;
    }

    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
    return result;
  }

public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
  const { _id } = input;
  const result = await this.commentModel.findOneAndUpdate(
    {
      _id: _id,
      memberId: memberId,
      commentStatus: CommentStatus.ACTIVE,
    },
    input,
    {
      new: true,
    },
  );

  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
  return result;
}

public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
  const { commentRefId } = input.search;
  const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

  const result: Comments[] = await this.commentModel.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        list: [
          { $skip: (input.page - 1) * input.limit },
          { $limit: input.limit },
          // meLiked
          lookupMember,
          { $unwind: '$memberData' },
        ],
        metaCounter: [{ $count: 'total' }],
      },
    },
  ]);

  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  return result[0];
}

public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
  const result = await this.commentModel.findByIdAndDelete(input);
  if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
  return result;
}

}