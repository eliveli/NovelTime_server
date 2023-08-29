import db from "../utils/db";
import { NovelInDetail } from "../utils/types";

export default async function getNovelByNovelIdFromDB(novelId: string) {
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelInDetail;

  return novel;
}
