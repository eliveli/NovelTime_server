import { RequestHandler } from "express";
import dotenv from "dotenv";
import getWritings from "../services/writing/getWritings";

dotenv.config();

export const writingController: RequestHandler = (async (req, res) => {
  try {
    const { listType, novelGenre, searchType, searchWord, sortBy, pageNo } = req.params;

    if (!["T", "R"].includes(listType)) throw Error;

    const writings = await getWritings(
      listType as "T" | "R",
      novelGenre,
      { searchType, searchWord },
      sortBy,
      Number(pageNo),
    );

    res.json(writings);
  } catch (error: any) {
    console.log("failed to get content in writingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export default writingController;
