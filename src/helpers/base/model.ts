import config from "@/config";
import _ from "lodash";
import {
  Model,
  Document,
  model,
  Schema,
  FilterQuery,
  Connection,
} from "mongoose";
import { seqPromises, waterFallPromises } from "./utils";

interface FindOptions<T> {
  query?: FilterQuery<T>;
  data?: T;
  populate?:
    | string
    | string[]
    | { path: string; select: string; model: string }[];
  skip?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
  sort?: string[];
  new?: boolean;
  projection?: any;
  session?: any;
}

/* HOOK DECORATOR */

type HookAction =
  | "list"
  | "find"
  | "findOne"
  | "create"
  | "update"
  | "updateOne"
  | "delete";

type HookTrigger = "before" | "after";

interface HookItem {
  trigger: HookTrigger;
  action: HookAction;
  handler: string;
}

export function Hook(trigger: HookTrigger, actions: HookAction | HookAction[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    actions = Array.isArray(actions) ? actions : [actions];
    target.hooks = target.hooks || [];

    actions.forEach((action) => {
      target.hooks.push({ trigger, action, handler: propertyKey });
    });
  };
}

export interface ListResponse<T extends Document = any> {
  data: T[];
  limit: number;
  skip: number;
  page: number;
  pageSize: number;
  total: number;
}

export interface Context<T = any> extends FindOptions<T> {
  state?: any;
}

function defaultContext(context: any, df?: any) {
  context = _.defaultsDeep(
    context,
    {
      page: 1,
      pageSize: 10,
      limit: 10,
      skip: 0,
      new: true,
    },
    df
  );
  context.page = context.page || 1;
  context.pageSize = context.pageSize || 10;
  context.limit = context.limit || context.pageSize;
  context.skip = context.skip || context.limit * (context.page - 1);
}

export class BaseModel<T extends Document> {
  model!: Model<T>;

  async list(context: Context<T> = {}): Promise<ListResponse<T>> {
    defaultContext(context);
    const tasks = [
      ...this.getHooks("before", "list").map((func) => () => func(context)),
      async () => {
        const [data, counts] = await Promise.all([
          this.model.find(
            context.query as any,
            undefined,
            _.pick(context, [
              "populate",
              "skip",
              "limit",
              "page",
              "pageSize",
              "projection",
              "sort",
              "session",
            ]) as any
          ),
          this.model.countDocuments(context.query as any),
        ]);

        return {
          data,
          limit: context.limit,
          skip: context.skip,
          page: Math.ceil(counts / (context.limit || 10)),
          pageSize: context.pageSize,
          total: counts,
        };
      },
      ...this.getHooks("after", "list").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  async find(context: Context<T> = {}): Promise<T[]> {
    defaultContext(context, { limit: 100 });
    const tasks = [
      ...this.getHooks("before", "find").map((func) => () => func(context)),
      () =>
        this.model.find(
          context.query as any,
          undefined,
          _.omitBy(
            _.pick(context, [
              "populate",
              "skip",
              "limit",
              "page",
              "pageSize",
              "projection",
              "sort",
              "session",
            ]),
            _.isNil
          )
        ),
      ...this.getHooks("after", "find").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  findOne(context: Context<T> = {}) {
    defaultContext(context);
    const tasks = [
      ...this.getHooks("before", "findOne").map((func) => () => func(context)),
      () =>
        this.model.findOne(
          context.query as any,
          undefined,
          _.omitBy(
            _.pick(context, ["populate", "projection", "session"]),
            _.isNil
          )
        ),
      ...this.getHooks("after", "findOne").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  create(context: Context<T> = {}) {
    defaultContext(context);
    const tasks = [
      ...this.getHooks("before", "create").map((func) => () => func(context)),
      () => {
        let options: any = _.omitBy({ session: context.session }, _.isNil);
        options = _.isEmpty(options) ? undefined : options;
        return this.model.create(context.data as any, options);
      },
      ...this.getHooks("after", "create").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  update(context: Context<T> = {}) {
    defaultContext(context);
    const tasks = [
      ...this.getHooks("before", "update").map((func) => () => func(context)),
      () => {
        if (context.new) {
          return this.model
            .find(context.query as any, undefined, { projection: "id" })
            .then((docs) =>
              this.model
                .updateMany(context.query as any, context.data as any)
                .then(() =>
                  this.model.find(
                    {
                      _id: docs.map((doc) => doc.id),
                    } as any,
                    undefined,
                    _.omitBy(
                      _.pick(context, ["populate", "projection", "session"]),
                      _.isNil
                    ) as any
                  )
                )
            );
        } else {
          return this.model.updateMany(
            context.query as any,
            context.data as any,
            _.omitBy({ session: context.session }, _.isNil)
          );
        }
      },
      ...this.getHooks("after", "update").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  updateOne(context: Context<T> = {}) {
    defaultContext(context);
    const tasks = [
      ...this.getHooks("before", "updateOne").map((func) => () =>
        func(context)
      ),
      () =>
        this.model.findOneAndUpdate(
          context.query as any,
          context.data as any,
          _.omitBy(
            _.pick(context, ["populate", "projecton", "session"]),
            _.isNil
          )
        ),
      ...this.getHooks("after", "updateOne").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  delete(context: Context<T> = {}) {
    defaultContext(context);
    const tasks = [
      ...this.getHooks("before", "delete").map((func) => () => func(context)),
      () =>
        this.model.deleteMany(
          context.query as any,
          _.omitBy({ session: context.session }, _.isNil)
        ),
      ...this.getHooks("after", "delete").map((func) => (response: any) =>
        func(context, response)
      ),
    ];

    return waterFallPromises(tasks);
  }

  getHooks(trigger: HookTrigger, action: HookAction) {
    const result: any[] = [];
    const hooks: HookItem[] = _.get(this, "hooks", []);
    hooks.forEach((item) => {
      if (item.trigger === trigger && item.action === action) {
        result.push(_.get(this, item.handler));
      }
    });
    return result;
  }

  constructor(name: string, schema: Schema, connection: any = "default") {
    if (typeof connection === "string") {
      connection = _.get(config.connections, connection);
    }

    if (!connection) {
      throw new Error(
        "Model : " + name + " not found connection " + connection
      );
    }

    if (!schema) {
      throw new Error("Model : " + name + " not found schema");
    }

    if (schema) {
      this.model = connection.model(name, schema);
    }
  }
}
