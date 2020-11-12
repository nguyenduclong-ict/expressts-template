import { Router } from '@/helpers/base/router';
import mediaController from './media.controller';

export default new Router(
	{
		base: '/media',
		routes: [
			{
				path: '/file/:name',
				method: 'GET',
				handler: mediaController.file,
			},
		],
	},
	mediaController,
);
