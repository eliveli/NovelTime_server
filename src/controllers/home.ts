import { RequestHandler } from "express";

import dotenv from "dotenv";
import writingHomeService from "../services/home";
import getNovelListsOfUsers from "../services/home/getNovelListsOfUsers";

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

    res.json({
      talkList,
      talkUserRank,
      recommendList,
      recommendUserRank,
      novelListUserRank,
    });
  } catch (error: any) {
    console.log("failed to get content in homeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const userNovelListController: RequestHandler = (async (req, res) => {
  try {
    const userNovelLists = await getNovelListsOfUsers();
    if (!userNovelLists) {
      throw Error("there is no novel list");
    }

    res.json(userNovelLists);
  } catch (error: any) {
    console.log("failed to get content in userNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export default homeController;
