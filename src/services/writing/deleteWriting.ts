import db from "../utils/db";

async function deleteWritingWithWritingId(writingId: string) {
  const query = "DELETE FROM writing WHERE writingId = (?)";

  await db(query, [writingId]);
}

async function deleteWritingLike(writingId: string) {
  const query = "DELETE FROM writingLike WHERE writingId = (?)";

  await db(query, [writingId]);
}

async function deleteComment(writingId: string) {
  const query = "DELETE FROM comment WHERE writingId = (?)";

  await db(query, [writingId]);
}

export default async function deleteWriting(writingId: string) {
  await deleteWritingWithWritingId(writingId);

  await deleteWritingLike(writingId);

  await deleteComment(writingId);
}
