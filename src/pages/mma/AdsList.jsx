import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader, StatusPill } from "../../components/ui.jsx";
import { StageTimes } from "../../components/StageTimes.jsx";

const STAGES = ["storyboard", "images", "videos", "pdf"];

export default function AdsList() {
  const { authFetch } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/v2/ads");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      data.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setJobs(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="page">
      <PageHeader
        title="광고 파이프라인"
        subtitle="스토리보드 → 이미지 → 비디오 → 기획서 4단계 잡"
        actions={
          <>
            <Link className="btn btn-primary" to="/mma/ads/new">
              새 파이프라인
            </Link>
            <button className="btn" onClick={load}>
              새로고침
            </button>
          </>
        }
      />
      {error && <div className="alert err">{error}</div>}
      {loading ? (
        <div className="muted">불러오는 중…</div>
      ) : jobs.length === 0 ? (
        <div className="empty">
          아직 파이프라인이 없습니다. <Link to="/mma/ads/new">새로 시작 →</Link>
        </div>
      ) : (
        <div className="card-grid">
          {jobs.map((j) => (
            <Link to={`/mma/ads/${j.job_id}`} className="ad-card" key={j.job_id}>
              <div className="ad-card-head">
                <strong>{j.storyboard?.project || "(스토리보드 생성 중)"}</strong>
                <span className="mono muted">{j.job_id.slice(0, 8)}</span>
              </div>
              <p className="muted clamp">{j.prompt}</p>
              <div className="stage-row">
                {STAGES.map((s) => (
                  <div className="stage-mini" key={s}>
                    <span className="stage-mini-label">{s}</span>
                    <StatusPill status={j.stages?.[s]?.status || "pending"} />
                    <StageTimes stage={j.stages?.[s]} />
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
