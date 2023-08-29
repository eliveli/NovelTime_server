import { RequestHandler } from "express";
import dotenv from "dotenv";
import writingHomeService from "../services/home";
import getPopularNovelsInNovelTime from "../services/shared/getPopularNovelsInNovelTime";

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

    const popularNovelsInNovelTime = await getPopularNovelsInNovelTime(10);

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
