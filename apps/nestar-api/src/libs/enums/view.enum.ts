import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	KINDERGARTEN = 'KINDERGARTEN',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
