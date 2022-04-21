import express from "express";

import { searchByTitle, getNovelById } from "../controllers/novels";

const router = express.Router();

router.get("/search/:title", searchByTitle);

// router.get("/category/:category", searchByTitle);

router.get("/detail/:novel_id", getNovelById);

// Book.find()
// .then((books) => res.json(books))
// .catch((err) => res.status(404).json({ nobooksfound: "No Books found" }));

export default router;
