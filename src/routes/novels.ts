import express from "express";
const router = express.Router();

import { searchTitle } from "../controllers/searchNovels";

router.get("/search/:title", searchTitle);

// Book.find()
// .then((books) => res.json(books))
// .catch((err) => res.status(404).json({ nobooksfound: "No Books found" }));

export default router;
