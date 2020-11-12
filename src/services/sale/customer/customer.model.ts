import { BaseDocument, BaseModel, Owner, Timestamp } from '@/helpers/base/model';
import { User } from '@/services/auth/models/user.model';
import { Media } from '@/services/media/media.model';
import { Schema, Types } from 'mongoose';
import { Address } from '../address/address.model';
import { Shop } from '../shop/shop.model';
import { CustomerTag } from './customer-tag.model';

export interface Customer extends BaseDocument, Timestamp, Owner<User> {
	shop: Shop;
	addresses?: Address[];
	user?: User;
	name: string;
	birthday?: Date & string;
	age?: number;
	phone?: string;
	image?: Media;
	notes?: any;
	tags?: CustomerTag[];
	source?: 'local' | 'facebook';
	facebookId: string;
}

const CustomerSchema = new Schema<Customer>({
	facebookId: {
		type: String,
	},

	shop: {
		type: Types.ObjectId,
		ref: 'Shop',
	},

	addresses: [
		{
			type: Types.ObjectId,
			ref: 'Address',
		},
	],

	user: {
		type: Types.ObjectId,
		ref: 'User',
	},

	name: {
		type: String,
	},

	birthday: {
		type: Date,
	},

	age: {
		type: Number,
	},

	phone: {
		type: Number,
	},

	image: {
		type: Types.ObjectId,
		ref: 'Media',
	},

	notes: {
		type: Schema.Types.Mixed,
		default: {},
	},

	tags: [
		{
			type: Types.ObjectId,
			ref: 'CustomerTag',
		},
	],

	source: {
		type: String,
		enum: ['local', 'facebook'],
	},

	...Timestamp,
	...Owner,
});

class CustomerModel extends BaseModel<Customer> {}

export default new CustomerModel('Customer', CustomerSchema);
