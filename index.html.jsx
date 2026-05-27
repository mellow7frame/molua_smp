import { useState, useCallback } from "react";

const BRAND = {
  name: "모루아SMP",
  slogan: "그 마음 알기에, 자연스럽게 채워지는 자신감",
  hashtags: ["#모루아SMP", "#인천SMP", "#인천두피문신", "#두피문신", "#SMP"],
  tone: `당신은 모루아SMP의 콘텐츠 작가입니다.
브랜드 슬로건: "그 마음 알기에, 자연스럽게 채워지는 자신감"
톤앤매너: 탈모로 고민하는 분들의 마음을 먼저 공감하고, 전문가적 신뢰를 바탕으로 자연스럽게 정보를 전달합니다.
- 따뜻하고 공감적인 어조
- "케어"를 "시술" 대신 사용
- "두피문신"은 검색 노출을 위해 사용
- 어색하거나 갑작스러운 도입부 금지, 공감으로 시작
- "다만," 같은 전환어 사용 자제
- 숨겨진 정보가 있는 듯한 뉘앙스 금지
- 인천 기반 SMP 전문 브랜드임을 자연스럽게 드러냄`,
};

const MODES = [
  { id: "instagram", label: "인스타그램 캡션", icon: "📸" },
  { id: "blog", label: "네이버 블로그 초안", icon: "📝" },
  { id: "card", label: "카드뉴스 카피", icon: "🃏" },
];

const BLOG_CATS = ["두피문신(SMP)", "탈모정보"];
const CARD_COUNTS = [3, 5, 7];

const TOPIC_SUGGESTIONS = [
  "SMP란 무엇인가요?",
  "가르마 두피문신 후기",
  "탈모 초기 대처법",
  "SMP 지속 기간과 관리",
  "두피문신 vs 모발이식 비교",
  "SMP 시술 과정 안내",
];

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

function buildPrompt(mode, topic, extra) {
  const base = BRAND.tone;

  if (mode === "instagram") {
    return {
      system: `${base}
인스타그램 캡션 작성 규칙:
- 첫 줄은 공감 또는 질문으로 시작 (후킹)
- 본문 3~5문장, 줄바꿈 활용
- 마지막에 CTA 한 줄 (예: 문의는 DM 또는 프로필 링크로)
- 해시태그는 본문 아래 별도 줄에
- 이모지 자연스럽게 1~3개만
응답은 캡션 텍스트만 출력하세요.`,
      user: `주제: ${topic}${extra ? `\n추가 요청: ${extra}` : ""}`,
    };
  }

  if (mode === "blog") {
    const cat = extra?.category || "두피문신(SMP)";
    return {
      system: `${base}
네이버 블로그 포스팅 작성 규칙:
- 카테고리: ${cat}
- 제목 포함 (검색 최적화, 두피문신/SMP/탈모 키워드 자연스럽게 포함)
- 도입부: 공감으로 시작
- 소제목 2~3개 포함 (## 형식)
- 본문 400~600자
- 마무리: 모루아SMP 소개 1~2문장
- 태그 추천 10개 (쉼표 구분)
응답 형식:
[제목]
...
[본문]
...
[태그]
...`,
      user: `주제: ${topic}${extra?.memo ? `\n메모: ${extra.memo}` : ""}`,
    };
  }

  if (mode === "card") {
    const count = extra?.count || 5;
    return {
      system: `${base}
카드뉴스 슬라이드 카피 작성 규칙:
- 슬라이드 수: ${count}장
- 슬라이드 1: 표지 (제목 + 짧은 서브 카피)
- 슬라이드 2~${count - 1}: 핵심 내용 각 1~2문장씩
- 슬라이드 ${count}: 마무리 + CTA (모루아SMP 문의 유도)
- 각 슬라이드는 짧고 임팩트 있게
응답 형식:
[슬라이드 1]
...
[슬라이드 2]
...
이하 동일`,
      user: `주제: ${topic}${extra?.memo ? `\n메모: ${extra.memo}` : ""}`,
    };
  }
}

