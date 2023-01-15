import { NovelPlatform } from "../scraper/utils/types";
import db from "../utils/db";
import getNovelByNovelIdFromDB from "./shared/getNovelByNovelId";

type NovelIDs = { novelId: string }[];
export async function getWeeklyNovelsFromDB(novelPlatform: NovelPlatform) {
  // novelRank column is not necessary in this case
  // because the novel order in the table is the same as the rank and I get novels straightly
  return (await db(
    "SELECT novelId FROM weeklyNovel WHERE novelPlatform = (?) AND isLatest = 1",
    [novelPlatform],
    "all",
  )) as NovelIDs;
}

export async function getNovelsByNovelIDs(novelIDs: NovelIDs) {
  const novels = [];

  for (const { novelId } of novelIDs) {
    const novel = await getNovelByNovelIdFromDB(novelId);

    if (!novel) {
      console.log("there is no novel for this novel id:", novelId);
      continue;
    }

    novels.push(novel);
  }

  return novels;
}
export default async function getWeeklyNovelsInPlatform(novelPlatform: NovelPlatform) {
  const novelIDs = await getWeeklyNovelsFromDB(novelPlatform);

  if (novelIDs.length === 0) return; // when getting no data from DB

  return await getNovelsByNovelIDs(novelIDs);
}
