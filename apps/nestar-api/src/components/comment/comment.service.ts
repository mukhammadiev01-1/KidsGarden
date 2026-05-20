import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { AdminCommentsInquiry, CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BoardArticleService } from '../board-article/board-article.service';
import { MemberService } from '../member/member.service';
import { KindergartenService } from '../kindergarten/kindergarten.service';
import { CommentAdminUpdate, CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupPublicMember, shapeIntoMongoObjectId } from '../../libs/config';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { T } from '../../libs/types/common';

@Injectable()
export class CommentService {
  private readonly publicCommentListMaxLimit = 50;
  private readonly adminCommentListMaxLimit = 100;

  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    private readonly memberService: MemberService,
    private readonly kindergartenService: KindergartenService,
    private readonly boardArticleService: BoardArticleService,
  ) {}

  public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
    input.memberId = memberId; //frontenddan kelgan inputga memberId ni qo'shamiz, chunki frontenddan memberId kelmaydi
    input.commentRefId = shapeIntoMongoObjectId(input.commentRefId);
    await this.validateCommentTarget(input.commentGroup, input.commentRefId);

    let result = null; //resultni nullga tenglayabmiz 
    try {
      result = await this.commentModel.create(input); // agar mantiq to'g'ri bo'lsa
    } catch (err) { //try catch mongodb errorni throw qiberadi
      console.log('Error, Service.model:', err.message);// o'zimiz print qilib 
      throw new BadRequestException(Message.CREATE_FAILED); // o'zimiz xato xabarini yuboramiz, chunki mongodb dan kelgan error xabarini frontendga yuborish xavfsizlik nuqtai nazaridan to'g'ri emas
    }

    await this.applyCommentCounter(input.commentGroup, input.commentRefId, 1);

    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
    return result;
  }

public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
  const { _id } = input;
  const update = this.shapeCommentUpdate(input);
  const targetComment = await this.commentModel
    .findOne({
      _id: _id,
      memberId: memberId,
      commentStatus: CommentStatus.ACTIVE,
    })
    .exec();
  if (!targetComment) throw new InternalServerErrorException(Message.UPDATE_FAILED);

  const result = await this.commentModel.findOneAndUpdate(
    {
      _id: _id,
      memberId: memberId,
      commentStatus: CommentStatus.ACTIVE,
    },
    update,
    {
      new: true,
    },
  );

  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
  if (input.commentStatus === CommentStatus.DELETE) {
    await this.applyCommentCounter(targetComment.commentGroup, targetComment.commentRefId, -1);
  }
  return result;
}

public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
  const { commentRefId } = input.search;
  const limit = Math.min(input.limit, this.publicCommentListMaxLimit);
  const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

  const result: Comments[] = await this.commentModel.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        list: [
          { $skip: (input.page - 1) * limit },
          { $limit: limit },
          // meLiked
          lookupPublicMember,
          { $unwind: '$memberData' },
        ],
        metaCounter: [{ $count: 'total' }],
      },
    },
  ]);

  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  return result[0];
}

public async getAllCommentsByAdmin(input: AdminCommentsInquiry): Promise<Comments> {
  const { commentStatus, commentGroup, commentRefId, memberId } = input.search || {};
  const limit = Math.min(input.limit, this.adminCommentListMaxLimit);
  const match: T = {};
  const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

  if (commentStatus) match.commentStatus = commentStatus;
  if (commentGroup) match.commentGroup = commentGroup;
  if (commentRefId) match.commentRefId = shapeIntoMongoObjectId(commentRefId);
  if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);

  const result: Comments[] = await this.commentModel.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        list: [
          { $skip: (input.page - 1) * limit },
          { $limit: limit },
          lookupPublicMember,
          { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
        ],
        metaCounter: [{ $count: 'total' }],
      },
    },
  ]);

  if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
  return result[0];
}

public async updateCommentByAdmin(input: CommentAdminUpdate): Promise<Comment> {
  const { _id, commentStatus } = input;
  if (!Object.values(CommentStatus).includes(commentStatus)) throw new BadRequestException(Message.BAD_REQUEST);

  const targetComment = await this.commentModel.findById(_id).exec();
  if (!targetComment) throw new InternalServerErrorException(Message.UPDATE_FAILED);

  if (targetComment.commentStatus === commentStatus) return targetComment;

  if (targetComment.commentStatus === CommentStatus.DELETE && commentStatus === CommentStatus.ACTIVE) {
    await this.validateCommentTarget(targetComment.commentGroup, targetComment.commentRefId);
  }

  const result = await this.commentModel
    .findByIdAndUpdate(_id, { commentStatus }, { new: true })
    .exec();
  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

  if (targetComment.commentStatus === CommentStatus.ACTIVE && commentStatus === CommentStatus.DELETE) {
    await this.applyCommentCounter(targetComment.commentGroup, targetComment.commentRefId, -1);
  }

  if (targetComment.commentStatus === CommentStatus.DELETE && commentStatus === CommentStatus.ACTIVE) {
    await this.applyCommentCounter(targetComment.commentGroup, targetComment.commentRefId, 1);
  }

  return result;
}

public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
  const targetComment = await this.commentModel.findById(input).exec();
  if (!targetComment) throw new InternalServerErrorException(Message.REMOVE_FAILED);

  if (targetComment.commentStatus === CommentStatus.ACTIVE) {
    await this.applyCommentCounter(targetComment.commentGroup, targetComment.commentRefId, -1);
  }

  const result = await this.commentModel.findByIdAndDelete(input);
  if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
  return result;
}

private async validateCommentTarget(commentGroup: CommentGroup, commentRefId: ObjectId): Promise<void> {
  switch (commentGroup) {
    case CommentGroup.ARTICLE:
      await this.boardArticleService.getBoardArticle(null, commentRefId);
      return;

    case CommentGroup.KINDERGARTEN:
      await this.kindergartenService.getKindergarten(null, commentRefId);
      return;

    case CommentGroup.MEMBER:
    default:
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
  }
}

private async applyCommentCounter(commentGroup: CommentGroup, commentRefId: ObjectId, modifier: number): Promise<void> {
  let result = null;

  switch (commentGroup) {
    case CommentGroup.KINDERGARTEN:
      result = await this.kindergartenService.kindergartenStatsEditor({
        _id: commentRefId,
        targetKey: 'kindergartenComments',
        modifier,
      });
      break;

    case CommentGroup.ARTICLE:
      result = await this.boardArticleService.boardArticleStatsEditor({
        _id: commentRefId,
        targetKey: 'articleComments',
        modifier,
      });
      break;

    case CommentGroup.MEMBER:
      result = await this.memberService.memberStatsEditor({
        _id: commentRefId,
        targetKey: 'memberComments',
        modifier,
      });
      break;

    default:
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
  }

  if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
}

private shapeCommentUpdate(input: CommentUpdate): Partial<CommentUpdate> {
  const allowedFields = ['_id', 'commentStatus', 'commentContent'];
  const unknownFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

  const update = {
    ...(input.commentStatus ? { commentStatus: input.commentStatus } : {}),
    ...(input.commentContent ? { commentContent: input.commentContent } : {}),
  };
  if (!Object.keys(update).length) throw new BadRequestException(Message.BAD_REQUEST);

  return update;
}

}
