import bcrypt from '@/helpers/base/bcrypt';
import { Context, Hook, Owner, Timestamp } from '@/helpers/base/model';
import { AppModel } from '@/services/base/model';
import customerModel from '@/services/sale/customer/customer.model';
import { Shop } from '@/services/sale/shop/shop.model';
import { Document, FilterQuery, Schema, Types } from 'mongoose';
import permissionModel, { Permission } from './permission.model';
import roleModel, { Role } from './role.model';

export interface User extends Timestamp, Owner<User> {
	password?: string;
	username?: string;
	email?: string;
	facebookId?: string;
	confirmed?: boolean;
	blocked?: boolean;
	roles?: Role[];
	customer?: any;
	shop?: string | Shop;
	permissons?: Permission[];
}

const UserSchema = new Schema<User>({
	username: {
		type: String,
		unique: true,
	},

	email: {
		type: String,
	},

	facebookId: {
		type: String,
	},

	password: {
		type: String,
	},

	confirmed: {
		type: Boolean,
		default: true,
	},

	blocked: {
		type: Boolean,
		default: false,
	},

	customer: {
		type: Types.ObjectId,
		ref: 'Customer',
		required: false,
	},

	shop: {
		type: Types.ObjectId,
		ref: 'Shop',
		required: false,
	},

	roles: [
		{
			type: Types.ObjectId,
			ref: 'Role',
			required: false,
			default: [],
		},
	],

	...Timestamp,
	...Owner,
});

export class UserModel extends AppModel<User> {
	@Hook('before', 'create')
	async beforeCreate(context: Context<User>) {
		const data = context.data;
		data.password = await bcrypt.hash(data.password);
	}

	@Hook('after', 'create')
	async afterCreate(context: Context<User>, response: User & Document) {
		const roles = await roleModel.model.find({
			_id: { $in: response.roles },
		});

		if (roles.some((role) => role.isAdmin)) {
			response.set('blocked', true);
			await response.save();
		}

		if (response.confirmed) {
			const authenticatedRole = await roleModel.model.findOne({
				name: 'Authenticated',
			});

			if (authenticatedRole) {
				response.roles.push(authenticatedRole.id);
				await response.save();
			}
		}

		return response;
	}

	async fetchUser(query: FilterQuery<User>) {
		const user = await this.model
			.findOne(query)
			.populate('shop')
			.populate({
				path: 'customer',
				populate: 'image',
			})
			.populate({
				path: 'roles',
				populate: 'permissons',
			});

		let permissions: Permission[];

		if (user?.roles.some((role) => role.isAdmin)) {
			permissions = await permissionModel.find();
		} else {
			permissions = _.flatMap(user?.roles.map((role) => role.permissions));
		}
		_.set(user, 'permissions', permissions);

		return user;
	}
}

export default new UserModel('User', UserSchema);
