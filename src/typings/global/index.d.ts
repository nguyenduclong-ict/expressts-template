import { TApp } from "@/helpers/base/server";
import { Consola } from "consola";

declare var tapp: TApp;
declare var consola: Consola;

declare global {
  var consola: Consola;
  var tapp: TApp;
  var _;
}
