import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader } from "../../components/ui.jsx";
import { StatusPill } from "../../components/ui.jsx";
import { elapsedSec, fmtDateTime, fmtDuration } from "../../lib/time.js";

export default function JobList() {
  const { authFetch } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/v1/jobs");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      // 최신순 정렬
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
    const t = setInterval(load, 5000); // 진행 중 잡 자동 갱신
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="page">
      <PageHeader
        title="영상 작업 목록"
        subtitle="5초마다 자동 갱신"
        actions={
          <button className="btn" onClick={load}>
            새로고침
          </button>
        }
      />
      {error && <div className="alert err">{error}</div>}
      {loading ? (
        <div className="muted">불러오는 중…</div>
      ) : jobs.length === 0 ? (
        <div className="empty">
          아직 생성된 잡이 없습니다. <Link to="/mma/videos">영상 생성하기 →</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>모드</th>
                <th>모델</th>
                <th>상태</th>
                <th>진행률</th>
                <th>시작</th>
                <th>완료</th>
                <th>소요</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.job_id}>
                  <td className="mono">{j.job_id.slice(0, 10)}</td>
                  <td>{j.mode}</td>
                  <td>{j.model}</td>
                  <td>
                    <StatusPill status={j.status} />
                  </td>
                  <td>
                    <div className="bar">
                      <div
                        className="bar-fill"
                        style={{ width: Math.round((j.progress || 0) * 100) + "%" }}
                      />
                    </div>
                  </td>
                  <td className="muted">{fmtDateTime(j.started_at)}</td>
                  <td className="muted">{fmtDateTime(j.finished_at)}</td>
                  <td className="muted">{fmtJobDuration(j)}</td>
                  <td>
                    <Link className="btn btn-sm" to={`/mma/jobs/${j.job_id}`}>
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 완료/실패면 서버 계산값, 진행 중이면 현재까지 경과시간
function fmtJobDuration(j) {
  if (j.status === "queued") return "-";
  const sec = j.duration_sec ?? elapsedSec(j.started_at, j.finished_at);
  if (sec == null) return "-";
  const label = fmtDuration(sec);
  return j.finished_at ? label : label + " 경과";
}
