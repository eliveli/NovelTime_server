/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/userPage/getUserId";
import userPageWritingService from "../services/userPage/writings";
import userPageCommentService from "../services/userPage/comments";
import userPageNovelListService from "../services/userPage/novelLists";
import toggleLike from "../services/userPage/toggleLike";

dotenv.config();

export const userPageController: RequestHandler = async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);

    if (!userId) throw new Error("유저 없음");
    const { talksUserCreated, recommendsUserCreated } =
      await userPageWritingService.getMyWritingsForUserHome(userId);
    const { talksUserLikes, recommendsUserLikes } =
      await userPageWritingService.getOthersWritingsForUserHome(userId);
    const commentsUserCreated = await userPageCommentService.getCommentsForUserHome(userId);
    const listsUserCreated = await userPageNovelListService.getMyListOfUserHome(userId);
    const listsUserLikes = await userPageNovelListService.getOthersListOfUserHome(userId);

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
      const { talksOrRecommendsSet, isNextOrder } = await userPageWritingService.getMyWritings(
        userId,
        contentType,
        Number(order),
      );
      res.json({ writingsUserCreated: talksOrRecommendsSet, isNextOrder });
    }

    if (contentType === "C") {
      const { commentsSet, isNextOrder } = await userPageCommentService.getComments(
        userId,
        Number(order),
      );
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
    const { talksOrRecommendsSet, isNextOrder } = await userPageWritingService.getOthersWritings(
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
    const { novelList, isNextOrder } = await userPageNovelListService.getMyList(
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
    const { novelList, isNextOrder } = await userPageNovelListService.getOthersList(
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

    const allTitlesAndOtherInfo = await userPageNovelListService.getAllListTitles(
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
