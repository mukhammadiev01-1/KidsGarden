import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { lookupVisitedKindergarten } from '../../libs/config';
import { Kindergartens } from '../../libs/dto/kindergarten/kindergarten';
import { OrdinaryInquiry } from '../../libs/dto/kindergarten/kindergarten.input';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (!viewExist) {
			console.log('- New View Insert -');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExistence(input: ViewInput): Promise<View> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedKindergartens(memberId: ObjectId, input: OrdinaryInquiry): Promise<Kindergartens> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.KINDERGARTEN, memberId: memberId };

		const data: T = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'kindergartens',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedKindergarten',
					},
				},
				{ $unwind: '$visitedKindergarten' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupVisitedKindergarten,
							{ $unwind: '$visitedKindergarten.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const result: Kindergartens = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.visitedKindergarten);

		return result;
	}
}
