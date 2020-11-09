import { AppRouter } from "@/services/base/router";
import userController from "../controllers/user.controller";

export default new AppRouter(
  {
    base: "/users",
    routes: [{ path: "/list", method: "POST", handler: userController.list }],
    crud: true,
  },
  userController
);
