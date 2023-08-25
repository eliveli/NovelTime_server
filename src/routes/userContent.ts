import express from "express";

import {
  userHomeController,
  userMyWritingController,
  userOthersWritingController,
  getListUserCreatedController,
  getListUserLikedController,
  getNovelListTitlesController,
  toggleLikeController,
  getMyNovelListController,
  createMyNovelListController,
  addNovelToMyNovelListController,
  getAllListSummaryUserCreatedController,
  getAllListSummaryUserLikedController,
  changeListTitleController,
  removeMyNovelListController,
  removeNovelFromMyNovelListController,
} from "../controllers/userContent";
import { authenticateAccessTokenMiddleware, getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/home/:userName", userHomeController);

router.get("/myWriting/:userName/:contentType/:order", userMyWritingController);

router.get("/othersWriting/:userName/:contentType/:order", userOthersWritingController);

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

router.get("/myNovelList", authenticateAccessTokenMiddleware, getMyNovelListController);
router.post("/myNovelList", authenticateAccessTokenMiddleware, createMyNovelListController);
router.put("/myNovelList", authenticateAccessTokenMiddleware, changeListTitleController);
router.delete("/myNovelList", authenticateAccessTokenMiddleware, removeMyNovelListController);

router.post(
  "/myNovelList/novel",
  authenticateAccessTokenMiddleware,
  addNovelToMyNovelListController,
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
