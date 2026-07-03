import { Field, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, Length, Matches, Min } from 'class-validator';
import { KakaoAuthIntent, MemberAuthType, MemberStatus, MemberType, TelegramAuthIntent } from '../../enums/member.enum';
import { availableKindergartenAdminSorts, availableMemberSorts } from '../../config';
import { Direction, Message } from '../../enums/common.enum';
import { PreviewMemberPurpose } from '../../enums/member-preview.enum';
import { StaffRole } from '../../enums/kindergarten-staff.enum';

@InputType()
export class MemberInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @Matches(/^[\p{L}\p{N}_-]{3,20}$/u, { message: Message.INVALID_MEMBER_NICK })
  @Field(() => String)
  memberNick: string;

  @IsNotEmpty()
  @Length(8, 72, { message: Message.INVALID_MEMBER_PASSWORD })
  @Field(() => String)
  memberPassword: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @Field(() => String)
  memberPhone: string;

  @IsOptional()
  @Field(() => MemberType, { nullable: true })
  memberType?: MemberType;

  @IsOptional()
  @Field(() => MemberAuthType, { nullable: true })
  memberAuthType?: MemberAuthType;
}

@InputType()
export class LoginInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @Matches(/^[\p{L}\p{N}_-]{3,20}$/u, { message: Message.INVALID_MEMBER_NICK })
  @Field(() => String)
  memberNick: string;

  @IsNotEmpty()
  @Length(1, 72)
  @Field(() => String)
  memberPassword: string;
}

@InputType()
export class GoogleLoginInput {
  @IsNotEmpty()
  @Field(() => String)
  idToken: string;
}

@InputType()
export class TelegramLoginInput {
  @IsNotEmpty()
  @Field(() => String)
  id: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  firstName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  lastName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  username?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  photoUrl?: string;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  authDate: number;

  @IsNotEmpty()
  @Field(() => String)
  hash: string;

  @IsNotEmpty()
  @Field(() => TelegramAuthIntent)
  intent: TelegramAuthIntent;
}

@InputType()
export class KakaoLoginInput {
  @IsNotEmpty()
  @Field(() => String)
  code: string;

  @IsNotEmpty()
  @Field(() => String)
  redirectUri: string;

  @IsNotEmpty()
  @Field(() => KakaoAuthIntent)
  intent: KakaoAuthIntent;
}

@InputType()
class KGAISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class KindergartenAdminsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsIn(availableKindergartenAdminSorts)
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => KGAISearch)
  search: KGAISearch;
}

@InputType()
export class PreviewKindergartenMemberInput {
  @IsNotEmpty()
  @Field(() => String)
  kindergartenId: string;

  @IsNotEmpty()
  @Field(() => String)
  memberId: string;

  @IsNotEmpty()
  @Field(() => PreviewMemberPurpose)
  purpose: PreviewMemberPurpose;

  @IsOptional()
  @Field(() => StaffRole, { nullable: true })
  staffRole?: StaffRole;
}

@InputType()
class MISearch {
  @IsOptional()
  @Field(() => MemberStatus, { nullable: true })
  memberStatus?: MemberStatus;

  @IsOptional()
  @Field(() => MemberType, { nullable: true })
  memberType?: MemberType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class MembersInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsIn(availableMemberSorts)
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => MISearch)
  search: MISearch;
}
