import { env } from "@/helpers/base/env";
import { createConnection } from "mongoose";
import mongoose from "mongoose";

mongoose.set("toJSON", {
  virtuals: true,
  transform: (doc: any, converted: any) => {
    converted.id = doc._id;
    delete converted.__v;
    delete converted._id;
  },
});

function removeResponseId(conn: any) {
  conn.set("toJSON", {
    virtuals: true,
    transform: (doc: any, converted: any) => {
      converted.id = doc._id;
      delete converted.__v;
      delete converted._id;
    },
  });
}

function getConnection(uri: string, callback?: any) {
  const conn = createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
  callback(conn);
  return conn;
}

export default {
  connections: {
    default: getConnection(env("MONGO_URI"), removeResponseId),
  },
};
