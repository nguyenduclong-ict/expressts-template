import { Router } from '@/helpers/base/router';
import MdAuth from '@/middlewares/auth';
import MdUser from '@/middlewares/user';
import authController from '../controllers/auth.controller';

export default new Router(
	{
		base: '/auth',
		routes: [
			{
				path: '/login',
				method: 'POST',
				handler: authController.login,
			},
			{
				path: '/facebook',
				method: 'POST',
				handler: authController.facebook,
			},
			{
				path: '/register',
				method: 'POST',
				handler: authController.register,
			},
			{
				path: '/logout',
				method: 'POST',
				handler: authController.logout,
			},
			{
				path: '/me',
				method: 'GET',
				middlewares: [MdUser],
				handler: authController.me,
			},
		],
	},
	authController,
);
