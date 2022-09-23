/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/content/getUserId";
import {
  getWritingsUserCreatedForMyWriting,
  getWritingsUserCreatedForUserPageHome,
  getWritingsUserLikesForOthersWriting,
  getWritingsUserLikesForUserPageHome,
} from "../services/content/getWritings";
import {
  getCommentsForMyWriting,
  getCommentsForUserPageHome,
} from "../services/content/getComments";
import {
  getNovelListUserCreatedForMyList,
  getNovelListsUserCreatedForUserPageHome,
  getNovelListUserLikesForOthersList,
  getNovelListsUserLikesForUserPageHome,
  getAllNovelListTitlesAtTheMoment,
} from "../services/content/getNovelLists";
import toggleLike from "../services/content/toggleLike";

dotenv.config();

export const userPageController: RequestHandler = async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);

    if (!userId) throw new Error("유저 없음");
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
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userPageController :", error);
    res.status(500).end();
  }
};

export const userPageMyWritingController: RequestHandler = async (req, res) => {
  try {
    const { userName, contentType, order } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");
    if (contentType === "T" || contentType === "R") {
      const { talksOrRecommendsSet, isNextOrder } = await getWritingsUserCreatedForMyWriting(
        userId,
        contentType,
        Number(order),
      );
      res.json({ writingsUserCreated: talksOrRecommendsSet, isNextOrder });
    }

    if (contentType === "C") {
      const { commentsSet, isNextOrder } = await getCommentsForMyWriting(userId, Number(order));
      res.json({
        commentsUserCreated: commentsSet,
        isNextOrder,
      });
    }
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userPageMyWritingController :", error);
    res.status(500).end();
  }
};
export const userPageOthersWritingController: RequestHandler = async (req, res) => {
  try {
    const { userName, contentType, order } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");
    const { talksOrRecommendsSet, isNextOrder } = await getWritingsUserLikesForOthersWriting(
      userId,
      contentType as "T" | "R",
      Number(order),
    );
    res.json({ writingsUserLikes: talksOrRecommendsSet, isNextOrder });
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userPageMyWritingController :", error);
    res.status(500).end();
  }
};
export const userPageMyListController: RequestHandler = async (req, res) => {
  try {
    const { userNameInUserPage, listId, order } = req.params;
    const loginUserId = req.userId;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    if (!userIdInUserPage) throw new Error("유저 없음");
    const { novelList, isNextOrder } = await getNovelListUserCreatedForMyList(
      userIdInUserPage,
      listId,
      Number(order),
      loginUserId,
    );
    res.json({ novelList, isNextOrder });
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userPageMyListController :", error);
    res.status(500).end();
  }
};
export const userPageOthersListController: RequestHandler = async (req, res) => {
  try {
    const { userNameInUserPage, listId, order } = req.params;
    const loginUserId = req.userId;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    if (!userIdInUserPage) throw new Error("유저 없음");
    const { novelList, isNextOrder } = await getNovelListUserLikesForOthersList(
      userIdInUserPage,
      listId,
      Number(order),
      loginUserId,
    );
    res.json({ novelList, isNextOrder });
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userPageOthersListController :", error);
    res.status(500).end();
  }
};
export const userPageNovelListTitlesController: RequestHandler = async (req, res) => {
  try {
    const { userNameInUserPage, isMyList } = req.params;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    if (!userIdInUserPage) throw new Error("유저 없음");

    const allTitlesAndOtherInfo = await getAllNovelListTitlesAtTheMoment(
      userIdInUserPage,
      isMyList,
    );
    res.json(allTitlesAndOtherInfo);
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userPageNovelListTitlesController :", error);
    res.status(500).end();
  }
};
export const toggleLikeController: RequestHandler = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const loginUserId = req.userId;

    const { isLike } = await toggleLike(
      contentType as "writing" | "novelList",
      contentId,
      loginUserId as string,
    );
    if (isLike === undefined) throw new Error("error occurred as toggling LIKE");

    res.json({ isLike });
  } catch (error: any) {
    console.log("failed to toggle Like in toggleLikeController :", error);
    res.status(500).end();
  }
};
