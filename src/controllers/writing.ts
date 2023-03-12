import { RequestHandler } from "express";
import dotenv from "dotenv";
import getWritings from "../services/writing/getWritings";
import { composeWritings } from "../services/home/getWritings";
import getWriting from "../services/writing/getWriting";

dotenv.config();

export const writingListController: RequestHandler = (async (req, res) => {
  try {
    const { writingType, novelGenre, searchType, searchWord, sortBy, pageNo } = req.params;

    if (!["T", "R"].includes(writingType)) throw Error;

    if (!["writingTitle", "writingDesc", "novelTitle", "userName", "no"].includes(searchType)) {
      throw Error;
    }

    // params must not be an empty string
    // . if searchType is "no" then do not search
    //  ㄴif searchWord was not set then searchType should be "no" in front side work

    const data = await getWritings(
      writingType as "T" | "R",
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

    const writings = await composeWritings(writingType as "T" | "R", data.writings);

    if (writingType === "T") {
      res.json({
        talks: writings,
        recommends: undefined,
        lastPageNo: data.lastPageNo,
      });
      return;
    }
    res.json({ talks: undefined, recommends: writings, lastPageNo: data.lastPageNo });
  } catch (error: any) {
    console.log("failed to get content in writingListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const writingDetailController: RequestHandler = (async (req, res) => {
  try {
    const { writingType, writingId } = req.params;

    if (!["T", "R"].includes(writingType)) throw Error;

    const data = await getWriting(writingType as "T" | "R", writingId);

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.log("failed to get content in writingDetailController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
