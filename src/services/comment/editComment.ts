import db from "../utils/db";

export default async function editComment(commentId: string, commentContent: string) {
  const query = "UPDATE comment SET commentContent = (?), isEdited = 1 WHERE commentId = (?)";

  await db(query, [commentContent, commentId]);
}
