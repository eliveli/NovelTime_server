import express from "express";
const router = express.Router();

import { setNovel, getNovels } from "../../db/novel";

router.get("/search/:title", (req, res) => {
  getNovels(req.params.title)
    .then((data) => {
      console.log(data);
      console.log("response 콘솔 : ", res);
      return res.json(data);
    })
    .catch((err) => console.log(err));

  // Book.find()
  // .then((books) => res.json(books))
  // .catch((err) => res.status(404).json({ nobooksfound: "No Books found" }));
});

export default router;
