// 플랫폼 및 장르별 카테고리 넘버
export const genreFilter = {
  // 카카페 로판, 판타지 : 최신순(첫화등록일)
  kakape: { RF: "117", F: "86" },
  // 시리즈 로판, 판타지 : 완결작 포함, 최신순(최신화등록일)
  series: { RF: "207", F: "202" },
  // 리디 로판, 판타지 : 최신순(최신화등록일) :로판 웹소설, 로판 e북 & 판타지웹소설 정통,퓨전 & 판타지e북 정통,퓨전,대체역사
  ridi: { RF: ["6050", "6000"], F1: ["1751", "1752"], F2: ["1711", "1712", "1715"] },
};

export const minimalArgs = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];
