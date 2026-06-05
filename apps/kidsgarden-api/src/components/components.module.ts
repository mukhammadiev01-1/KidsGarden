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
import { ApplicationModule } from './application/application.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    MemberModule,
    KindergartenModule,
    KindergartenStaffModule,
    GroupModule,
    ChildModule,
    AttendanceModule,
    ApplicationModule,
    ChatModule,
    NotificationModule,
    RedisModule,
    RealtimeModule,
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
