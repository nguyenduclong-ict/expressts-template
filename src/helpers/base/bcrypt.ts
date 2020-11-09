import bcrypt from "bcrypt";

export default {
  hash: (text: string) => bcrypt.hash(text, bcrypt.genSaltSync()),
  compare: (text: string, encrypted: string) => bcrypt.compare(text, encrypted),
};
