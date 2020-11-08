import { BaseModel, Context, Hook } from "@/helpers/base/model";
import { Document, Schema } from "mongoose";

interface IUser extends Document {
  password: string;
  username: string;
  email: string;
  name?: string;
  facebookId?: string;
}

const UserSchema = new Schema<IUser>({
  username: String,
  password: String,
  email: String,
  name: String,
  facebookId: String,
});

class UserModel extends BaseModel<IUser> {
  @Hook("before", "list")
  beforeList(context: Context<IUser>) {
    console.log("Before list", context);
  }

  @Hook("after", "list")
  afterList(context: Context<IUser>, response: IUser) {
    console.log("After list", response);
    return response;
  }

  @Hook("before", "updateOne")
  beforeUpdateOne(context: Context<IUser>) {
    console.log(context);
  }

  @Hook("before", "create")
  beforeCreateOne(context: Context<IUser>) {
    console.log(
      "Before create",
      context,
      _.omitBy({ session: context.session }, _.isNil)
    );
  }
}

export default new UserModel("User", UserSchema);
