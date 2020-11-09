import { BaseModel, Owner, Timestamp } from "@/helpers/base/model";
import { User } from "@/services/auth/models/user.model";
import { Document, Schema, Types } from "mongoose";
import { Shop } from "../shop/shop.model";

export interface Address extends Document, Timestamp, Owner<User> {
  province: string;
  district: string;
  ward: string;
  street: string;
  isPrimary: boolean;
  full: string;
  country: string;
  shop: string | Shop;
}

const AddressSchema = new Schema<Address>({
  ...Timestamp,
  ...Owner,
});

class ShopModel extends BaseModel<Shop> {}

export default new ShopModel("Address", AddressSchema);
