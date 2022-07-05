/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/contents/getUserId";
import getWritings from "../services/contents/getWritings";

dotenv.config();

export const userPageHomeController: RequestHandler = async (req, res) => {
  const { userName } = req.params;
  const userId = await getUserId(userName);
  const writings = await getWritings(userId);
  console.log("writings:", writings);
};
