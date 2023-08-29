import { Request, Response, NextFunction, RequestHandler } from "express";
import getPopularNovelsInNovelTime from "../services/shared/getPopularNovelsInNovelTime";
import getWeeklyNovels from "../services/shared/getWeeklyNovels";
import searchForNovels from "../services/novel/searchForNovels";
import addNovelWithURL from "../services/scraper/novelAddedWithURL/novelAddedAutomatically";
import getWritingsOfTheNovel from "../services/novel/getWritingsOfTheNovel";
import getNovelInDetail from "../services/novel/getNovelInDetail";
import getNovelsForLoginUser from "../services/novel/getNovelsForLoginUser";
import getUserNovelListsAtRandom from "../services/novel/getUserNovelListsAtRandom";
import getUserNovelListsPeopleLike from "../services/novel/getUserNovelListsPeopleLike";

export const getPopularNovelsInNovelTimeController: RequestHandler = (async (req, res) => {
  try {
    const { limitedNo } = req.params;

    if (!Number(limitedNo)) {
      throw Error("limited number was not correct");
    }

    const popularNovelsInNovelTime = await getPopularNovelsInNovelTime(Number(limitedNo));

    res.json(popularNovelsInNovelTime);
  } catch (error: any) {
    console.log("failed to get content in getPopularNovelsInNovelTimeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const userNovelListPeopleLikeController: RequestHandler = (async (req, res) => {
  try {
    const { limitedNo } = req.params; // * set this to 4 in novel list page, front work

    if (!Number(limitedNo)) {
      throw Error("limited number was not correct");
    }

    const userNovelLists = await getUserNovelListsPeopleLike(Number(limitedNo));

    res.json(userNovelLists);
  } catch (error: any) {
    console.log("failed to get content in userNovelListPeopleLikeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

// * change path with limitedNo in front work from home to novels
export const userNovelListAtRandomController: RequestHandler = (async (req, res) => {
  try {
    const { limitedNo } = req.params; // * set this to 4 in novel list page, front work

    if (!Number(limitedNo)) {
      throw Error("limited number was not correct");
    }

    const userNovelLists = await getUserNovelListsAtRandom(Number(limitedNo));

    res.json(userNovelLists);
  } catch (error: any) {
    console.log("failed to get content in userNovelListAtRandomController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

// * change path with limitedNo in front work from home to novels
export const getWeeklyNovelsController: RequestHandler = (async (req, res) => {
  try {
    const { platform, limitedNo } = req.params;

    if (!platform || !Number(limitedNo)) {
      throw Error("some arg was not correct");
    }

    const weeklyNovels = await getWeeklyNovels(platform, Number(limitedNo));

    res.json({ [platform]: weeklyNovels });
  } catch (error: any) {
    console.log("failed to get content in getWeeklyNovelsController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getNovelsForLoginUserController: RequestHandler = (async (req, res) => {
  try {
    const loginUserId = req.userId;
    const { limitedNo } = req.params;

    if (!loginUserId || !Number(limitedNo)) {
      throw Error("limited number or login user id is not correct");
    }

    const novels = await getNovelsForLoginUser(loginUserId, Number(limitedNo));

    res.json(novels);
  } catch (error: any) {
    console.log("failed to get content in getNovelsForLoginUserController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getNovelDetailController: RequestHandler = (async (req, res) => {
  try {
    const { novelId } = req.params;

    if (!novelId) {
      throw Error("novelId is empty");
    }

    const data = await getNovelInDetail(novelId);

    res.json(data);
  } catch (error: any) {
    console.log(
      "failed to get a novel and ones published by the author in getNovelDetailController :",
      error,
    );
    res.status(500).end();
  }
}) as RequestHandler;

export const getWritingsOfTheNovelController: RequestHandler = (async (req, res) => {
  try {
    const { novelId, writingType, pageNo } = req.params;

    if (!novelId || !pageNo) {
      throw Error("some parameter is empty");
    }
    if (!["T", "R"].includes(writingType)) {
      throw Error("writing type is wrong");
    }

    const data = await getWritingsOfTheNovel(novelId, writingType as "T" | "R", Number(pageNo));

    res.json(data);
  } catch (error: any) {
    console.log(
      "failed to get writing posts for the novel in getWritingsOfTheNovelController :",
      error,
    );
    res.status(500).end();
  }
}) as RequestHandler;

export const searchForNovelController: RequestHandler = (async (req, res) => {
  try {
    const { searchType, searchWord, pageNo } = req.params;

    if (!["novelTitle", "novelDesc", "novelAuthor", "sample"].includes(searchType)) {
      throw Error("searchType is not correct");
    }

    const data = await searchForNovels(
      searchType as "novelTitle" | "novelDesc" | "novelAuthor" | "sample",
      searchWord,
      Number(pageNo),
    );

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    res.json({ ...data });
  } catch (error: any) {
    console.log("failed to get novels in searchForNovelController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const addNovelWithURLController: RequestHandler = (async (req, res) => {
  try {
    const { novelURL } = req.body;

    if (!novelURL) throw Error("novel url is empty");

    const novelIdAndTitle = await addNovelWithURL(novelURL as string);

    if (!novelIdAndTitle) throw Error;

    res.json({ ...novelIdAndTitle });
  } catch (error: any) {
    console.log("failed to add a novel in addNovelWithURLController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
