import { RequestHandler } from "express";

import dotenv from "dotenv";
import writingHomeService from "../services/home";

dotenv.config();

export const homeController: RequestHandler = (async (req, res) => {
  try {
    const talkList = await writingHomeService.getWritings("T");

    const talk = await writingHomeService.getUserRankOfWritings("T", "Create");
    const comment = await writingHomeService.getUserRankOfWritings("C", "Create");
    const likeReceivedOfTalk = await writingHomeService.getUserRankOfWritings("T", "ReceiveLike");
    const talkUserRank = { talk, comment, likeReceived: likeReceivedOfTalk };

    const recommendList = await writingHomeService.getWritings("R");

    const recommend = await writingHomeService.getUserRankOfWritings("R", "Create");
    const likeReceivedOfRecommend = await writingHomeService.getUserRankOfWritings(
      "R",
      "ReceiveLike",
    );
    const recommendUserRank = { recommend, likeReceived: likeReceivedOfRecommend };

    const list = await writingHomeService.getUserRankOfWritings("L", "Create");
    const likeReceivedOfList = await writingHomeService.getUserRankOfWritings("L", "ReceiveLike");
    const novelListUserRank = { list, likeReceived: likeReceivedOfList };

    const popularNovelsInNovelTime = await writingHomeService.getPopularNovelsInNovelTime();

    const weeklyNovelsFromKakape = await writingHomeService.getWeeklyNovelsFromPlatform(
      "카카오페이지",
    );
    const weeklyNovelsFromSeries = await writingHomeService.getWeeklyNovelsFromPlatform(
      "네이버 시리즈",
    );
    const weeklyNovelsFromRidi = await writingHomeService.getWeeklyNovelsFromPlatform("리디북스");
    const weeklyNovelsFromJoara = await writingHomeService.getWeeklyNovelsFromPlatform("조아라");
    const weeklyNovelsFromPlatforms = {
      kakape: weeklyNovelsFromKakape,
      series: weeklyNovelsFromSeries,
      ridi: weeklyNovelsFromRidi,
      joara: weeklyNovelsFromJoara,
    };

    res.json({
      talkList,
      talkUserRank,
      recommendList,
      recommendUserRank,
      novelListUserRank,
      popularNovelsInNovelTime,
      weeklyNovelsFromPlatforms,
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

export default homeController;
