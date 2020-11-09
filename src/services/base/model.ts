import { BaseModel } from "@/helpers/base/model";
import { Document } from "mongoose";

export class AppModel<T extends Document> extends BaseModel<T> {}
