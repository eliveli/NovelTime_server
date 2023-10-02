import { getCurrentTimeExceptMilliSec } from "../utils/getCurrentTime";
import createId from "../utils/createId";
import db from "../utils/db";

async function addNewWriting({
  loginUserId,
  writingId,
  writingTitle,
  writingDesc,
  writingImg,
  createDate,
  talkOrRecommend,
  novelId,
  novelGenre,
}: {
  loginUserId: string;
  writingId: string;
  writingTitle: string;
  writingDesc: string;
  writingImg: string;
  createDate: string;
  talkOrRecommend: "T" | "R";
  novelId: string;
  novelGenre: string;
}) {
  const query =
    "INSERT INTO writing SET userId = (?), writingId = (?), writingTitle = (?), writingDesc = (?), writingImg = (?), createDate = (?), talkOrRecommend = (?), novelId = (?), novelGenre = (?)";

  await db(query, [
    loginUserId,
    writingId,
    writingTitle,
    writingDesc,
    writingImg,
    createDate,
    talkOrRecommend,
    novelId,
    novelGenre,
  ]);
}

async function getNovelGenre(novelId: string) {
  const query = "SELECT novelGenre FROM novelInfo WHERE novelId = (?)";
  const { novelGenre } = (await db(query, novelId, "first")) as { novelGenre: string };
  return novelGenre;
}

export default async function createWriting(
  loginUserId: string,
  talkOrRecommend: "T" | "R",
  novelId: string,
  writingTitle: string,
  writingDesc: string,
  writingImg: string,
) {
  const writingId = createId();

  const createDate = getCurrentTimeExceptMilliSec();

  const novelGenre = await getNovelGenre(novelId);

  if (!novelGenre) return;

  await addNewWriting({
    loginUserId,
    writingId,
    writingTitle,
    writingDesc,
    writingImg,
    createDate,
    talkOrRecommend,
    novelId,
    novelGenre,
  });
}
