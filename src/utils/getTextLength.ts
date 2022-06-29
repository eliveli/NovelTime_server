export default function getTextLength(str: string) {
  let len = 0;
  let charIndexAs12bytes = 0;
  for (let i = 0; i < str.length; i += 1) {
    if (escape(str.charAt(i)).length === 6) {
      len += 1;
    }
    len += 1;

    // get the character index where the text length is 12 bytes
    if (len === 12) {
      charIndexAs12bytes = i;
    }
  }
  return [len, charIndexAs12bytes];
}
