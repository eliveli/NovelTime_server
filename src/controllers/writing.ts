import { RequestHandler } from "express";
import dotenv from "dotenv";
import getWritings from "../services/writing/getWritings";
import { composeWritings } from "../services/home/getWritings";

dotenv.config();

export const writingController: RequestHandler = (async (req, res) => {
  try {
    const { listType, novelGenre, searchType, searchWord, sortBy, pageNo } = req.params;

    if (!["T", "R"].includes(listType)) throw Error;

    if (!["writingTitle", "writingDesc", "novelTitle", "userName", "no"].includes(searchType)) {
      throw Error;
    }

    // params must not an empty string
    // . if searchType is "no" then do not search
    //  ㄴif searchWord was not set then searchType should be "no" in front side work

    const data = await getWritings(
      listType as "T" | "R",
      novelGenre,
      // ㄴ "all" or "extra"
      // ㄴ or specific genre : "패러디", "로판", "로맨스", "현판", "판타지", "무협", "라이트노벨", "BL", "미스터리"
      {
        searchType: searchType as "writingTitle" | "writingDesc" | "userName" | "novelTitle" | "no",
        searchWord,
      },
      sortBy,
      // ㄴ"newDate" or "oldDate" or "manyComments" or "fewComments" or "manyLikes" or "fewLikes"
      Number(pageNo),
    );

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    const writings = await composeWritings(listType as "T" | "R", data.writings);

    if (listType === "T") {
      res.json({
        talks: writings,
        recommends: undefined,
        isLastPage: data.isLastPage,
      });
    }
    res.json({ talks: undefined, recommends: writings, isLastPage: data.isLastPage });
  } catch (error: any) {
    console.log("failed to get content in writingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export default writingController;
