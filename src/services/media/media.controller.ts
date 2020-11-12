import { Controller } from '@/helpers/base/router';
import mediaModel from './media.model';

export default new Controller(
	{
		file: async (req, res, next) => {
			const name = req.params.name;
			const thumb = req.query.thumb;
			const media = await mediaModel.findOne({ query: { name } });
			if (!media) {
				return res.sendStatus(404);
			}
			if (thumb && _.get(media, 'thumbnails.' + thumb)) {
				return res.sendFile(_.get(media, `thumbnails.${thumb}`));
			}
			return res.sendFile(media.filePath);
		},
	},
	mediaModel,
).getConfig();
