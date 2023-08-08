import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/shared/getUserId";
import userWritingService from "../services/userContent/writings";
import userCommentService from "../services/userContent/comments";
import userNovelListService from "../services/userContent/novelLists";
import toggleLike from "../services/shared/toggleLike";

dotenv.config();

export const userHomeController: RequestHandler = (async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);

    if (!userId) throw new Error("유저 없음");
    const { talksUserCreated, recommendsUserCreated } =
      await userWritingService.getMyWritingsForUserHome(userId);
    const { talksUserLikes, recommendsUserLikes } =
      await userWritingService.getOthersWritingsForUserHome(userId);
    const commentsUserCreated = await userCommentService.getCommentsForUserHome(userId);
    const listsUserCreated = await userNovelListService.getMyListOfUserHome(userId);
    const listsUserLikes = await userNovelListService.getOthersListOfUserHome(userId);

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
    console.log("failed to get user's content in userHomeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const userMyWritingController: RequestHandler = (async (req, res) => {
  try {
    const { userName, contentType, order } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");
    if (contentType === "T" || contentType === "R") {
      const { talksOrRecommendsSet, isNextOrder } = await userWritingService.getMyWritings(
        userId,
        contentType,
        Number(order),
      );
      res.json({ writingsUserCreated: talksOrRecommendsSet, isNextOrder });
    }

    if (contentType === "C") {
      const { commentsSet, isNextOrder } = await userCommentService.getComments(
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
    console.log("failed to get user's content in userMyWritingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
export const userOthersWritingController: RequestHandler = (async (req, res) => {
  try {
    const { userName, contentType, order } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");
    const { talksOrRecommendsSet, isNextOrder } = await userWritingService.getOthersWritings(
      userId,
      contentType as "T" | "R",
      Number(order),
    );
    res.json({ writingsUserLikes: talksOrRecommendsSet, isNextOrder });
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userOthersWritingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
export const userMyListController: RequestHandler = (async (req, res) => {
  try {
    const { userNameInUserPage, listId, order } = req.params;
    const loginUserId = req.userId;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    if (!userIdInUserPage) throw new Error("유저 없음");
    const { novelList, isNextOrder } = await userNovelListService.getMyList(
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
    console.log("failed to get user's content in userMyListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
export const userOthersListController: RequestHandler = (async (req, res) => {
  try {
    const { userNameInUserPage, listId, order } = req.params;
    const loginUserId = req.userId;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    if (!userIdInUserPage) throw new Error("유저 없음");
    const { novelList, isNextOrder } = await userNovelListService.getOthersList(
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
    console.log("failed to get user's content in userOthersListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
export const userNovelListTitlesController: RequestHandler = (async (req, res) => {
  try {
    const { userNameInUserPage, isMyList } = req.params;
    const userIdInUserPage = await getUserId(userNameInUserPage);
    if (!userIdInUserPage) throw new Error("유저 없음");

    const allTitlesAndOtherInfo = await userNovelListService.getAllListTitles(
      userIdInUserPage,
      isMyList,
    );
    res.json(allTitlesAndOtherInfo);
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json("존재하지 않는 사용자입니다.");
    }
    console.log("failed to get user's content in userNovelListTitlesController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
export const toggleLikeController: RequestHandler = (async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const loginUserId = req.userId;

    const { isLike, likeNo } = await toggleLike(
      contentType as "writing" | "novelList",
      contentId,
      loginUserId as string,
    );
    if (isLike === undefined) throw new Error("error occurred as toggling LIKE");

    res.json({ isLike, likeNo });
  } catch (error: any) {
    console.log("failed to toggle Like in toggleLikeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
