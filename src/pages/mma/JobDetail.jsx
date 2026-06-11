import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader, StatusPill } from "../../components/ui.jsx";
import { AuthedVideo, DownloadButton } from "../../components/AuthedMedia.jsx";
import { elapsedSec, fmtDateTime, fmtDuration } from "../../lib/time.js";

export default function JobDetail() {
  const { jobId } = useParams();
  const { authFetch } = useAuth();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`/v1/jobs/${jobId}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      setJob(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [authFetch, jobId]);

  useEffect(() => {
    load();
  }, [load]);

  // 진행 중이면 폴링
  useEffect(() => {
    if (!job) return;
    if (job.status === "completed" || job.status === "failed") return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [job, load]);

  if (error) return <div className="page"><div className="alert err">{error}</div></div>;
  if (!job) return <div className="page muted">불러오는 중…</div>;

  return (
    <div className="page">
      <PageHeader
        title="영상생성 작업"
        subtitle={job.job_id}
        actions={
          <>
            <Link className="btn" to="/mma/jobs">
              목록
            </Link>
            <button className="btn" onClick={load}>
              새로고침
            </button>
          </>
        }
      />
      <div className="card">
        <div className="kv">
          <div><span className="muted">상태</span> <StatusPill status={job.status} /></div>
          <div><span className="muted">모드</span> {job.mode}</div>
          <div><span className="muted">모델</span> {job.model}</div>
          <div>
            <span className="muted">진행률</span>{" "}
            {Math.round((job.progress || 0) * 100)}%
          </div>
          <div><span className="muted">시작</span> {fmtDateTime(job.started_at)}</div>
          <div><span className="muted">완료</span> {fmtDateTime(job.finished_at)}</div>
          <div>
            <span className="muted">소요</span>{" "}
            {job.status === "queued"
              ? "-"
              : fmtDuration(job.duration_sec ?? elapsedSec(job.started_at, job.finished_at))}
          </div>
        </div>
        {job.error && <div className="alert err">{job.error}</div>}
      </div>

      {job.scenes?.length > 0 && (
        <div className="card">
          <h3>씬 진행</h3>
          <div className="scene-grid">
            {job.scenes.map((s) => (
              <div className="scene-chip" key={s.index}>
                <span>#{s.index}</span>
                <StatusPill status={s.status} />
                {s.error && <span className="err small">{s.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {job.storyboard && (
        <div className="card">
          <h3>스토리보드</h3>
          <pre className="json">{JSON.stringify(job.storyboard, null, 2)}</pre>
        </div>
      )}

      {job.status === "completed" && job.video_url && (
        <div className="card">
          <h3>결과 영상</h3>
          <AuthedVideo path={job.video_url} className="video" />
          <div className="row">
            <DownloadButton path={job.video_url} filename={`${job.job_id}.mp4`}>
              MP4 다운로드
            </DownloadButton>
            {job.subtitles_url && (
              <DownloadButton path={job.subtitles_url} filename={`${job.job_id}.srt`}>
                자막(SRT) 다운로드
              </DownloadButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
