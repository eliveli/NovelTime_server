export default function getTextLength(str: string) {
  let len = 0;
  let neededCharIndex = 0;
  for (let i = 0; i < str.length; i += 1) {
    if (escape(str.charAt(i)).length === 6) {
      len += 1;
    }
    len += 1;

    // get the character index where the text length is 12 bytes
    if (len === 12) {
      neededCharIndex = i;
    }

    // get the character index where the text length is 11 bytes
    // - in this case the character index where text length is 12 bytes doesn't exist
    // - 13 bytes === 11 bytes (at the previous char index) + 2 bytes (current char length)
    if (len === 13 && neededCharIndex === 0) {
      neededCharIndex = i - 1;
    }
  }
  return [len, neededCharIndex];
}
