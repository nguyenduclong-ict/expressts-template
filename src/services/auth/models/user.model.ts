import bcrypt from "@/helpers/base/bcrypt";
import { Context, Hook, Owner, Timestamp } from "@/helpers/base/model";
import { AppModel } from "@/services/base/model";
import shopModel, { Shop } from "@/services/sale/shop/shop.model";
import { Document, Schema, Model, Types } from "mongoose";
import permissionModel, { Permission } from "./permission.model";
import roleModel, { Role } from "./role.model";

export interface User extends Document, Timestamp, Owner<User> {
  password: string;
  username: string;
  email: string;
  facebookId?: string;
  confirmed: boolean;
  blocked: boolean;
  roles: Role[];
  customer: any;
  shop: string | Shop;
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
    ref: "Customer",
    required: false,
  },

  shop: {
    type: Types.ObjectId,
    ref: "Shop",
    required: false,
  },

  roles: [
    {
      type: Types.ObjectId,
      ref: "Role",
      required: false,
      default: [],
    },
  ],

  ...Timestamp,
  ...Owner,
});

export class UserModel extends AppModel<User> {
  @Hook("before", "create")
  async beforeCreate(context: Context<User>) {
    const data = context.data;
    data.password = await bcrypt.hash(data.password);
  }

  @Hook("after", "create")
  async afterCreate(context: Context<User>, response: User) {
    const roles = await roleModel.model.find({
      _id: { $in: response.roles },
    });

    if (roles.some((role) => role.isAdmin)) {
      response.set("blocked", true);
      await response.save();
    }

    if (response.confirmed) {
      const authenticatedRole = await roleModel.model.findOne({
        name: "Authenticated",
      });

      if (authenticatedRole) {
        response.roles.push(authenticatedRole.id);
        await response.save();
      }
    }

    return response;
  }

  async fetchUser(query: any) {
    let user = await this.model
      .findOne(query)
      .populate("shop")
      .populate("customer")
      .populate("roles")
      .populate("roles.permissons");

    let permissions: Permission[];

    if (user?.roles.some((role) => role.isAdmin)) {
      let ps = await permissionModel.find();
    } else {
      permissions = _.flatMap(user?.roles.map((role) => role.permissions));
    }
    _.set(user, "permissions", permissions);

    return user;
  }
}

export default new UserModel("User", UserSchema);
