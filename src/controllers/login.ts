/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";
import { oauthKakao } from "../services/login";

export const loginKakao: RequestHandler = (req, res, next) => {
  oauthKakao(req.query.code as string)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log("in controller : ", err));
};
