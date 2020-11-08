import _, { curry } from "lodash";
import path from "path";
import consola from "consola";
import { BaseModel, Context } from "./model";
import { RequestHandler } from "./express";
import { parseJSON } from "./utils";

type RequestMethod = "POST" | "PUT" | "GET" | "DELETE" | "PATH" | "OPTIONS";
type Crud =
  | "list"
  | "find"
  | "findOne"
  | "update"
  | "updateOne"
  | "create"
  | "delete";

type CrudItem = {
  method?: RequestMethod;
  path?: string;
  middlewares?: RequestHandler[];
  handler?: RequestHandler;
  name?: string;
};

export interface Route {
  method: RequestMethod;
  path: string;
  middlewares?: RequestHandler[];
  handler: RequestHandler;
  extend?: boolean;
}

export interface RouterConfig {
  base?: string;
  middlewares?: RequestHandler[];
  routes: Route[];
  crud?: boolean | { [x: string]: CrudItem };
}

export function Router(config: RouterConfig, controler?: Controllers) {
  config = _.defaultsDeep(config, {
    base: "/",
    middlewares: [],
    routes: [],
    crud: false,
  });

  config.routes.map((route) => {
    if (!_.isString(route.path)) {
      throw new Error("path require in route");
    }

    if (
      !["POST", "PUT", "GET", "DELETE", "PATH", "OPTIONS"].includes(
        route.method
      )
    ) {
      throw new Error(`Method ${route.method} not accepted!`);
    }

    if (!route.handler) {
      throw new Error(`No handler for route ${route.path}`);
    }

    route = _.defaultsDeep(route, {
      middlewares: [],
      extend: true,
    });

    route.middlewares = [
      ...(config.middlewares || []),
      ...(route.middlewares || []),
    ];

    if (route.extend) {
      route.path = path.join(config.base || "/", route.path);
    }

    return route;
  });

  if (config.crud) {
    const df = {
      list: {
        name: "list",
        path: "/",
        method: "GET",
        handler: "list",
        middlewares: [],
      },
      find: {
        name: "find",
        path: "/find",
        method: "GET",
        handler: "find",
        middlewares: [],
      },
      findOne: {
        name: "findOne",
        path: "/find-one",
        method: "GET",
        handler: "findOne",
        middlewares: [],
      },
      create: {
        name: "create",
        path: "/",
        method: "POST",
        handler: "create",
        middlewares: [],
      },
      update: {
        name: "update",
        path: "/",
        method: "PUT",
        handler: "update",
        middlewares: [],
      },
      updateOne: {
        name: "updateOne",
        path: "/update-one",
        method: "PUT",
        handler: "updateOne",
        middlewares: [],
      },
      delete: {
        name: "delete",
        path: "/",
        method: "DELETE",
        handler: "delete",
        middlewares: [],
      },
    };

    if (_.isBoolean(config.crud) && config.crud) {
      // @ts-ignore
      config.crud = df;
    } else if (_.isBoolean(config.crud) && !config.crud) {
      config.crud = false;
    } else {
      config.crud = _.defaultsDeep(config.crud, df);
    }

    Object.keys(config.crud as any).forEach((key: any) => {
      // @ts-ignore
      const c: CrudItem = config.crud[key];
      // @ts-ignore
      if (c === false) {
        return;
      }

      config.routes.push({
        method: c.method as RequestMethod,
        path: path
          .join(config.base || "/", c.path as string)
          .replace(/\/$/, ""),
        handler: _.get(controler, c.name as string) as any,
        middlewares: c.middlewares,
      });
    });
  }

  return config;
}

export function getRequestFunction(app: any, method: RequestMethod) {
  switch (method) {
    case "GET":
      return app.get;

    case "POST":
      return app.post;

    case "PUT":
      return app.put;

    case "DELETE":
      return app.delete;

    case "OPTIONS":
      return app.options;
  }
}

interface Controllers {
  // @ts-ignore
  find?: RequestHandler;
  // @ts-ignore
  list?: RequestHandler;
  // @ts-ignore
  findOne?: RequestHandler;
  // @ts-ignore
  update?: RequestHandler;
  // @ts-ignore
  updateOne?: RequestHandler;
  // @ts-ignore
  create?: RequestHandler;
  // @ts-ignore
  delete?: RequestHandler;
  [x: string]: RequestHandler;
}

function parseQuery(query: any) {
  const result: any = {};
  Object.keys(query).forEach((key) => {
    const value = query[key];
    result[key] = parseJSON(value);
  });
  return result;
}

export function Controller(config: Controllers, model: BaseModel<any>) {
  if (model) {
    config = {
      list: async (req, res, next) => {
        let params = req.method === "GET" ? parseQuery(req.query) : req.body;
        params = _.defaultsDeep(params, {
          query: {},
          populate: [],
        });
        const context: Context = { ...params, state: req.state };
        const response = await model.list(context);
        res.json(response);
      },

      find: async (req, res, next) => {
        const params = req.method === "GET" ? parseQuery(req.query) : req.body;
        const context: Context = { ...params, state: req.state };
        const response = await model.find(context);
        res.json(response);
      },

      findOne: async (req, res, next) => {
        const params = req.method === "GET" ? parseQuery(req.query) : req.body;
        const context: Context = { ...params, state: req.state };
        const response = await model.findOne(context);
        res.json(response);
      },

      update: async (req, res, next) => {
        const params = req.body;
        const context: Context = { ...params, state: req.state };
        const response = await model.update(context);
        res.json(response);
      },

      updateOne: async (req, res, next) => {
        const params = req.body;
        const context: Context = { ...params, state: req.state };
        const response = await model.updateOne(context);
        res.json(response);
      },

      create: async (req, res, next) => {
        const params = req.body;
        const context: Context = { data: params, state: req.state };
        const response = await model.create(context);
        res.json(response);
      },

      delete: async (req, res, next) => {
        const params = req.body;
        const context: Context = { ...params, state: req.state };
        const response = await model.update(context);
        res.json(response);
      },

      ...config,
    };
  }
  return config;
}
