import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader } from "../../components/ui.jsx";
import { StatusPill } from "../../components/ui.jsx";

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
                <th>생성</th>
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
                  <td className="muted">{fmt(j.created_at)}</td>
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

function fmt(iso) {
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return iso;
  }
}
