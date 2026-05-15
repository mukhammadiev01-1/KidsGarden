import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { KindergartenModule } from './kindergarten/kindergarten.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { KindergartenStaffModule } from './kindergarten-staff/kindergarten-staff.module';
import { GroupModule } from './group/group.module';
import { ChildModule } from './child/child.module';
import { AttendanceModule } from './attendance/attendance.module';
import { StaffApplicationModule } from './staff-application/staff-application.module';
import { KindergartenAdminApplicationModule } from './kindergarten-admin-application/kindergarten-admin-application.module';

@Module({
  imports: [
    MemberModule,
    KindergartenModule,
    KindergartenStaffModule,
    GroupModule,
    ChildModule,
    AttendanceModule,
    StaffApplicationModule,
    KindergartenAdminApplicationModule,
    AuthModule,
    CommentModule,
    LikeModule,
    ViewModule,
    FollowModule,
    BoardArticleModule,
  ],
})
export class ComponentsModule {}
