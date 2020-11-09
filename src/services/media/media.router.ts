import { Router } from "@/helpers/base/router";
import mediaController from "./media.controller";

export default new Router(
  {
    base: "/demo",
    routes: [],
  },
  mediaController
);
