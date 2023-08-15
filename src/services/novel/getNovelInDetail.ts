import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";
import { WritingWithoutGenre } from "../utils/types";

type NovelInDetail = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelDesc: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
  novelIsEnd: boolean;
  novelPlatform: string;
  novelPlatform2: string;
  novelPlatform3: string;
  novelUrl: string;
  novelUrl2: string;
  novelUrl3: string;
};

type Novel = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
};

async function setWritingsWithUsers(writings: WritingWithoutGenre[], writingType: "T" | "R") {
  const writingsWithUsers = [];

  for (const writing of writings) {
    const user = await getUserNameAndImg(writing.userId);
    if (!user) continue;

    // 리코멘드일 때 코멘트 넘버 undefined
    const commentNO = writingType === "T" ? writing.commentNO : undefined;

    const writingWithUser = { ...writing, ...user, commentNO };
    writingsWithUsers.push(writingWithUser);
  }
  return writingsWithUsers;
}

async function getWritings(novelId: string, writingType: "T" | "R") {
  const query = "SELECT * FROM writing WHERE novelId = (?) AND talkOrRecommend = (?) LIMIT 5";
  const writings = (await db(query, [novelId, writingType], "all")) as WritingWithoutGenre[];

  const writingsWithUsers = await setWritingsWithUsers(writings, writingType);
  return writingsWithUsers;
}

async function getNovelsByTheAuthor(novelAuthor: string) {
  const query =
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelAge, novelGenre FROM novelInfo WHERE novelAuthor = (?)";
  const novels = (await db(query, novelAuthor, "all")) as Novel[];
  return novels;
}

async function getNovel(novelId: string) {
  const query = "SELECT * FROM novelInfo WHERE novelId = (?)";
  const novel = (await db(query, novelId, "first")) as NovelInDetail;
  return novel;
}

export default async function getNovelAndItsWritings(novelId: string) {
  const novel = await getNovel(novelId);

  const novelsPublishedByTheAuthor = await getNovelsByTheAuthor(novel.novelAuthor);

  // writings : 다른 api로 가져올 수 있어야 함 (전체보기 또는 하단 더보기 버튼)
  const talks = await getWritings(novelId, "T");

  const recommends = await getWritings(novelId, "R");

  const writingNo = talks.length + recommends.length;

  return {
    novel: { ...novel, writingNo },
    novelsPublishedByTheAuthor,
    talks,
    recommends,
  };
}
