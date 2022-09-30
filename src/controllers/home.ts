import { RequestHandler } from "express";

import dotenv from "dotenv";
import writingHomeService from "../services/writing/home";

dotenv.config();

export const homeController: RequestHandler = (async (req, res) => {
  try {
    const talkList = await writingHomeService.getWritings("T");
    const recommendList = await writingHomeService.getWritings("R");

    res.json("server connected");
  } catch (error: any) {
    console.log("failed to get content in homeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export default homeController;
