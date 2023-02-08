import db from "../../utils/db";
import { Novel, NovelInDetail } from "../../utils/types";

export default async function getNovelByNovelIdFromDB(novelId: string, isForHome: boolean) {
  if (isForHome) {
    const novel = (await db(
      "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
      novelId,
      "first",
    )) as Novel;

    if (!novel) return;

    return { ...novel, novelIsEnd: !!novel.novelIsEnd }; // convert tinyInt to boolean
  }

  // for novel list by category page
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelInDetail; // including its desc

  return novel;
}