export default function App() {
  const [mode, setMode] = useState("instagram");
  const [topic, setTopic] = useState("");
  const [extra, setExtra] = useState("");
  const [blogCat, setBlogCat] = useState(BLOG_CATS[0]);
  const [cardCount, setCardCount] = useState(5);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult("");
    setCopied(false);
    try {
      const extraData =
        mode === "blog"
          ? { category: blogCat, memo: extra }
          : mode === "card"
          ? { count: cardCount, memo: extra }
          : extra;
      const { system, user } = buildPrompt(mode, topic, extraData);
      const text = await callClaude(system, user);

      // instagram: append hashtags
      if (mode === "instagram") {
        const tags = [
          ...BRAND.hashtags,
          "#탈모",
          "#두피케어",
          "#SMP후기",
          "#인천미용",
        ].join(" ");
        setResult(text + "\n\n" + tags);
      } else {
        setResult(text);
      }
    } catch (e) {
      setResult("오류가 발생했어요. 다시 시도해주세요.");
    }
    setLoading(false);
  }, [mode, topic, extra, blogCat, cardCount]);

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.root}>
      {/* Background texture */}
      <div style={styles.bgTexture} />

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoMark}>M</div>
          <div>
            <h1 style={styles.logoText}>모루아SMP</h1>
            <p style={styles.slogan}>{BRAND.slogan}</p>
          </div>
        </header>

        <div style={styles.card}>
          {/* Mode selector */}
          <div style={styles.modeRow}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(""); }}
                style={{
                  ...styles.modeBtn,
                  ...(mode === m.id ? styles.modeBtnActive : {}),
                }}
              >
                <span style={styles.modeIcon}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Topic input */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>주제 / 키워드</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: SMP란 무엇인가요?"
              style={styles.input}
              onKeyDown={(e) => e.key === "Enter" && generate()}
            />
            {/* Quick suggestions */}
            <div style={styles.chips}>
              {TOPIC_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  style={{
                    ...styles.chip,
                    ...(topic === s ? styles.chipActive : {}),
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific options */}
          {mode === "blog" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>카테고리</label>
              <div style={styles.segmented}>
                {BLOG_CATS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBlogCat(c)}
                    style={{
                      ...styles.segBtn,
                      ...(blogCat === c ? styles.segBtnActive : {}),
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "card" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>슬라이드 수</label>
              <div style={styles.segmented}>
                {CARD_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCardCount(n)}
                    style={{
                      ...styles.segBtn,
                      ...(cardCount === n ? styles.segBtnActive : {}),
                    }}
                  >
                    {n}장
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra memo */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>추가 메모 (선택)</label>
            <input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="강조하고 싶은 포인트나 특이사항"
              style={styles.input}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            style={{
              ...styles.generateBtn,
              ...(loading || !topic.trim() ? styles.generateBtnDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.loadingDots}>생성 중<span className="dots">...</span></span>
            ) : (
              "✦ 콘텐츠 생성하기"
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <span style={styles.resultLabel}>
                {MODES.find((m) => m.id === mode)?.label} 결과
              </span>
              <button onClick={copy} style={styles.copyBtn}>
                {copied ? "✓ 복사됨" : "복사하기"}
              </button>
            </div>
            <pre style={styles.resultText}>{result}</pre>
          </div>
        )}

        <p style={styles.footer}>모루아SMP 전용 콘텐츠 생성기 · powered by Claude</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0eb; }
        .dots { animation: blink 1s steps(3, end) infinite; display: inline-block; width: 1.5em; overflow: hidden; vertical-align: bottom; }
        @keyframes blink { 0%,100%{width:0} 33%{width:0.5em} 66%{width:1em} 100%{width:1.5em} }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#f5f0eb",
    fontFamily: "'Noto Sans KR', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgTexture: {
    position: "fixed",
    inset: 0,
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(180,150,120,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(140,110,90,0.06) 0%, transparent 50%)`,
    pointerEvents: "none",
  },
  container: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "32px 20px 60px",
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8B6F55, #C4A882)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Noto Serif KR', serif",
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    boxShadow: "0 4px 16px rgba(139,111,85,0.3)",
  },
  logoText: {
    fontFamily: "'Noto Serif KR', serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#3d2c1e",
    letterSpacing: "0.02em",
  },
  slogan: {
    fontSize: 11,
    color: "#8B6F55",
    marginTop: 3,
    letterSpacing: "0.04em",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "28px 24px",
    boxShadow: "0 2px 24px rgba(100,70,50,0.08)",
    border: "1px solid rgba(180,150,120,0.15)",
  },
  modeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  modeBtn: {
    flex: 1,
    minWidth: 100,
    padding: "10px 8px",
    border: "1.5px solid #e0d4c8",
    borderRadius: 12,
    background: "transparent",
    color: "#8B6F55",
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "all 0.2s",
  },
  modeBtnActive: {
    background: "#8B6F55",
    borderColor: "#8B6F55",
    color: "#fff",
    boxShadow: "0 2px 10px rgba(139,111,85,0.25)",
  },
  modeIcon: { fontSize: 16 },
  fieldGroup: { marginBottom: 20 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#7a6050",
    marginBottom: 8,
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid #e0d4c8",
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "'Noto Sans KR', sans-serif",
    color: "#3d2c1e",
    background: "#fdfaf7",
    outline: "none",
    transition: "border-color 0.2s",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  chip: {
    padding: "5px 12px",
    borderRadius: 20,
    border: "1px solid #e0d4c8",
    background: "#fdfaf7",
    color: "#8B6F55",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: "all 0.15s",
  },
  chipActive: {
    background: "#C4A882",
    borderColor: "#C4A882",
    color: "#fff",
  },
  segmented: {
    display: "flex",
    gap: 8,
  },
  segBtn: {
    padding: "8px 16px",
    border: "1.5px solid #e0d4c8",
    borderRadius: 10,
    background: "transparent",
    color: "#8B6F55",
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  segBtnActive: {
    background: "#C4A882",
    borderColor: "#C4A882",
    color: "#fff",
  },
  generateBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #8B6F55, #C4A882)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: "'Noto Sans KR', sans-serif",
    cursor: "pointer",
    letterSpacing: "0.05em",
    boxShadow: "0 4px 16px rgba(139,111,85,0.3)",
    transition: "all 0.2s",
    marginTop: 4,
  },
  generateBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  loadingDots: { display: "inline-flex", alignItems: "center" },
  resultCard: {
    marginTop: 20,
    background: "#fff",
    borderRadius: 20,
    padding: "24px",
    boxShadow: "0 2px 24px rgba(100,70,50,0.08)",
    border: "1px solid rgba(180,150,120,0.15)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#8B6F55",
    letterSpacing: "0.05em",
  },
  copyBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1.5px solid #C4A882",
    background: "transparent",
    color: "#8B6F55",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: "all 0.15s",
  },
  resultText: {
    fontSize: 13.5,
    lineHeight: 1.9,
    color: "#3d2c1e",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  footer: {
    textAlign: "center",
    marginTop: 28,
    fontSize: 11,
    color: "#b8a898",
    letterSpacing: "0.04em",
  },
};
