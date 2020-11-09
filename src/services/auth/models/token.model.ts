import { Owner, Timestamp } from "@/helpers/base/model";
import { AppModel } from "@/services/base/model";
import { Document, Schema, Types } from "mongoose";
import { User } from "./user.model";

export interface Token extends Document, Timestamp, Owner<any> {
  token: string;
  user: User;
  data?: any;
}

const TokenSchema = new Schema<Token>({
  token: {
    type: String,
    required: true,
  },

  user: {
    type: Types.ObjectId,
    ref: "User",
  },

  data: {
    type: Schema.Types.Mixed,
    default: {},
  },

  ...Timestamp,
  ...Owner,
});

export class TokenModel extends AppModel<Token> {}

export default new TokenModel("Token", TokenSchema);
