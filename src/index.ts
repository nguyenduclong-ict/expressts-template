import "@/config/env";
import _ from "lodash";
import consola from "consola";
import express, { Router } from "express";
import http from "http";
import { requireFolder, seqPromises } from "./helpers/base/utils";
import { getRequestFunction } from "./helpers/base/router";
import morgan from "morgan";
import { env } from "./helpers/base/env";
import path from "path";
import cors from "cors";

_.set(global, "_", _);
_.set(global, "consola", consola);
_.set(global, "tapp", {});

(async () => {
  tapp.app = express();
  tapp.app.use(morgan("dev"));

  /* BOOSTRAPS */
  const bootstrapsModules = await requireFolder(
    path.resolve(__dirname, "./config/bootstrap"),
    { files: ["*.ts", "*.js"] }
  );
  await seqPromises(bootstrapsModules.map((bm) => () => bm.module.default()));

  /* PLUGINS */
  tapp.app.use(express.json());
  tapp.app.use(express.static(path.resolve(__dirname, "../public")));
  tapp.app.use(cors());

  /* ROUTES */
  const routeModules = await requireFolder(
    path.resolve(__dirname, "./services"),
    {
      files: ["*.router.js", "*.router.ts"],
      deep: 100,
    }
  );
  const router = Router();
  routeModules.forEach((item) => {
    item.module.default.routes.forEach((route: any) => {
      const api = getRequestFunction(router, route.method);
      api.call(router, route.path, ...route.middlewares, route.handler);
    });
  });

  tapp.app.use(router);
  tapp.server = http.createServer(tapp.app);
  const host = env("HOST", "localhost");
  const port = env.int("PORT", 3000);
  tapp.server.listen(port, host, () => {
    console.log(`Server listen on http://${host}:${port}`);
  });
})();
