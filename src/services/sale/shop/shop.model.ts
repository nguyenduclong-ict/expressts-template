import { SHOP_ROLE } from '@/config/constant';
import { isRole } from '@/helpers/auth';
import { AppError } from '@/helpers/base/error';
import { Context, Hook, Owner, Timestamp } from '@/helpers/base/model';
import roleModel from '@/services/auth/models/role.model';
import userModel, { User } from '@/services/auth/models/user.model';
import { AppModel } from '@/services/base/model';
import { State } from '@/services/base/state';
import { Media } from '@/services/media/media.model';
import { Document, Schema, Types } from 'mongoose';
import { Address } from '../address/address.model';

export interface Shop extends Document, Timestamp, Owner<User> {
	name: string;
	addresses: Address[];
	logo: Media;
	setting?: {
		facebook?: {
			clientId: string;
			redirectUri: string;
			clientSecret: string;
		};
	};
	phone: string;
}

const ShopSchema = new Schema<Shop>({
	name: {
		type: String,
		required: true,
	},

	logo: {
		type: Types.ObjectId,
		ref: 'Media',
	},

	addresses: [
		{
			type: Types.ObjectId,
			ref: 'Address',
		},
	],

	setting: {
		type: Schema.Types.Mixed,
		default: () => ({}),
	},

	phone: {
		type: String,
		required: true,
	},

	...Timestamp,
	...Owner,
});

class ShopModel extends AppModel<Shop> {
	@Hook('before', 'create')
	async beforeCreate(context: Context<Shop, State>) {
		if (context.data?.createdBy) {
			const user = await userModel.fetchUser({ _id: context.data.createdBy });
			if (!isRole(user, SHOP_ROLE)) {
				throw new AppError({
					code: 401,
					message: 'Bạn không có quyền tạo cửa hàng',
				});
			}
			if (user?.shop) {
				throw new AppError({
					code: 422,
					message: 'Tài khoản đã đăng kí cửa hàng trước đó',
				});
			}
		} else if (_.get(context, 'data.user')) {
			const r = await roleModel.model.findOne({ key: SHOP_ROLE });
			const user = await userModel.create({
				data: {
					..._.get(context, 'data.user'),
					roles: [r.id],
				},
			});
			context.data.createdBy = user.id;
			context.data.updatedBy = user.id;
			_.unset(context, 'data.user');
		} else {
			throw new AppError({
				code: 500,
				message: 'Không tìm thấy thông tin tài khoản',
			});
		}
	}

	@Hook('after', 'create')
	async afterCreate(context: Context<Shop, State>, response: Shop) {
		if (response.createdBy) {
			await userModel.model.updateOne({ _id: response.createdBy }, { shop: response.id });
		}
		return response;
	}
}

export default new ShopModel('Shop', ShopSchema);
