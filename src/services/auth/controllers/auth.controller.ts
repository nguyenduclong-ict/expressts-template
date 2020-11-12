import bcrypt from '@/helpers/base/bcrypt';
import { AppError } from '@/helpers/base/error';
import jwt from '@/helpers/base/jwt';
import { Controller } from '@/helpers/base/router';
import shopModel from '@/services/sale/shop/shop.model';
import tokenModel from '../models/token.model';
import userModel from '../models/user.model';
import axios from 'axios';
import roleModel from '../models/role.model';
import { CUSTOMER_ROLE } from '@/config/constant';
import { ObjectId } from 'mongodb';
import customerModel from '@/services/sale/customer/customer.model';
import mediaModel from '@/services/media/media.model';
export default new Controller({
	async login(req, res, next) {
		try {
			const username = req.body.username;
			const user = await userModel.fetchUser({ username });

			if (!user) {
				return next(new AppError({ code: 401, message: `Tài khoản không tồn tại!` }));
			}

			if (user.blocked) {
				return next(new AppError({ code: 401, message: `Tài khoản đang bị khóa` }));
			}

			const valid = await bcrypt.compare(req.body.password, user.password);

			if (!valid) {
				return next(new AppError({ code: 401, message: `Mật khẩu không chính xác` }));
			}

			const jwtString = jwt.sign({ id: user.id }, { expiresIn: '7d' });

			await tokenModel.create({
				data: {
					token: jwtString,
					user: user.id,
				},
				state: req.state,
			});

			res.json({
				token: jwtString,
				user,
			});
		} catch (error) {
			next(error);
		}
	},

	async facebook(req, res, next) {
		let { access_token, shopId, code } = req.body;

		const shop = await shopModel.findOne({ query: { _id: shopId } });

		if (!shop) {
			return next(new AppError({ code: 404, message: 'Shop không tồn tại' }));
		}

		const { clientId, clientSecret, redirectUri } = shop.setting?.facebook;
		if (!clientId || !clientSecret || !redirectUri) {
			return next(
				new AppError({
					code: 404,
					message: 'Không tìm thấy cài đặt đăng nhập facebook',
				}),
			);
		}
		let fbUser: { id: string; name: string; picture: { url: string } };

		if (!access_token) {
			const response = await axios.get('https://graph.facebook.com/v8.0/oauth/access_token', {
				params: {
					client_id: clientId,
					redirect_uri: redirectUri,
					client_secret: clientSecret,
					code,
				},
			});
			access_token = response.data.access_token;
		}

		if (access_token) {
			const endpoint = 'https://graph.facebook.com/v8.0/me';
			const response = await axios.get(endpoint, {
				params: {
					fields: 'id,name,picture{url}',
					access_token,
				},
			});
			fbUser = response.data;
		}

		// console.log(fbUser);
		// res.json(fbUser);

		// return;

		let user = await userModel.fetchUser({ facebookId: fbUser.id });

		if (!user) {
			const customerRole = await roleModel.model.findOne({
				key: CUSTOMER_ROLE,
			});
			// Create Customer
			const hexId = new ObjectId().toHexString();
			const [customer, newUser, avatar] = await Promise.all([
				customerModel.model.create({
					name: fbUser.name,
					shop: shopId,
					facebookId: fbUser.id,
					source: 'facebook',
				}),
				userModel.model.create({
					roles: [customerRole.id],
					confirmed: true,
					blocked: false,
					shop: shopId,
					username: hexId,
					facebookId: fbUser.id,
				}),
				mediaModel.download(_.get(fbUser, 'picture.data.url'), 'avatar_' + hexId + '.jpg'),
			]);

			customer.set('user', newUser.id);
			customer.set('image', avatar.id);
			newUser.set('customer', customer.id);
			avatar.set('createdBy', newUser.id);
			avatar.set('updatedBy', newUser.id);
			avatar.set('shop', shopId);
			await Promise.all([customer.save(), newUser.save(), avatar.save()]);
			user = await userModel.fetchUser({ _id: newUser.id });
		}

		// LOGIN
		const jwtString = jwt.sign({ id: user.id }, { expiresIn: '7d' });

		await tokenModel.create({
			data: {
				token: jwtString,
				user: user.id,
			},
			state: req.state,
		});

		res.json({
			token: jwtString,
			user,
		});
	},

	async register(req, res, next) {
		try {
			const user = await userModel.create({ data: req.body });
			res.json(user);
		} catch (error) {
			next(error);
		}
	},

	async logout(req, res, next) {
		if (req.state.token) {
			await tokenModel.model.deleteOne({
				token: req.state.token,
				user: req.state.user?.id,
			});
		}
		res.sendStatus(200);
	},

	me(req, res, next) {
		res.json(req.state?.user);
	},
}).getConfig();
