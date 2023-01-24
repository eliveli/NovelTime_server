// 플랫폼 및 장르별 카테고리 넘버 for new scraper
export const genreFilter = {
  // 카카페 : 등록일순
  kakape: {
    RF: 117, // Romance Fantasy
    F: 86, // Fantasy
    R: 89, // Romance
    MF: 120, // Modern Fantasy
    MA: 87, // Martial Arts
    All: 0,
  },
  // 시리즈 : 완결작 포함, 최신순(최신화등록일)
  series: {
    RF: 207,
    F: 202,
    R: 201,
    MF: 208,
    MA: 206,
    Mystery: 203,
    LN: 205, // Light Novel
    BL: 209,
  },
  // 리디 : 최신순(최신화등록일)
  ridi: {
    test: [3005], // for test 페이지 수 3 (국내 라노벨)
    RF: [6050, 6000], // 로판 웹소설 전체, 로판 e북 전체
    R: [1650, 1700], // 로맨스 웹소설 전체, 로맨스 e북 전체
    F1: [1751, 1752], // 판타지웹소설 정통,퓨전
    F2: [1711, 1712, 1715], // 판타지e북 정통,퓨전,대체역사
    MF: [1753, 1713, 1714, 1716], // 판타지웹소설 현대, 판타지e북 현대, 게임, 스포츠
    MA: [1754, 1721, 1722], // 판타지웹소설 무협, 판타지e북 신무협, 정통무협
    LN: [3000], // 라노벨 전체
    BL: [4150, 4100], // BL 웹소설 전체, BL e북 전체
  },
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
