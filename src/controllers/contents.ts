/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/contents/getUserId";
import {
  getTalksOrRecommendsUserCreated,
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
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);
    const { talksUserCreated, recommendsUserCreated } = await getWritingsUserCreatedForUserPageHome(
      userId,
    );
    const { talksUserLikes, recommendsUserLikes } = await getWritingsUserLikesForUserPageHome(
      userId,
    );
    const commentsUserCreated = await getCommentsForUserPageHome(userId);
    const listsUserCreated = await getNovelListsUserCreatedForUserPageHome(userId);
    const listsUserLikes = await getNovelListsUserLikesForUserPageHome(userId);

    res.json({
      talksUserCreated,
      recommendsUserCreated,
      talksUserLikes,
      recommendsUserLikes,
      commentsUserCreated,
      novelLists: {
        listsUserCreated,
        listsUserLikes,
      },
    });
  } catch (error) {
    console.log("failed to get user's contents in userPageHomeController :", error);
    res.status(500).end();
  }
};

export const userPageMyWritingController: RequestHandler = async (req, res) => {
  try {
    const { userName, contentsType, order } = req.params;
    const userId = await getUserId(userName);
    if (contentsType === "T" || contentsType === "R") {
      const { talksOrRecommendsSet, isNextOrder } = await getTalksOrRecommendsUserCreated(
        userId,
        contentsType,
        Number(order),
      );
      res.json({ writingsUserCreated: talksOrRecommendsSet, isNextOrder });
    }
  } catch (error) {
    console.log("failed to get user's contents in userPageMyWritingController :", error);
    res.status(500).end();
  }
};
