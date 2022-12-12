function removeStartLabels(novelTitle: string) {
  for (const label of [") ", ")", "] ", "]"]) {
    const indexOfLabel = novelTitle.indexOf(label);
    if (indexOfLabel === -1) continue;
    if (indexOfLabel !== novelTitle.length - 1) {
      return novelTitle.slice(indexOfLabel + label.length, novelTitle.length - 1);
    }
  }
}
function removeEndLabels(novelTitle: string) {
  for (const label of [" (", "(", " [", "[", " 외전", "외전", " -외전", "-외전"]) {
    const indexOfLabel = novelTitle.indexOf(label);
    if (indexOfLabel === -1) continue;
    if (indexOfLabel !== 0) {
      return novelTitle.slice(0, indexOfLabel);
    }
  }
}

// 여백이 있는 것 먼저 고려해서 작업.
//   i.e. " (외전)" vs "(외전)"
// 그렇지 않으면 여백 없는 경우를 먼저 확인하고 작업이 끝나기에 정확하게 라벨을 뗄 수 없음

// 현재 상태에서 단행본 외전(본편 없는 외전)이 본편처럼 인식되어 DB에 추가될 수 있음

export default function removeLabelsFromTitle(novelTitle: string) {
  // i.e. title with start labels : [외전] 소설제목
  // i.e. title with end labels : 소설제목 (외전)[단행본], 소설제목 [독점][외전 추가], etc
  // -> exclude labels from title

  const titleWithoutEndLabels = removeEndLabels(novelTitle);
  if (titleWithoutEndLabels) return titleWithoutEndLabels;

  const titleWithoutStartLabels = removeStartLabels(novelTitle);
  if (titleWithoutStartLabels) return titleWithoutStartLabels;

  return novelTitle;
}
