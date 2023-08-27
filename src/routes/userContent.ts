import express from "express";

import {
  userHomeController,
  getWritingUserCreatedController,
  getWritingUserLikedController,
  getListUserCreatedController,
  getListUserLikedController,
  getNovelListTitlesController,
  toggleLikeController,
  getMyNovelListController,
  createMyNovelListController,
  addOrRemoveNovelInListController,
  getAllListSummaryUserCreatedController,
  getAllListSummaryUserLikedController,
  changeListTitleController,
  removeMyNovelListController,
  removeNovelFromMyNovelListController,
} from "../controllers/userContent";
import { authenticateAccessTokenMiddleware, getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/home/:userName", userHomeController);

router.get("/writing/created/:userName/:contentType/:order", getWritingUserCreatedController);

router.get("/writing/liked/:userName/:contentType/:order", getWritingUserLikedController);

router.get("/listSummary/created/:userName", getAllListSummaryUserCreatedController);
router.get("/listSummary/liked/:userName", getAllListSummaryUserLikedController);

router.get(
  "/listDetailed/created/:userName/:listId/:order",
  getUserIdByTokenMiddleware,
  getListUserCreatedController,
);
router.get(
  "/listDetailed/liked/:userName/:listId/:order",
  getUserIdByTokenMiddleware,
  getListUserLikedController,
);
router.get("/listDetailed/listTitles/:userName/:isCreated", getNovelListTitlesController);

router.get("/myNovelList/:novelId", authenticateAccessTokenMiddleware, getMyNovelListController);
router.post("/myNovelList", authenticateAccessTokenMiddleware, createMyNovelListController);
router.delete("/myNovelList", authenticateAccessTokenMiddleware, removeMyNovelListController);

router.put("/myNovelList/title", authenticateAccessTokenMiddleware, changeListTitleController);

router.put(
  "/myNovelList/novel",
  authenticateAccessTokenMiddleware,
  addOrRemoveNovelInListController,
);
router.delete(
  "/myNovelList/novel",
  authenticateAccessTokenMiddleware,
  removeNovelFromMyNovelListController,
);

//
router.put(
  "/toggleLike/:contentType/:contentId",
  authenticateAccessTokenMiddleware,
  toggleLikeController,
);

export default router;
