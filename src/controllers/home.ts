/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";

import dotenv from "dotenv";

dotenv.config();

export const homeController: RequestHandler = async (req, res) => {
  try {
    res.json("server connected");
  } catch (error: any) {
    console.log("failed to get content in homeController :", error);
    res.status(500).end();
  }
};
