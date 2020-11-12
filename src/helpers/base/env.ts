import _ from 'lodash';
import { parseBool } from './utils';

const env: ((name: string, defaultValue?: any) => string) & {
	int: (name: string, defaultValue?: any) => number;
	bool: (name: string, defaultValue?: any) => boolean;
	set: (name: string, value: any) => void;
} = ((name: string, defaultValue?: any) => {
	return process.env[name] === undefined ? defaultValue : process.env[name];
}) as any;

env.int = (name: string, defalutValue?: any) => parseInt(env(name, defalutValue));

env.bool = (name: string, defalutValue?: any) => parseBool(env(name, defalutValue));

env.set = (name: string, value: any) => {
	process.env[name] = value;
};

export { env };
