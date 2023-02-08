import { NovelPlatform } from "../scraper/utils/types";
import db from "../utils/db";
import getNovelByNovelIdFromDB from "./shared/getNovelByNovelId";

type NovelIDs = { novelId: string }[];
export async function getWeeklyNovelsFromDB(novelPlatform: NovelPlatform, isForHome: boolean) {
  // novelRank column is not necessary in this case
  // because the novel order in the table is the same as the rank and I get novels straightly

  const limitNo = isForHome ? 10 : 20;
  // 20 of all weekly novels for its list page. 10 for home page

  return (await db(
    `SELECT novelId FROM weeklyNovel WHERE novelPlatform = (?) AND isLatest = 1 LIMIT ${limitNo}`,
    [novelPlatform],
    "all",
  )) as NovelIDs;
}

export async function getNovelsByNovelIDs(novelIDs: NovelIDs, isForHome: boolean) {
  const novels = [];

  for (const { novelId } of novelIDs) {
    const novel = await getNovelByNovelIdFromDB(novelId, isForHome);

    if (!novel) {
      console.log("there is no novel for this novel id:", novelId);
      continue;
    }

    novels.push(novel);
  }

  return novels;
}
export default async function getWeeklyNovelsFromPlatform(
  novelPlatform: NovelPlatform,
  isForHome: boolean,
  // ㄴtrue then return 10 novels for home page,
  // ㄴfalse then return 20 with its desc for novel list page by category
) {
  const novelIDs = await getWeeklyNovelsFromDB(novelPlatform, isForHome);

  if (novelIDs.length === 0) return; // when getting no data from DB

  return await getNovelsByNovelIDs(novelIDs, isForHome);
}
