import { Request, Response, NextFunction, RequestHandler } from "express";
import getPopularNovelsInNovelTime from "../services/shared/getPopularNovelsInNovelTime";
import getWeeklyNovelsForHomeOrListPage from "../services/shared/getWeeklyNovelsForHomeOrListPage";
import searchForNovels from "../services/novel/searchForNovels";
import addNovelWithURL from "../services/scraper/novelAddedWithURL/novelAddedAutomatically";
import getNovelAndItsWritings from "../services/novel/getNovelInDetail";

export const getNovelListByCategory: RequestHandler = (async (req, res) => {
  try {
    const { category, platform, novelId } = req.params;

    let novelsInDetail;

    if (category === "weeklyNovelsFromPlatform") {
      novelsInDetail = await getWeeklyNovelsForHomeOrListPage(platform, false);
    }

    if (category === "popularNovelsInNovelTime") {
      novelsInDetail = await getPopularNovelsInNovelTime(false);
    }

    res.json(novelsInDetail);
  } catch (error: any) {
    console.log("failed to get content in getNovelListByCategory controller :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getNovelDetailController: RequestHandler = (async (req, res) => {
  try {
    const { novelId } = req.params;

    if (!novelId) {
      throw Error("novelId is empty");
    }

    const data = await getNovelAndItsWritings(novelId);

    res.json(data);
  } catch (error: any) {
    console.log("failed to get a novel and its related data in getNovelDetailController :", error);
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
