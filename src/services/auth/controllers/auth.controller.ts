import bcrypt from "@/helpers/base/bcrypt";
import { AppError } from "@/helpers/base/error";
import jwt from "@/helpers/base/jwt";
import { Controller } from "@/helpers/base/router";
import tokenModel from "../models/token.model";
import userModel from "../models/user.model";

export default new Controller({
  async login(req, res, next) {
    try {
      const username = req.body.username;
      let user = await userModel.fetchUser({ username });

      if (!user) {
        return next(
          new AppError({ code: 401, message: `Tài khoản không tồn tại!` })
        );
      }

      if (user.blocked) {
        return next(
          new AppError({ code: 401, message: `Tài khoản đang bị khóa` })
        );
      }

      const valid = await bcrypt.compare(req.body.password, user.password);

      if (!valid) {
        return next(
          new AppError({ code: 401, message: `Mật khẩu không chính xác` })
        );
      }

      let jwtString = jwt.sign({ id: user.id }, { expiresIn: "7d" });

      await tokenModel.create({
        data: {
          token: jwtString,
          user: user.id,
        },
        state: req.state,
      });

      res.json({
        token: jwtString,
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  facebook(req, res, next) {},

  async register(req, res, next) {
    try {
      const user = await userModel.create({ data: req.body });
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    if (req.state.token) {
      await tokenModel.model.deleteOne({
        token: req.state.token,
        user: req.state.user?.id,
      });
    }
    res.sendStatus(200);
  },

  me(req, res, next) {
    res.json(req.state?.user);
  },
}).getConfig();
