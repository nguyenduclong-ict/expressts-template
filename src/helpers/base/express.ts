import { NextFunction, Request, Response } from "express";

export interface RequestHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> {
  // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2
  (
    req: Request<P, ResBody, ReqBody, ReqQuery> & { state: any },
    res: Response<ResBody>,
    next: NextFunction
  ): any;
}
