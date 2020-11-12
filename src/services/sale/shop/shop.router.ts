import { AppRouter } from '@/services/base/router';
import shopController from './shop.controller';

export default new AppRouter(
	{
		base: '/shops',
		routes: [],
		crud: true,
	},
	shopController,
);
