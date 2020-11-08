import { Router } from "@/helpers/base/router";
import userController from "./user.controller";

export default Router(
  {
    base: "/users",
    routes: [
      {
        method: "GET",
        path: "/test",
        handler: async (req, res, next) => {
          res.json("ok");
        },
      },
    ],
    crud: true,
  },
  userController
);
