/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";

import getUserId from "../services/contents/getUserId";

dotenv.config();

export const userPageHomeController: RequestHandler = (req, res) => {
  const { userName } = req.params;
  getUserId(userName)
    .then((data) => {
      console.log("userId from getUserId:", data[0].userId);
    })

    .catch((err) => console.log("in controller : ", err));
};
