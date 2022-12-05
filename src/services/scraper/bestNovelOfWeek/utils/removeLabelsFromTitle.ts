function removeStartLabels(novelTitle: string) {
  for (const label of [")", ") ", "]", "] "]) {
    const indexOfLabel = novelTitle.indexOf(label);
    if (indexOfLabel === -1) continue;
    if (indexOfLabel !== novelTitle.length - 1) {
      return novelTitle.slice(indexOfLabel + label.length, novelTitle.length - 1);
    }
  }
}
function removeEndLabels(novelTitle: string) {
  for (const label of ["(", " (", "[", " [", "외전", " 외전", "-외전", " -외전"]) {
    const indexOfLabel = novelTitle.indexOf(label);
    if (indexOfLabel === -1) continue;
    if (indexOfLabel !== 0) {
      return novelTitle.slice(0, indexOfLabel);
    }
  }
}

export default function removeLabelsFromTitle(novelTitle: string) {
  const titleWithoutEndLabels = removeEndLabels(novelTitle);
  if (titleWithoutEndLabels) return titleWithoutEndLabels;

  const titleWithoutStartLabels = removeStartLabels(novelTitle);
  if (titleWithoutStartLabels) return titleWithoutStartLabels;

  return novelTitle;
}
