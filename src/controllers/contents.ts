/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/contents/getUserId";
import {
  getWritingsUserCreatedForMyWriting,
  getWritingsUserCreatedForUserPageHome,
  getWritingsUserLikesForOthersWriting,
  getWritingsUserLikesForUserPageHome,
} from "../services/contents/getWritings";
import {
  getCommentsForMyWriting,
  getCommentsForUserPageHome,
} from "../services/contents/getComments";
import {
  getNovelListsUserCreatedForMyList,
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
      const { talksOrRecommendsSet, isNextOrder } = await getWritingsUserCreatedForMyWriting(
        userId,
        contentsType,
        Number(order),
      );
      res.json({ writingsUserCreated: talksOrRecommendsSet, isNextOrder });
    }

    if (contentsType === "C") {
      const { commentsSet, isNextOrder } = await getCommentsForMyWriting(userId, Number(order));
      res.json({
        commentsUserCreated: commentsSet,
        isNextOrder,
      });
    }
  } catch (error) {
    console.log("failed to get user's contents in userPageMyWritingController :", error);
    res.status(500).end();
  }
};
export const userPageOthersWritingController: RequestHandler = async (req, res) => {
  try {
    const { userName, contentsType, order } = req.params;
    const userId = await getUserId(userName);
    const { talksOrRecommendsSet, isNextOrder } = await getWritingsUserLikesForOthersWriting(
      userId,
      contentsType as "T" | "R",
      Number(order),
    );
    res.json({ writingsUserLikes: talksOrRecommendsSet, isNextOrder });
  } catch (error) {
    console.log("failed to get user's contents in userPageMyWritingController :", error);
    res.status(500).end();
  }
};
export const userPageMyListController: RequestHandler = async (req, res) => {
  try {
    const { loginUserId, userNameInUserPage, listId, order } = req.params;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    const { novelList, isNextOrder } = await getNovelListsUserCreatedForMyList(
      userIdInUserPage,
      listId,
      Number(order),
      loginUserId,
    );
    res.json({ novelList, isNextOrder });
  } catch (error) {
    console.log("failed to get user's contents in userPageMyListController :", error);
    res.status(500).end();
  }
};
