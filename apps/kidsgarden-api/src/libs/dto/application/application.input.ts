import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { ApplicationStatus } from '../../enums/application.enum';

@InputType()
export class ApplicationDocumentInput {
	@IsNotEmpty()
	@Field(() => String)
	url: string;

	@IsNotEmpty()
	@Field(() => String)
	name: string;

	@IsNotEmpty()
	@Field(() => String)
	mimeType: string;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	size: number;
}

@InputType()
export class ApplicationInput {
	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Length(2, 100)
	@Field(() => String)
	childName: string;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Int)
	childAge: number;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	parentMessage?: string;

	@IsOptional()
	@Field(() => [ApplicationDocumentInput], { nullable: true })
	documents?: ApplicationDocumentInput[];
}

@InputType()
class ApplicationSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	parentId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenOwnerId?: ObjectId;

	@IsOptional()
	@Field(() => ApplicationStatus, { nullable: true })
	status?: ApplicationStatus;
}

@InputType()
export class ApplicationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ApplicationSearch)
	search: ApplicationSearch;
}
