import db from "../utils/db";
import getNovelByNovelIdFromDB from "./getNovelByNovelId";

type NovelIDs = { novelId: string }[];
export async function getPopularNovelsFromDB(limitedNo: number) {
  //  sorting by post number, like number and comment number.
  //  . first: post number
  //  . second: greater value between like number and comment number
  //  . last: less value between like number and comment number

  return (await db(
    `SELECT novelId FROM writing GROUP BY novelId
      ORDER BY count(*) DESC,
       GREATEST(sum(likeNO),sum(commentNO)) DESC,
       LEAST(sum(likeNO),sum(commentNO)) DESC
      LIMIT ${String(limitedNo)}`,
    undefined,
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
export default async function getPopularNovelsInNovelTime(limitedNo: number) {
  const novelIDs = await getPopularNovelsFromDB(limitedNo);

  if (novelIDs.length === 0) return; // when getting no data from DB

  return await getNovelsByNovelIDs(novelIDs);
}
