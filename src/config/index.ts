import mongoose from 'mongoose';
import { env } from '@/helpers/base/env';
import path from 'path';

env.set('UPLOAD_PATH', env('UPLOAD_PATH') || path.resolve(__dirname, '../../upload'));

mongoose.set('toJSON', {
	virtuals: true,
	transform: (doc: any, converted: any) => {
		converted.id = doc._id;
		delete converted.__v;
		delete converted._id;
	},
});

function getConnection(uri: string, callback?: any) {
	const conn = mongoose.createConnection(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	});
	if (callback) {
		callback(conn);
	}
	return conn;
}

export default {
	connections: {
		default: getConnection(env('MONGO_URI')),
	},
};
