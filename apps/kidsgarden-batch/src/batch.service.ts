import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/kidsgarden-api/src/libs/dto/member/member';
import { Kindergarten } from 'apps/kidsgarden-api/src/libs/dto/kindergarten/kindergarten';
import { MemberStatus, MemberType } from 'apps/kidsgarden-api/src/libs/enums/member.enum';
import { KindergartenStatus } from 'apps/kidsgarden-api/src/libs/enums/kindergarten.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.kindergartenModel
			.updateMany(
				{
					kindergartenStatus: KindergartenStatus.ACTIVE,
				},
				{ kindergartenRank: 0 },
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.KINDERGARTEN_ADMIN,
				},
				{ memberRank: 0 },
			)
			.exec();
	}

	public async batchTopKindergartens(): Promise<void> {
		const kindergartens: Kindergarten[] = await this.kindergartenModel
			.find({
				kindergartenStatus: KindergartenStatus.ACTIVE,
				kindergartenRank: 0,
			})
			.exec();

		const promisedList = kindergartens.map(async (ele: Kindergarten) => {
			const { _id, kindergartenLikes, kindergartenViews } = ele;
			const rank = kindergartenLikes * 2 + kindergartenViews * 1;
			return await this.kindergartenModel.findByIdAndUpdate(_id, { kindergartenRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopKindergartenAdmins(): Promise<void> {
		const kindergartenAdmins: Member[] = await this.memberModel
			.find({
				memberType: MemberType.KINDERGARTEN_ADMIN,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = kindergartenAdmins.map(async (ele: Member) => {
			const { _id, memberKindergartens, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberKindergartens * 4 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to KidsGarden Batch Server!';
	}
}
