import { Request, Response, NextFunction, RequestHandler } from "express";
import { getNovels, getNovel } from "../services/novels";

export const searchByTitle: RequestHandler = (req, res) => {
  getNovels(req.params.title)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log(err));
};
export const getNovelById: RequestHandler = (req, res) => {
  getNovel(req.params.novelId)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log(err));
};
