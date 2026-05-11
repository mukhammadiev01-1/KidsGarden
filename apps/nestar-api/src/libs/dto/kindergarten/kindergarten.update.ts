import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class KindergartenUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Field(() => KindergartenType, { nullable: true })
  kindergartenType?: KindergartenType;

  @IsOptional()
  @Field(() => KindergartenStatus, { nullable: true })
  kindergartenStatus?: KindergartenStatus;

  @IsOptional()
  @Field(() => KindergartenLocation, { nullable: true })
  kindergartenLocation?: KindergartenLocation;

  @IsOptional()
  @Length(3, 100)
  @Field(() => String, { nullable: true })
  kindergartenAddress?: string;

  @IsOptional()
  @Length(3, 100)
  @Field(() => String, { nullable: true })
  kindergartenTitle?: string;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  kindergartenPrice?: number;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  kindergartenCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Field(() => Int, { nullable: true })
  kindergartenAgeRange?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Field(() => Int, { nullable: true })
  kindergartenPrograms?: number;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  kindergartenImages?: string[];

  @IsOptional()
  @Length(5, 500)
  @Field(() => String, { nullable: true })
  kindergartenDesc?: string;

  deletedAt: Date;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  establishedAt?: Date;
}
