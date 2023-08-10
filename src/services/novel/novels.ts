import db from "../utils/db";

interface NovelInfo {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelDesc: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
  novelIsEnd: boolean;
  novelPlatform: string;
  novelUrl: string;
}

export async function setNovel(novelInfo: NovelInfo) {
  await db("INSERT INTO novelInfo values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
    novelInfo.novelId,
    novelInfo.novelImg,
    novelInfo.novelTitle,
    novelInfo.novelDesc,
    novelInfo.novelAuthor,
    novelInfo.novelAge,
    novelInfo.novelGenre,
    novelInfo.novelIsEnd,
    novelInfo.novelPlatform,
    "", // platform2
    "", // platform3
    novelInfo.novelUrl,
    "", // url2
    "", // url3
    0,
    0,
  ]);
}

export async function getNovels(novelTitle: string) {
  return (await db(
    "SELECT * FROM novelInfo WHERE novelTitle like (?)",
    `%${novelTitle}%`,
    "raw",
  )) as any;
}

export async function getNovelIDsByNovelTitle(novelTitle: string) {
  const novelIdArray = (await db(
    `SELECT novelId FROM novelInfo WHERE novelTitle LIKE '%${novelTitle}%'`,
    undefined,
    "all",
  )) as { novelId: string }[];

  if (novelIdArray.length === 0) return;

  const novelIDs = [];
  for (const { novelId } of novelIdArray) {
    novelIDs.push(novelId);
  }
  return novelIDs;
}

export async function getNovel(novelId: string) {
  return (await db("SELECT * FROM novelInfo WHERE novelId = (?)", novelId, "first")) as any;
}
