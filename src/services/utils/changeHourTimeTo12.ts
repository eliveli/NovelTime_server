// change 24 hour time to 12 hour time
// _ param : hour "00" ~ "23"
//           mins "00" ~ "59"
export default function changeHourTimeTo12(hour: string, mins: string) {
  let createTime = "";

  if (hour === "00") {
    createTime = `12 : ${mins} AM`;
  } else if (Number(hour) > 0 && Number(hour) < 12) {
    createTime = `${hour[1]} : ${mins} AM`;
  } else if (hour === "12") {
    createTime = `12 : ${mins} PM`;
  } else if (Number(hour) > 12 && Number(hour) < 24) {
    createTime = `${String(Number(hour) - 12)} : ${mins} PM`;
  }
  return createTime; // "hh : mm AM/PM"
}
