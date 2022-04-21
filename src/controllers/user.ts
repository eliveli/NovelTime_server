/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";
import { loginKakao } from "../services/user/login";

export const loginKakaoController: RequestHandler = (req, res, next) => {
  loginKakao(req.query.code as string)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log("in controller : ", err));
};
