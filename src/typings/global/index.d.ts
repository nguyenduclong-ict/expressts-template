import { TApp } from '@/helpers/base/server';
import { Consola } from 'consola';

declare let tapp: TApp;
declare let consola: Consola;

declare global {
	let consola: Consola;
	let tapp: TApp;
	let _;
}
