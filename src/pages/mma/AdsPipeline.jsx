import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader, StatusPill } from "../../components/ui.jsx";
import { AuthedImage, AuthedVideo, DownloadButton } from "../../components/AuthedMedia.jsx";

const STAGE_REQUIRES = {
  storyboard: [],
  images: ["storyboard"],
  videos: ["storyboard", "images"], // ★ images 완료 필수(412 게이팅)
  pdf: ["storyboard"],
};
const STAGE_LABEL = {
  storyboard: "1 · 스토리보드",
  images: "2 · 컷 이미지",
  videos: "3 · 컷 비디오 + 결합",
  pdf: "4 · 기획서 PDF",
};

export default function AdsPipeline() {
  const { jobId } = useParams();
  const { authFetch } = useAuth();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [imageModels, setImageModels] = useState([]);
  const [videoModels, setVideoModels] = useState([]);
  const [busyStage, setBusyStage] = useState(null);

  // 단계별 옵션 선택값
  const [imageModel, setImageModel] = useState("");
  const [videoModel, setVideoModel] = useState("");
  const [textExposure, setTextExposure] = useState("");
  const [logoOutro, setLogoOutro] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`/v2/ads/${jobId}`);
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

  // 모델 목록 로드 (이미지 / image-to-video 가능 비디오)
  useEffect(() => {
    (async () => {
      try {
        const [imgRes, vidRes] = await Promise.all([
          authFetch("/v2/ads/image-models"),
          authFetch("/v1/models"),
        ]);
        if (imgRes.ok) {
          const d = await imgRes.json();
          setImageModels(d.models || []);
          const def = (d.models || []).find((m) => m.default && m.configured)
            || (d.models || []).find((m) => m.configured)
            || (d.models || [])[0];
          if (def) setImageModel(def.name);
        }
        if (vidRes.ok) {
          const d = await vidRes.json();
          const i2v = (d.models || []).filter((m) => m.supports_image_input);
          setVideoModels(i2v);
          const def = i2v.find((m) => m.configured) || i2v[0];
          if (def) setVideoModel(def.name);
        }
      } catch {
        /* 모델 목록 실패는 치명적이지 않음 */
      }
    })();
  }, [authFetch]);

  // 진행 중 단계가 있으면 폴링
  useEffect(() => {
    if (!job) return;
    const anyRunning = Object.values(job.stages || {}).some(
      (s) => s.status === "in_progress"
    );
    if (!anyRunning) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [job, load]);

  const stageStatus = (name) => job?.stages?.[name]?.status || "pending";

  const canRun = (name) => {
    if (busyStage) return false;
    if (stageStatus(name) === "in_progress") return false;
    return STAGE_REQUIRES[name].every((r) => stageStatus(r) === "completed");
  };

  const runStage = useCallback(
    async (name, { body, force } = {}) => {
      setBusyStage(name);
      setError(null);
      try {
        const path =
          name === "images"
            ? `/v2/ads/${jobId}/images`
            : name === "videos"
            ? `/v2/ads/${jobId}/videos`
            : `/v2/ads/${jobId}/proposal`;
        const url = force ? `${path}?force=true` : path;
        const res = await authFetch(url, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "HTTP " + res.status);
        await load();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusyStage(null);
      }
    },
    [authFetch, jobId, load]
  );

  if (error && !job)
    return <div className="page"><div className="alert err">{error}</div></div>;
  if (!job) return <div className="page muted">불러오는 중…</div>;

  const sb = job.storyboard;

  return (
    <div className="page">
      <PageHeader
        title={sb?.project || "광고 파이프라인"}
        subtitle={job.job_id}
        actions={
          <>
            <Link className="btn" to="/mma/ads">
              목록
            </Link>
            <button className="btn" onClick={load}>
              새로고침
            </button>
          </>
        }
      />
      {error && <div className="alert err">{error}</div>}

      {/* 단계 진행 막대 */}
      <div className="pipeline-steps">
        {["storyboard", "images", "videos", "pdf"].map((s, i) => (
          <div key={s} className={"pstep pstep-" + stageStatus(s)}>
            <span className="pstep-no">{i + 1}</span>
            <span className="pstep-label">{STAGE_LABEL[s]}</span>
            <StatusPill status={stageStatus(s)} />
          </div>
        ))}
      </div>

      <div className="card">
        <span className="muted">프롬프트</span>
        <p>{job.prompt}</p>
      </div>

      {/* 1단계: 스토리보드 */}
      <StageCard name="storyboard" job={job}>
        {stageStatus("storyboard") === "completed" && sb ? (
          <>
            <div className="kv">
              <div><span className="muted">컨셉</span> {sb.concept}</div>
              <div><span className="muted">타겟</span> {sb.target}</div>
              <div><span className="muted">길이</span> {sb.total_duration_sec}s</div>
              <div><span className="muted">컷 수</span> {sb.cuts?.length}</div>
            </div>
            <details>
              <summary>스토리보드 JSON 전체 보기</summary>
              <pre className="json">{JSON.stringify(sb, null, 2)}</pre>
            </details>
          </>
        ) : (
          <p className="muted">스토리보드 생성 단계입니다. 완료되면 이후 단계가 열립니다.</p>
        )}
      </StageCard>

      {/* 2단계: 이미지 */}
      <StageCard name="images" job={job}>
        <div className="stage-controls">
          <label className="inline-field">
            이미지 모델
            <select value={imageModel} onChange={(e) => setImageModel(e.target.value)}>
              {imageModels.map((m) => (
                <option key={m.name} value={m.name} disabled={!m.configured}>
                  {m.name}{m.configured ? "" : " (미설정)"}
                </option>
              ))}
            </select>
          </label>
          <StageButton
            name="images"
            canRun={canRun("images")}
            status={stageStatus("images")}
            busy={busyStage === "images"}
            onRun={(force) =>
              runStage("images", { body: imageModel ? { model: imageModel } : undefined, force })
            }
          />
        </div>
        <CutAssets assets={job.images} kind="images" jobId={job.job_id} render="image" />
      </StageCard>

      {/* 3단계: 비디오 */}
      <StageCard name="videos" job={job}>
        {stageStatus("images") !== "completed" && (
          <div className="alert info">이미지(2단계) 완료 후에만 실행할 수 있습니다 (412 게이팅).</div>
        )}
        <div className="stage-controls">
          <label className="inline-field">
            비디오 모델
            <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)}>
              {videoModels.map((m) => (
                <option key={m.name} value={m.name} disabled={!m.configured}>
                  {m.name}{m.configured ? "" : " (미설정)"}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            글자 노출
            <select value={textExposure} onChange={(e) => setTextExposure(e.target.value)}>
              <option value="">(기본값)</option>
              <option value="none">none</option>
              <option value="minimal">minimal</option>
              <option value="moderate">moderate</option>
              <option value="full">full</option>
            </select>
          </label>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={logoOutro}
              onChange={(e) => setLogoOutro(e.target.checked)}
            />
            로고 아웃트로
          </label>
          <StageButton
            name="videos"
            canRun={canRun("videos")}
            status={stageStatus("videos")}
            busy={busyStage === "videos"}
            onRun={(force) =>
              runStage("videos", {
                body: {
                  ...(videoModel ? { model: videoModel } : {}),
                  ...(textExposure ? { text_exposure: textExposure } : {}),
                  logo_outro: logoOutro,
                },
                force,
              })
            }
          />
        </div>
        <CutAssets assets={job.videos} kind="videos" jobId={job.job_id} render="video" />
        {job.final_video_url && (
          <div className="final-block">
            <h4>최종 결합본</h4>
            <AuthedVideo path={job.final_video_url} className="video" />
            <DownloadButton path={job.final_video_url} filename={`${job.job_id}_final.mp4`}>
              최종본 MP4 다운로드
            </DownloadButton>
          </div>
        )}
      </StageCard>

      {/* 4단계: 기획서 PDF */}
      <StageCard name="pdf" job={job}>
        <p className="muted">스토리보드만 완료되면 실행 가능합니다(이미지·비디오와 무관). 컷 이미지가 있으면 PDF 에 함께 삽입됩니다.</p>
        <div className="stage-controls">
          <StageButton
            name="pdf"
            canRun={canRun("pdf")}
            status={stageStatus("pdf")}
            busy={busyStage === "pdf"}
            onRun={(force) => runStage("pdf", { force })}
          />
        </div>
        {job.pdf_url && (
          <div className="row">
            <DownloadButton path={job.pdf_url} filename={`${job.job_id}_proposal.pdf`}>
              기획서 PDF 다운로드
            </DownloadButton>
          </div>
        )}
      </StageCard>
    </div>
  );
}

function StageCard({ name, job, children }) {
  const st = job.stages?.[name];
  return (
    <div className="card stage-card">
      <div className="stage-card-head">
        <h3>{STAGE_LABEL[name]}</h3>
        <StatusPill status={st?.status || "pending"} />
      </div>
      {st?.error && <div className="alert err">{st.error}</div>}
      {children}
    </div>
  );
}

function StageButton({ name, canRun, status, busy, onRun }) {
  if (status === "completed") {
    return (
      <button className="btn btn-sm" disabled={busy} onClick={() => onRun(true)}>
        {busy ? "재실행 중…" : "재실행 (force)"}
      </button>
    );
  }
  return (
    <button
      className="btn btn-primary btn-sm"
      disabled={!canRun || busy}
      onClick={() => onRun(false)}
    >
      {busy
        ? "실행 중…"
        : status === "in_progress"
        ? "진행 중…"
        : "이 단계 실행"}
    </button>
  );
}

function CutAssets({ assets, kind, render }) {
  if (!assets || assets.length === 0) return null;
  return (
    <div className="cut-grid">
      {assets.map((a) => (
        <div className="cut-item" key={a.cut}>
          <div className="cut-head">
            <span>컷 {a.cut}</span>
            <StatusPill status={a.status} />
          </div>
          {a.status === "completed" && a.url ? (
            render === "image" ? (
              <AuthedImage path={a.url} className="cut-media" />
            ) : (
              <AuthedVideo path={a.url} className="cut-media" />
            )
          ) : a.error ? (
            <div className="err small">{a.error}</div>
          ) : (
            <div className="media-fallback">대기 중</div>
          )}
        </div>
      ))}
    </div>
  );
}
