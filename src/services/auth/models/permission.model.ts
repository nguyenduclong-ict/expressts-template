import { BaseModel, Owner, Timestamp } from '@/helpers/base/model';
import { Shop } from '@/services/sale/shop/shop.model';
import { Schema, Types } from 'mongoose';
import slugify from 'slugify';
import { User } from './user.model';

export interface Permission extends Timestamp, Owner<User> {
	type: 'system' | 'custom';
	name: string;
	key: string;
	description: string;
	action: 'read' | 'write' | 'delete';
	shop: string | Shop;
	token: string;
}

const PermissionSchema = new Schema<Permission>({
	name: {
		type: String,
		required: true,
	},

	key: {
		type: String,
		index: 'name_type_shop',
		default: function () {
			const ctx: Permission = this as any;
			return slugify(ctx.name, { lower: true, replacement: '_' });
		},
		unique: true,
	},

	description: {
		type: String,
	},

	type: {
		type: String,
		enum: ['system', 'custom'],
		index: 'name_type_shop',
	},

	action: {
		type: String,
		enum: ['read', 'create', 'delete'],
	},

	shop: {
		type: Types.ObjectId,
		index: 'name_type_shop',
		ref: 'Shop',
		required: false,
	},

	...Timestamp,
	...Owner,
});

PermissionSchema.virtual('token').get(function getToken() {
	// @ts-ignore
	const context: any = this;
	return [context.shop.toString(), context.action, context.key].filter((e) => !!e).join(':');
});

class PermissionModel extends BaseModel<Permission> {}

export default new PermissionModel('Permission', PermissionSchema);
