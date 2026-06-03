import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ApplicationStatus } from '../../enums/application.enum';
import { Kindergarten } from '../kindergarten/kindergarten';
import { MemberPreview, TotalCounter } from '../member/member';

@ObjectType()
export class ApplicationDocument {
	@Field(() => String)
	url: string;

	@Field(() => String)
	name: string;

	@Field(() => String)
	mimeType: string;

	@Field(() => Int)
	size: number;
}

@ObjectType()
export class Application {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	parentId: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	kindergartenOwnerId: ObjectId;

	@Field(() => String)
	childName: string;

	@Field(() => Int)
	childAge: number;

	@Field(() => String, { nullable: true })
	parentMessage?: string;

	@Field(() => [ApplicationDocument], { nullable: true })
	documents?: ApplicationDocument[];

	@Field(() => String, { nullable: true })
	adminNote?: string;

	@Field(() => ApplicationStatus)
	status: ApplicationStatus;

	@Field(() => String, { nullable: true })
	reviewedBy?: ObjectId;

	@Field(() => Date, { nullable: true })
	reviewedAt?: Date;

	@Field(() => Date, { nullable: true })
	canceledAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => MemberPreview, { nullable: true })
	parentData?: MemberPreview;

	@Field(() => Kindergarten, { nullable: true })
	kindergartenData?: Kindergarten;
}

@ObjectType()
export class Applications {
	@Field(() => [Application])
	list: Application[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
