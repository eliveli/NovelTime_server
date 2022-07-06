/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/contents/getUserId";
import { getWritingsUserCreated, getWritingsUserLikes } from "../services/contents/getWritings";
import getComments from "../services/contents/getComments";

dotenv.config();

export const userPageHomeController: RequestHandler = async (req, res) => {
  const { userName } = req.params;
  const userId = await getUserId(userName);
  const writingsUserCreated = await getWritingsUserCreated(userId);
  const writingsUserLikes = await getWritingsUserLikes(userId);
  const comments = await getComments(userId);
  console.log("writingsUserCreated:", writingsUserCreated);
  console.log("writingsUserLikes:", writingsUserLikes);
  console.log("comments:", comments);
};
