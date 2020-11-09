import baseJwt from "jsonwebtoken";
import { env } from "./env";

const SECRET = env("JWT", "5f5d92d2995a166cc6db060f");

let jwt = {
  sign(payload: string | object, options?: baseJwt.SignOptions) {
    return baseJwt.sign(payload, SECRET, options);
  },
  verify(payload: string, options?: baseJwt.VerifyOptions) {
    return baseJwt.verify(payload, SECRET, options);
  },
};

export default jwt;
