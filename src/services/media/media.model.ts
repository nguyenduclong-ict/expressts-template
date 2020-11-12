import { BaseDocument, Context, Hook, Owner, Timestamp } from '@/helpers/base/model';
import { AppModel } from '@/services/base/model';
import { Schema, Types } from 'mongoose';
import mime from 'mime-types';
import { bytesToKbytes, download, fileStat } from '@/helpers/media';
import sharp from 'sharp';
import path from 'path';
import { env } from '@/helpers/base/env';
import { Shop } from '../sale/shop/shop.model';

export interface Media extends BaseDocument, Timestamp, Owner<any> {
	filePath: string;
	size: number;
	ext: string;
	mimeType?: any;
	name?: string;
	meta?: {
		alt: string;
		title: string;
	};
	thumbnails?: {
		128: string;
		512: string;
	};
	shop: Shop;
	// virtual
	url?: string;
	thumbs?: {
		128: string;
		512: string;
	};
}

const MediaSchema = new Schema<Media>({
	name: {
		type: String,
		unique: true,
	},

	filePath: {
		type: String,
	},

	ext: {
		type: String,
	},

	mimeType: {
		type: String,
	},

	size: {
		type: Number,
		default: 0,
	},

	thumbnails: {
		type: Schema.Types.Mixed,
		default: {},
	},

	shop: {
		type: Types.ObjectId,
		ref: 'Shop',
	},

	...Timestamp,
	...Owner,
});

MediaSchema.virtual('url').get(function () {
	// @ts-ignore
	const ctx: Media & Document = this;
	return [env('SERVER_URL'), 'media/file', ctx.name].join('/');
});

MediaSchema.virtual('thumbs').get(function () {
	// @ts-ignore
	const ctx: Media & Document = this;
	const thumbs: any = {};
	Object.keys(ctx.thumbnails).forEach((key) => {
		thumbs[key] = ctx.url + '?thumb=' + key;
	});
	return thumbs;
});

export class MediaModel extends AppModel<Media> {
	@Hook('before', 'create')
	private async beforeCreate(context: Context<Media>) {
		context.data.mimeType = context.data.mimeType || mime.lookup(context.data.ext);
		const stats = await fileStat(context.data.filePath);
		context.data.size = bytesToKbytes(stats.size);

		if (!context.data.thumbnails) {
			const fp = path.parse(context.data.filePath);
			const thumb128 = path.resolve(fp.dir, fp.name + '_128' + fp.ext);
			const thumb512 = path.resolve(fp.dir, fp.name + '_512' + fp.ext);
			await Promise.all([
				sharp(context.data.filePath).resize(128, 128).toFile(thumb128),
				sharp(context.data.filePath).resize(512, 512).toFile(thumb512),
			]);
			context.data.thumbnails = {
				'128': thumb128,
				'512': thumb512,
			};
		}
	}

	async download(url: string, filename?: string, context?: Context<Media>) {
		context = context || {};
		filename = filename || path.basename(url);
		const savePath = path.resolve(env('UPLOAD_PATH'), filename);
		const file: any = await download(url, savePath);
		return this.create({ ...context, data: file });
	}
}

export default new MediaModel('Media', MediaSchema);
