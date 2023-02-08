import { RequestHandler } from "express";

import dotenv from "dotenv";
import writingHomeService from "../services/home";

dotenv.config();

export const homeController: RequestHandler = (async (req, res) => {
  try {
    const talkList = await writingHomeService.getWritings("T");

    const talk = await writingHomeService.getUserRanks("T", "Create");
    const comment = await writingHomeService.getUserRanks("C", "Create");
    const likeReceivedOfTalk = await writingHomeService.getUserRanks("T", "ReceiveLike");
    const talkUserRank = { talk, comment, likeReceived: likeReceivedOfTalk };

    const recommendList = await writingHomeService.getWritings("R");

    const recommend = await writingHomeService.getUserRanks("R", "Create");
    const likeReceivedOfRecommend = await writingHomeService.getUserRanks("R", "ReceiveLike");
    const recommendUserRank = { recommend, likeReceived: likeReceivedOfRecommend };

    const novelList = await writingHomeService.getUserRanks("L", "Create");
    const likeReceivedOfList = await writingHomeService.getUserRanks("L", "ReceiveLike");
    const novelListUserRank = { novelList, likeReceived: likeReceivedOfList };

    const popularNovelsInNovelTime = await writingHomeService.getPopularNovelsInNovelTime(true);

    res.json({
      talkList,
      talkUserRank,
      recommendList,
      recommendUserRank,
      novelListUserRank,
      popularNovelsInNovelTime,
    });
  } catch (error: any) {
    console.log("failed to get content in homeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const userNovelListController: RequestHandler = (async (req, res) => {
  try {
    const userNovelLists = await writingHomeService.getNovelListsOfUsers();

    res.json(userNovelLists);
  } catch (error: any) {
    console.log("failed to get content in userNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

function matchPlatformName(platformGiven: string) {
  if (platformGiven === "kakape") return "카카오페이지";
  if (platformGiven === "series") return "네이버 시리즈";
  if (platformGiven === "ridi") return "리디북스";
  if (platformGiven === "joara") return "조아라";

  throw Error("플랫폼 선택 오류");
}

export const weeklyNovelsController: RequestHandler = (async (req, res) => {
  try {
    const { platform } = req.params;

    const platformGiven = matchPlatformName(platform);

    const weeklyNovels = await writingHomeService.getWeeklyNovelsFromPlatform(platformGiven, true);

    res.json({ [platform]: weeklyNovels });
  } catch (error: any) {
    console.log("failed to get content in weeklyNovelsController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export default homeController;
