import db from "../utils/db";

export default async function editComment(
  commentId: string,
  commentContent: string,
  loginUserId: string,
) {
  const query = "UPDATE comment SET commentContent = (?) WHERE commentId = (?) and userId = (?)";

  await db(query, [commentContent, commentId, loginUserId]);
}
