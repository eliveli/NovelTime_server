import { Request, Response, NextFunction, RequestHandler } from "express";
import { getNovels, getNovel } from "../services/novels";
import getWeeklyNovelsForHomeOrListPage from "../services/shared/getWeeklyNovelsForHomeOrListPage";

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

    res.json(novelsInDetail);
  } catch (error: any) {
    console.log("failed to get content in getNovelListByCategory controller :", error);
    res.status(500).end();
  }
}) as RequestHandler;
