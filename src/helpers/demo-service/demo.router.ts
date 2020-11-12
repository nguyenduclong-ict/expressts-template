import { Router } from '@/helpers/base/router';
import demoController from './demo.controller';

export default new Router(
	{
		base: '/demo',
		routes: [],
	},
	demoController.getConfig(),
);
