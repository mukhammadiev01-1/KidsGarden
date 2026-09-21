import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import type { ObjectId } from 'mongoose';
import { MEMBER_NICK_PATTERN } from '../../config';
import { Message } from '../../enums/common.enum';

@InputType()
export class MemberUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Field(() => MemberType, { nullable: true })
  memberType?: MemberType;

  @IsOptional()
  @Field(() => MemberStatus, { nullable: true })
  memberStatus?: MemberStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberPhone?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(MEMBER_NICK_PATTERN, { message: Message.INVALID_MEMBER_NICK })
  @Field(() => String, { nullable: true })
  memberNick?: string;

  @IsOptional()
  @Length(5, 12)
  @Field(() => String, { nullable: true })
  memberPassword?: string;

  @IsOptional()
  @Length(3, 100)
  @Field(() => String, { nullable: true })
  memberFullName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberImage?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberAddress?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberDesc?: string;

  @IsOptional()
  deleteAt?: Date;
}