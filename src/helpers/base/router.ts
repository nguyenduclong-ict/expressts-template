import _, { curry } from 'lodash';
import path from 'path';
import consola from 'consola';
import { BaseModel, Context } from './model';
import { RequestHandler } from './express';
import { parseJSON } from './utils';

type RequestMethod = 'POST' | 'PUT' | 'GET' | 'DELETE' | 'PATH' | 'OPTIONS';
type Crud = 'list' | 'find' | 'findOne' | 'update' | 'updateOne' | 'create' | 'delete';

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

export class Router {
	config!: RouterConfig;
	controller!: Controllers;
	middlewares: RequestHandler[] = [];

	constructor(config: RouterConfig, controller?: Controllers) {
		this.config = config;
		if (controller) {
			this.controller = controller;
		}
	}

	getConfig() {
		const config: RouterConfig = _.defaultsDeep(this.config, {
			base: '/',
			routes: [],
			crud: false,
		});
		config.middlewares = [...this.middlewares, ...(config.middlewares || [])];
		config.routes.map((route) => {
			if (!_.isString(route.path)) {
				throw new Error('path require in route');
			}

			if (!['POST', 'PUT', 'GET', 'DELETE', 'PATH', 'OPTIONS'].includes(route.method)) {
				throw new Error(`Method ${route.method} not accepted!`);
			}

			if (!route.handler) {
				throw new Error(`No handler for route ${route.path}`);
			}

			route = _.defaultsDeep(route, {
				middlewares: [],
				extend: true,
			});

			route.middlewares = [...config.middlewares, ...route.middlewares];

			if (route.extend) {
				route.path = path.join(this.config.base || '/', route.path);
			}
			return route;
		});

		if (config.crud) {
			const df = {
				list: {
					name: 'list',
					path: '/list',
					method: 'POST',
					handler: 'list',
					middlewares: [] as any,
				},
				find: {
					name: 'find',
					path: '/find',
					method: 'POST',
					handler: 'find',
					middlewares: [] as any,
				},
				findOne: {
					name: 'findOne',
					path: '/find-one',
					method: 'GET',
					handler: 'findOne',
					middlewares: [] as any,
				},
				create: {
					name: 'create',
					path: '/',
					method: 'POST',
					handler: 'create',
					middlewares: [] as any,
				},
				update: {
					name: 'update',
					path: '/',
					method: 'PUT',
					handler: 'update',
					middlewares: [] as any,
				},
				updateOne: {
					name: 'updateOne',
					path: '/update-one',
					method: 'PUT',
					handler: 'updateOne',
					middlewares: [] as any,
				},
				delete: {
					name: 'delete',
					path: '/',
					method: 'DELETE',
					handler: 'delete',
					middlewares: [] as any,
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
					path: path.join(this.config.base || '/', c.path as string).replace(/\/$/, ''),
					handler: _.get(this.controller, c.name as string) as any,
					middlewares: config.middlewares.concat(c.middlewares),
				});
			});
		}

		return config;
	}
}

export function getRequestFunction(app: any, method: RequestMethod) {
	switch (method) {
		case 'GET':
			return app.get;

		case 'POST':
			return app.post;

		case 'PUT':
			return app.put;

		case 'DELETE':
			return app.delete;

		case 'OPTIONS':
			return app.options;
	}
}

interface Controllers {
	find?: RequestHandler;
	list?: RequestHandler;
	findOne?: RequestHandler;
	update?: RequestHandler;
	updateOne?: RequestHandler;
	create?: RequestHandler;
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

export class Controller {
	config!: Controllers;
	model!: BaseModel<any>;

	constructor(config: Controllers, model?: BaseModel<any>) {
		this.config = config;
		if (model) {
			this.model = model;
		}
	}

	getConfig() {
		let config: Controllers = {} as any;
		if (this.model) {
			config = {
				list: async (req, res, next) => {
					try {
						let params = req.method === 'GET' ? parseQuery(req.query) : req.body;
						params = _.defaultsDeep(params, {
							query: {},
							populate: [],
						});
						const context: Context<any> = { ...params, state: req.state };
						const response = await this.model.list(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				find: async (req, res, next) => {
					try {
						const params = req.method === 'GET' ? parseQuery(req.query) : req.body;
						const context: Context<any> = { ...params, state: req.state };
						const response = await this.model.find(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				findOne: async (req, res, next) => {
					try {
						const params = req.method === 'GET' ? parseQuery(req.query) : req.body;
						const context: Context<any> = { ...params, state: req.state };
						const response = await this.model.findOne(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				update: async (req, res, next) => {
					try {
						const params = req.body;
						const context: Context<any> = { ...params, state: req.state };
						const response = await this.model.update(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				updateOne: async (req, res, next) => {
					try {
						const params = req.body;
						const context: Context<any> = { ...params, state: req.state };
						const response = await this.model.updateOne(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				create: async (req, res, next) => {
					try {
						const params = req.body;
						const context: Context<any> = { data: params, state: req.state };
						const response = await this.model.create(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				delete: async (req, res, next) => {
					try {
						const params = req.body;
						const context: Context<any> = { ...params, state: req.state };
						const response = await this.model.update(context);
						res.json(response);
					} catch (error) {
						next(error);
					}
				},

				...this.config,
			};
		} else {
			config = this.config;
		}

		return config;
	}
}
