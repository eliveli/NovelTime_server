import db from "../utils/db";

export default async function editWriting(
  writingId: string,
  writingTitle: string,
  writingDesc: string,
  writingImg: string,
) {
  const query =
    "UPDATE writing SET writingTitle = (?), writingDesc = (?), writingImg = (?) WHERE writingId = (?)";

  await db(query, [writingTitle, writingDesc, writingImg, writingId]);
}
