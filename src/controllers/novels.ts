import { Request, Response, NextFunction, RequestHandler } from "express";
import getPopularNovelsInNovelTime from "../services/shared/getPopularNovelsInNovelTime";
import getWeeklyNovelsForHomeOrListPage from "../services/shared/getWeeklyNovelsForHomeOrListPage";
import { getNovels, getNovel } from "../services/novels";

export const searchByTitle: RequestHandler = (req, res) => {
  getNovels(req.params.title)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log(err));
};

export const getNovelById: RequestHandler = (req, res) => {
  getNovel(req.params.novelId)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log(err));
};

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
