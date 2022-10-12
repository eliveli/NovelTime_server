import db from "../../utils/db";
import { Novel } from "../../utils/types";

export default async function getNovelByNovelIdFromDB(novelId: string) {
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as Novel;
  return { ...novel, novelIsEnd: !!novel.novelIsEnd }; // convert tinyInt to boolean
}
