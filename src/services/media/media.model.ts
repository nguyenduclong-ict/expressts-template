import { AppModel } from "@/services/base/model";
import { Owner, Timestamp } from "@/helpers/base/model";
import { Document, Schema, Types } from "mongoose";

export interface Media extends Document, Timestamp, Owner<any> {
  filePath: string;
  size: number;
  ext: string;
  name: string;
  meta: {
    alt: string;
    title: string;
  };
  thumbs: {
    128: Media;
    512: Media;
  };
}

const MediaSchema = new Schema<Media>({
  filePath: {
    type: String,
  },

  ext: {
    type: String,
  },

  size: {
    type: Number,
    default: 0,
  },

  name: {
    type: String,
  },

  thumbs: {
    type: Schema.Types.Mixed,
    default: {},
  },

  ...Timestamp,
  ...Owner,
});

MediaSchema.virtual("url", {});

export class MediaModel extends AppModel<Media> {}

export default new MediaModel("Media", MediaSchema);
