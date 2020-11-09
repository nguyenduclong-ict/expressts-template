import { BaseModel, Owner, Timestamp } from "@/helpers/base/model";
import { Document, Schema, Types } from "mongoose";
import slugify from "slugify";
import { Permission } from "./permission.model";
import { User } from "./user.model";

export interface Role extends Document, Timestamp, Owner<User> {
  name: string;
  description: string;
  key: string;
  permissions: string[] | Permissions[];
  isAdmin: boolean;
  token: string;
}

const RoleSchema = new Schema<Role>({
  name: {
    type: String,
    required: true,
  },

  key: {
    type: String,
    index: "key_shop",
    default: function () {
      const ctx: Role = this as any;
      return slugify(ctx.name, { lower: true, replacement: "_" });
    },
    unique: true,
  },

  description: {
    type: String,
  },

  shop: {
    type: Types.ObjectId,
    ref: "Shop",
    index: "key_shop",
    unique: true,
  },

  permissions: [
    {
      type: Types.ObjectId,
      ref: "Permission",
    },
  ],

  isAdmin: {
    type: Boolean,
    default: false,
  },

  ...Timestamp,
  ...Owner,
});

RoleSchema.virtual("token").get(function getToken() {
  // @ts-ignore
  const context: any = this;
  return [(context.shop || "").toString(), context.key]
    .filter((e) => !!e)
    .join(":");
});

class RoleModel extends BaseModel<Role> {}

export default new RoleModel("Role", RoleSchema);
