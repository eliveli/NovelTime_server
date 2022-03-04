import { Request, Response, NextFunction, RequestHandler } from "express";
import { getNovels } from "../services/novel";

export const searchTitle: RequestHandler = (req, res) => {
  getNovels(req.params.title)
    .then((data) => {
      console.log(data);
      return res.json(data);
    })
    .catch((err) => console.log(err));
};
