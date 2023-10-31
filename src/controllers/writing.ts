import { RequestHandler } from "express";
import dotenv from "dotenv";
import getWritings from "../services/writing/getWritings";
import { composeWritings } from "../services/home/getWritings";
import { getWriting } from "../services/writing/getWriting";
import createWriting from "../services/writing/createWriting";
import editWriting from "../services/writing/editWriting";
import deleteWriting from "../services/writing/deleteWriting";

dotenv.config();

export type SearchType = "writingTitle" | "writingDesc" | "userName" | "novelTitle" | "no";

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
      {
        searchType: searchType as SearchType,
        searchWord,
      },
      sortBy,
      Number(pageNo),
    );

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    const writings = await composeWritings(writingType as "T" | "R", data.writings, searchType);

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

    const loginUserId = req.userId; // it can be undefined if the user didn't log in

    if (!["T", "R"].includes(writingType)) throw Error;

    const data = await getWriting(writingType as "T" | "R", writingId, loginUserId);

    if (data === undefined) {
      res.status(500).json("failed to get a writing post");
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.log("failed to get content in writingDetailController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const createWritingController: RequestHandler = (async (req, res) => {
  try {
    const { novelId, writingType, writingTitle, writingDesc, writingImg } = req.body;

    const loginUserId = req.userId;

    if (!loginUserId) throw Error("user id is empty");

    if (!novelId || !writingTitle || !writingDesc) {
      throw Error("some property is empty");
    }

    if (!["T", "R"].includes(String(writingType))) throw Error("writing type is not correct");

    const writingImgSet = writingImg === undefined ? "" : writingImg;

    await createWriting(
      loginUserId,
      writingType as "T" | "R",
      novelId as string,
      writingTitle as string,
      writingDesc as string,
      writingImgSet as string,
    );

    res.json("new writing post was added");
  } catch (error: any) {
    res.status(500).json("failed to add a writing post");
  }
}) as RequestHandler;

export const editWritingController: RequestHandler = (async (req, res) => {
  try {
    const { writingId, writingTitle, writingDesc, writingImg } = req.body;

    if (!writingId || !writingTitle || !writingDesc) {
      throw Error("some property is empty");
    }

    const writingImgSet = writingImg === undefined ? "" : writingImg;

    await editWriting(
      writingId as string,
      writingTitle as string,
      writingDesc as string,
      writingImgSet as string,
    );

    res.json("a writing post was edited");
  } catch (error: any) {
    res.status(500).json("failed to edit a writing post");
  }
}) as RequestHandler;

export const deleteWritingController: RequestHandler = (async (req, res) => {
  try {
    const { writingId } = req.body;

    if (!writingId) {
      throw Error("writingId is empty");
    }

    await deleteWriting(writingId as string);

    res.json("a writing post was deleted");
  } catch (error: any) {
    res.status(500).json("failed to delete a writing post");
  }
}) as RequestHandler;
