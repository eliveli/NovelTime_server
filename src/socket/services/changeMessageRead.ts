import db from "../../services/utils/db";

export default async function changeMessageRead(messageId: string) {
  try {
    const query = "UPDATE message SET isReadByReceiver = 1 WHERE messageId = (?)";

    await db(query, [messageId]);
  } catch (error) {
    console.log(error);
  }
}
