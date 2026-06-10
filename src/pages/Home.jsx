import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext.jsx";
import { PageHeader } from "../components/ui.jsx";

const CARDS = [
  {
    title: "영상 생성",
    desc: "단일 메시지 또는 PDF 기획서로 광고 영상을 생성합니다.",
    to: "/mma/videos",
    tag: "Multi-Modal",
  },
  {
    title: "영상 작업 목록",
    desc: "생성 요청한 영상 잡의 진행 상태와 결과물을 확인합니다.",
    to: "/mma/jobs",
    tag: "Multi-Modal",
  },
  {
    title: "광고 파이프라인",
    desc: "스토리보드 → 이미지 → 비디오 → 기획서 4단계를 순차 진행합니다.",
    to: "/mma/ads",
    tag: "Multi-Modal",
  },
  {
    title: "다국어 변환",
    desc: "콘텐츠를 타겟 시장 언어로 자동 현지화합니다. (준비 중)",
    to: "/translation",
    tag: "Translation",
  },
  {
    title: "콘텐츠 추천",
    desc: "운영 데이터 기반 콘텐츠/세그먼트를 추천합니다. (준비 중)",
    to: "/recommendation",
    tag: "Recommendation",
  },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="page">
      <PageHeader
        title={`환영합니다, ${user?.name || user?.username || "사용자"}님`}
        subtitle="사용할 AI 에이전트 기능을 선택하세요."
      />
      <div className="card-grid">
        {CARDS.map((c) => (
          <Link to={c.to} className="feature-card" key={c.to}>
            <span className="feature-tag">{c.tag}</span>
            <h3>{c.title}</h3>
            <p className="muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
