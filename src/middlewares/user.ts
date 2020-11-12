import { RequestHandler } from '@/helpers/base/express';
import jwt from '@/helpers/base/jwt';
import tokenModel from '@/services/auth/models/token.model';
import userModel from '@/services/auth/models/user.model';
import { TokenExpiredError } from 'jsonwebtoken';

const MdUser: RequestHandler = async (req, res, next) => {
	try {
		if (req.headers['authorization']) {
			const token = req.headers['authorization'].split(' ').pop();
			_.set(req, 'state.token', token);

			let tokenData: { id: any; iat: number; exp: number };
			tokenData = jwt.verify(token as string) as any;

			if (tokenData.id) {
				// Kiểm tra token có tồn tại trong hệ thống không ?
				const tokenOfUser = await tokenModel.model.findOne({
					user: tokenData.id,
					token: token,
				});

				if (!tokenOfUser) {
					throw new Error('Token không tồn tại trong hệ thống');
				}

				const user = await userModel.fetchUser({ _id: tokenData.id });

				if (user) {
					_.set(req, 'state.user', user);
				}
			}
		}
	} catch (error) {
		if (error instanceof TokenExpiredError) {
			consola.warn('Token expired', req.headers['authorization']);
		} else {
			consola.error(error);
		}
	}

	next();
};

export default MdUser;
