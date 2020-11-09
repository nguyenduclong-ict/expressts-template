import { Router } from "@/helpers/base/router";
import MdUser from "@/middlewares/user";

export class AppRouter extends Router {
  middlewares = [MdUser];
}
