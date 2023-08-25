import express from "express";

import {
  userHomeController,
  userMyWritingController,
  userOthersWritingController,
  userMyListController,
  userOthersListController,
  userNovelListTitlesController,
  toggleLikeController,
  getMyNovelListController,
  createMyNovelListController,
  addNovelToMyNovelListController,
  getAllMyNovelListsController,
  getAllOthersNovelListsController,
  changeListTitleController,
} from "../controllers/userContent";
import { authenticateAccessTokenMiddleware, getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:userName", userHomeController);

router.get("/myWriting/:userName/:contentType/:order", userMyWritingController);

router.get("/othersWriting/:userName/:contentType/:order", userOthersWritingController);

// get all novel lists in a user's page
router.get("/myList/all/:userName", getAllMyNovelListsController); // my list that the user created
router.get("/othersList/all/:userName", getAllOthersNovelListsController); // other's list that the user liked

// get a certain novel list in a user's page
router.get(
  "/myList/:userNameInUserPage/:listId/:order",
  getUserIdByTokenMiddleware,
  userMyListController,
);
router.get(
  "/othersList/:userNameInUserPage/:listId/:order",
  getUserIdByTokenMiddleware,
  userOthersListController,
);

router.get("/novelListTitles/:userNameInUserPage/:isMyList", userNovelListTitlesController);

// a login user's list
router.get("/myNovelList", authenticateAccessTokenMiddleware, getMyNovelListController);

router.post("/myNovelList", authenticateAccessTokenMiddleware, createMyNovelListController);

router.put("/myNovelList", authenticateAccessTokenMiddleware, changeListTitleController);

router.put(
  "/myNovelList/novel",
  authenticateAccessTokenMiddleware,
  addNovelToMyNovelListController,
);

//
router.put(
  "/toggleLike/:contentType/:contentId",
  authenticateAccessTokenMiddleware,
  toggleLikeController,
);

export default router;
