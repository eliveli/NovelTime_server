import db from "../utils/db";
import { NovelWithoutEnd, NovelInDetail } from "../utils/types";

export default async function getNovelByNovelIdFromDB(novelId: string, isWithDesc: boolean) {
  // * data type can change as the arg change. handle data given to frontend later
  if (isWithDesc) {
    const novel = (await db(
      "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE novelId = (?)",
      novelId,
      "first",
    )) as NovelInDetail;

    return novel;
  }

  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelWithoutEnd;

  return novel;
}
