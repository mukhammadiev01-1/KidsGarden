import { Module } from '@nestjs/common';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import CommentSchema from '../../shemas/Comment.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { KindergartenModule } from '../kindergarten/kindergarten.module';
import { BoardArticleModule } from '../board-article/board-article.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Comment',
        schema: CommentSchema,
      },
    ]),
    AuthModule,
    MemberModule,
    KindergartenModule,
    BoardArticleModule,
  ],
  providers: [CommentResolver, CommentService],
})
export class CommentModule {}