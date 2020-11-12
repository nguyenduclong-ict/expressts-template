import { BaseDocument, BaseModel, Owner, Timestamp } from '@/helpers/base/model';
import { User } from '@/services/auth/models/user.model';
import { Schema, Types } from 'mongoose';
import { Shop } from '../shop/shop.model';

export interface CustomerTag extends BaseDocument, Timestamp, Owner<User> {
	name: string;
	description: string;
	color: string;
	shop: Shop;
}

const CustomerTagSchema = new Schema<CustomerTag>({
	name: {
		type: String,
		index: 'name_shop',
		unique: true,
	},

	description: {
		type: String,
	},

	color: {
		type: String,
	},

	shop: {
		type: Types.ObjectId,
		ref: 'Shop',
		index: 'name_shop',
	},

	...Timestamp,
	...Owner,
});

class CustomerTagModel extends BaseModel<CustomerTag> {}

export default new CustomerTagModel('CustomerTag', CustomerTagSchema);
