import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/shared/getUserId";
import userWritingService from "../services/userContent/writings";
import userCommentService from "../services/userContent/comments";
import allNovelListsService from "../services/userContent/allNovelLists";
import specificNovelListService from "../services/userContent/specificNovelList";
import myNovelListsService from "../services/userContent/myNovelLists";
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
    const listsUserCreated = await specificNovelListService.getMyListOfUserHome(userId);
    const listsUserLikes = await specificNovelListService.getOthersListOfUserHome(userId);

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
    const { novelList, isNextOrder } = await specificNovelListService.getMyList(
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
    const { novelList, isNextOrder } = await specificNovelListService.getOthersList(
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

    const allTitlesAndOtherInfo = await specificNovelListService.getAllListTitles(
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

export const getAllMyNovelListsController: RequestHandler = (async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("user doesn't exist");

    const lists = await allNovelListsService.getAllMyNovelListsInUserPage(userId);

    res.json(lists);
  } catch (error: any) {
    console.log("failed to get user's content in getAllMyNovelListsController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getAllOthersNovelListsController: RequestHandler = (async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("user doesn't exist");

    const lists = await allNovelListsService.getAllOthersNovelListsInUserPage(userId);

    res.json(lists);
  } catch (error: any) {
    console.log("failed to get user's content in getAllOthersNovelListsController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const loginUserId = req.userId;

    if (!loginUserId) {
      res.status(400).json("유효하지 않은 사용자입니다");
      return;
    }

    const myNovelLists = await myNovelListsService.getMyList(loginUserId);

    res.json(myNovelLists);
  } catch (error: any) {
    console.log("failed to get user's content in getMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const createMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { listTitle } = req.body;

    const loginUserId = req.userId;

    if (!listTitle || !loginUserId) {
      throw Error("some value doesn't exist");
    }

    await myNovelListsService.createMyList(listTitle as string, loginUserId);

    res.json("your novel list was created successfully");
  } catch (error: any) {
    console.log("failed to create user's content in createMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const changeListTitleController: RequestHandler = (async (req, res) => {
  try {
    const { listId, listTitle } = req.body;

    if (!listId || !listTitle) {
      throw Error("some value doesn't exist");
    }

    await myNovelListsService.changeListTitle(listId as string, listTitle as string);

    res.json("your novel list title was changed successfully");
  } catch (error: any) {
    console.log("failed to change user's content in changeListTitleController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const removeMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { listId } = req.body;

    if (!listId) {
      throw Error("list id wasn't given");
    }

    await myNovelListsService.removeMyList(listId as string);

    res.json("your novel list was removed successfully");
  } catch (error: any) {
    console.log("failed to remove user's content in removeMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const addNovelToMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { novelId, listIDs } = req.body;

    if (!novelId || !listIDs) {
      throw Error("some value doesn't exist");
    }
    if (typeof listIDs !== "object") {
      throw Error("listIDs is not string array");
    }

    await myNovelListsService.addNovelToMyList(novelId as string, listIDs as string[]);

    res.json("novel was added to your lists successfully");
  } catch (error: any) {
    console.log("failed to add user's content in addNovelToMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const removeNovelFromMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { listId, novelIDs } = req.body;

    if (!listId || !novelIDs) {
      throw Error("some value doesn't exist");
    }
    if (typeof novelIDs !== "object") {
      throw Error("novelIDs is not string array");
    }

    await myNovelListsService.removeNovelFromMyList(listId as string, novelIDs as string[]);

    res.json("novels were removed from your list successfully");
  } catch (error: any) {
    console.log(
      "failed to remove novels from list in removeNovelFromMyNovelListController :",
      error,
    );
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
