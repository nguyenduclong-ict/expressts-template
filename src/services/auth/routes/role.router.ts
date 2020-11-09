import { AppRouter } from "@/services/base/router";
import roleController from "../controllers/role.controller";

export default new AppRouter(
  {
    base: "/roles",
    routes: [],
    crud: true,
  },
  roleController
);
