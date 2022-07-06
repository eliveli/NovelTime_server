/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/contents/getUserId";
import {
  getWritingsUserCreatedForUserPageHome,
  getWritingsUserLikesForUserPageHome,
} from "../services/contents/getWritings";
import getCommentsForUserPageHome from "../services/contents/getComments";
import {
  getNovelListsUserCreatedForUserPageHome,
  getNovelListsUserLikesForUserPageHome,
} from "../services/contents/getNovelLists";

dotenv.config();

export const userPageHomeController: RequestHandler = async (req, res) => {
  const { userName } = req.params;
  const userId = await getUserId(userName);
  const writingsUserCreated = await getWritingsUserCreatedForUserPageHome(userId);
  const writingsUserLikes = await getWritingsUserLikesForUserPageHome(userId);
  const comments = await getCommentsForUserPageHome(userId);
  const novelListsUserCreated = await getNovelListsUserCreatedForUserPageHome(userId);
  const novelListsUserLikes = await getNovelListsUserLikesForUserPageHome(userId);

  console.log("userId:", userId);
  console.log("writingsUserCreated:", writingsUserCreated);
  console.log("writingsUserLikes:", writingsUserLikes);
  console.log("comments:", comments);
  console.log("novelListsUserCreated:", novelListsUserCreated);
  console.log("novelListsUserLikes:", novelListsUserLikes);

  //   .then(async (userInfo) => {
  //       return res.json({ accessToken, userInfo });
  //     } catch (e) {
  //       console.log("failed to generate token or set cookie : ", e);
  //     }
  //   })
  // .catch((err) => console.log("in controller : ", err));
};
