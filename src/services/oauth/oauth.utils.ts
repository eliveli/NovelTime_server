export function getTextLength(str: string) {
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

export const markDuplicates = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
