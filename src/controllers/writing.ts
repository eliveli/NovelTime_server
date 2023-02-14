import { RequestHandler } from "express";
import dotenv from "dotenv";
import getWritings from "../services/writing/getWritings";
import { composeWritings } from "../services/home/getWritings";

dotenv.config();

export const writingController: RequestHandler = (async (req, res) => {
  try {
    const { listType, novelGenre, searchType, searchWord, sortBy, pageNo } = req.params;

    if (!["T", "R"].includes(listType)) throw Error;

    if (!["writingTitle", "writingDesc", "userName", "no"].includes(searchType)) throw Error;

    // params must not an empty string
    // . if searchType is "no" then do not search
    //  ㄴif searchWord was not set then searchType should be "no" in front side work

    const data = await getWritings(
      listType as "T" | "R",
      novelGenre, // "all" or "extra" or specific genre
      { searchType: searchType as "writingTitle" | "writingDesc" | "userName" | "no", searchWord },
      sortBy,
      // ㄴ"newDate" or "oldDate" or "manyComments" or "fewComments" or "manyLikes" or "fewLikes"
      Number(pageNo),
    );

    if (data === undefined) {
      res.json({ writings: undefined, isLastPage: undefined });
      return;
    }

    const writings = await composeWritings(listType as "T" | "R", data.writings);

    res.json({ writings, isLastPage: data.isLastPage });
  } catch (error: any) {
    console.log("failed to get content in writingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export default writingController;
