import db from "../../../utils/db";
import getCurrentTime from "../../utils/getCurrentTime";

type NovelPlatform = "카카오페이지" | "네이버 시리즈" | "리디북스";

async function addWeeklyNovel(
  novelId: string,
  novelRank: number,
  novelPlatform: NovelPlatform,
  scrapeDate: string,
) {
  await db(
    "INSERT INTO weeklyNovel SET novelId = (?), novelRank = (?), novelPlatform = (?), scrapeDate = (?),  isLatest = 1",
    [novelId, novelRank, novelPlatform, scrapeDate],
  );
}

async function handlePreviousWeeklyNovels(novelPlatform: NovelPlatform) {
  await db("UPDATE weeklyNovel SET isLatest = 0 WHERE isLatest = 1 AND novelPlatform = (?)", [
    novelPlatform,
  ]);
}
export default async function addWeeklyNovels(
  novelIDs: Array<string>,
  novelPlatform: NovelPlatform,
) {
  const scrapeDate = getCurrentTime();

  // make isLatest value 0 that means false of previous weekly novels
  await handlePreviousWeeklyNovels(novelPlatform);

  for (const [index, novelId] of novelIDs.entries()) {
    await addWeeklyNovel(novelId, index + 1, novelPlatform, scrapeDate);
  }

  // later I will get weekly novels from DB where isLatest is 1 and platform is 카카오페이지
}
