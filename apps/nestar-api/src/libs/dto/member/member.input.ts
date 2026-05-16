import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { availableKindergartenAdminSorts, availableMemberSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { PreviewMemberPurpose } from '../../enums/member-preview.enum';
import { StaffRole } from '../../enums/kindergarten-staff.enum';

@InputType()
export class MemberInput {
  @IsNotEmpty()
  @Length(3, 12)
  @Field(() => String)
  memberNick: string;

  @IsNotEmpty()
  @Length(5, 12)
  @Field(() => String)
  memberPassword: string;

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
  @IsNotEmpty()
  @Length(3, 12)
  @Field(() => String)
  memberNick: string;

  @IsNotEmpty()
  @Length(5, 12)
  @Field(() => String)
  memberPassword: string;
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
