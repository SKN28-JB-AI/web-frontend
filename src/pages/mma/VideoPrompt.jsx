import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader, Field } from "../../components/ui.jsx";
import CouponBadge from "../../components/CouponBadge.jsx";

const TEXT_EXPOSURE = ["", "none", "minimal", "moderate", "full"];
const DEFAULT_DURATION = 8; // 영상 길이 기본값(초)

// 모델의 지원 길이 목록에서 기본값(8초)에 가장 가까운 값을 고른다.
function nearestDuration(durations, target = DEFAULT_DURATION) {
  if (!durations || durations.length === 0) return target;
  return durations.reduce((a, b) =>
    Math.abs(b - target) < Math.abs(a - target) ? b : a
  );
}

function durationsOf(models, name) {
  const m = models.find((x) => x.name === name);
  return m?.supported_durations || [];
}

export default function VideoPrompt() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("message"); // message | pdf
  const [models, setModels] = useState([]);
  const [modelsErr, setModelsErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 메시지 모드 폼
  const [msg, setMsg] = useState({
    prompt: "",
    model: "",
    language: "ko",
    duration_sec: DEFAULT_DURATION,
    aspect_ratio: "16:9",
    resolution: "1080p",
    generate_audio: true,
    text_exposure: "",
    logo_outro: false,
    enhance_prompt: false,
  });

  // PDF 모드 폼
  const [pdf, setPdf] = useState({
    file: null,
    model: "",
    logo: null,
    options: {
      generation_mode: "single",
      target_total_duration_sec: 24,
      max_scenes: 4,
      language: "ko",
      aspect_ratio: "16:9",
      resolution: "1080p",
      enable_narration: false,
      burn_subtitles: false,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/v1/models");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setModels(data.models || []);
        const first = (data.models || []).find((m) => m.configured) || data.models?.[0];
        if (first) {
          const dur = nearestDuration(first.supported_durations);
          setMsg((s) => ({ ...s, model: first.name, duration_sec: dur }));
          setPdf((s) => ({ ...s, model: first.name }));
        }
      } catch (e) {
        setModelsErr(e.message);
      }
    })();
  }, [authFetch]);

  const submitMessage = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        prompt: msg.prompt,
        model: msg.model,
        language: msg.language,
        aspect_ratio: msg.aspect_ratio,
        resolution: msg.resolution,
        generate_audio: msg.generate_audio,
        enhance_prompt: msg.enhance_prompt,
        logo_outro: msg.logo_outro,
      };
      if (msg.duration_sec) body.duration_sec = Number(msg.duration_sec); // 드롭다운: 항상 모델 지원값
      if (msg.text_exposure) body.text_exposure = msg.text_exposure;
      const res = await authFetch("/v1/videos/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(detailOf(data, res.status));
      navigate(`/mma/jobs/${data.job_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitPdf = async (e) => {
    e.preventDefault();
    setError(null);
    if (!pdf.file) {
      setError("PDF 파일을 선택하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", pdf.file);
      fd.append("model", pdf.model);
      fd.append("options", JSON.stringify(pdf.options));
      if (pdf.logo) fd.append("logo", pdf.logo);
      const res = await authFetch("/v1/videos/pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(detailOf(data, res.status));
      navigate(`/mma/jobs/${data.job_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const msgDurations = durationsOf(models, msg.model);

  return (
    <div className="page">
      <PageHeader
        title="영상 생성"
        subtitle="메시지 또는 PDF 기획서를 기반으로 광고 영상을 생성합니다."
      />
      <div style={{ marginBottom: 14 }}>
        <CouponBadge type="video" />
      </div>

      <div className="tabs">
        <button
          className={"tab" + (mode === "message" ? " active" : "")}
          onClick={() => setMode("message")}
        >
          메시지 모드
        </button>
        <button
          className={"tab" + (mode === "pdf" ? " active" : "")}
          onClick={() => setMode("pdf")}
        >
          PDF 기획서 모드
        </button>
      </div>

      {modelsErr && <div className="alert err">모델 목록 로드 실패: {modelsErr}</div>}
      {error && <div className="alert err">{error}</div>}

      {mode === "message" ? (
        <form className="card form" onSubmit={submitMessage}>
          <Field label="프롬프트" hint="만들고 싶은 광고 영상을 설명하세요.">
            <textarea
              rows={4}
              required
              value={msg.prompt}
              onChange={(e) => setMsg({ ...msg, prompt: e.target.value })}
              placeholder="예: 청년 적금 상품을 소개하는 밝고 경쾌한 15초 광고"
            />
          </Field>
          <div className="form-row">
            <Field label="모델">
              <ModelSelect
                models={models}
                value={msg.model}
                onChange={(v) =>
                  setMsg((s) => ({
                    ...s,
                    model: v,
                    // 새 모델이 지원하는 길이로 보정(현재 값 우선, 없으면 8초 기준)
                    duration_sec: nearestDuration(
                      durationsOf(models, v),
                      Number(s.duration_sec) || DEFAULT_DURATION
                    ),
                  }))
                }
              />
            </Field>
            <Field label="발화 언어">
              <input
                value={msg.language}
                onChange={(e) => setMsg({ ...msg, language: e.target.value })}
                placeholder="ko"
              />
            </Field>
            <Field
              label="클립 길이(초)"
              hint={
                msgDurations.length
                  ? `${msg.model} 지원: 최대 ${Math.max(...msgDurations)}초`
                  : "모델을 먼저 선택하세요"
              }
            >
              <select
                value={String(msg.duration_sec)}
                onChange={(e) =>
                  setMsg({ ...msg, duration_sec: Number(e.target.value) })
                }
                disabled={!msgDurations.length}
              >
                {(msgDurations.length ? msgDurations : [DEFAULT_DURATION]).map(
                  (d) => (
                    <option key={d} value={String(d)}>
                      {d}초{d === DEFAULT_DURATION ? " (기본)" : ""}
                    </option>
                  )
                )}
              </select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="화면 비율">
              <select
                value={msg.aspect_ratio}
                onChange={(e) => setMsg({ ...msg, aspect_ratio: e.target.value })}
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
              </select>
            </Field>
            <Field label="해상도">
              <select
                value={msg.resolution}
                onChange={(e) => setMsg({ ...msg, resolution: e.target.value })}
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
              </select>
            </Field>
            <Field label="화면 글자 노출" hint="미지정 시 서버 기본값">
              <select
                value={msg.text_exposure}
                onChange={(e) => setMsg({ ...msg, text_exposure: e.target.value })}
              >
                {TEXT_EXPOSURE.map((t) => (
                  <option key={t} value={t}>
                    {t || "(기본값)"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="checks">
            <label>
              <input
                type="checkbox"
                checked={msg.generate_audio}
                onChange={(e) => setMsg({ ...msg, generate_audio: e.target.checked })}
              />
              오디오 생성
            </label>
            <label>
              <input
                type="checkbox"
                checked={msg.enhance_prompt}
                onChange={(e) => setMsg({ ...msg, enhance_prompt: e.target.checked })}
              />
              프롬프트 자동 보강
            </label>
            <label>
              <input
                type="checkbox"
                checked={msg.logo_outro}
                onChange={(e) => setMsg({ ...msg, logo_outro: e.target.checked })}
              />
              로고 아웃트로
            </label>
          </div>
          <button className="btn btn-primary" disabled={submitting || !msg.model}>
            {submitting ? "생성 요청 중…" : "영상 생성 요청"}
          </button>
        </form>
      ) : (
        <form className="card form" onSubmit={submitPdf}>
          <Field label="광고 기획서 PDF" hint="최대 30MB. PDF 모드는 OPENAI_API_KEY 가 필요합니다.">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdf({ ...pdf, file: e.target.files?.[0] || null })}
            />
          </Field>
          <div className="form-row">
            <Field label="모델">
              <ModelSelect
                models={models}
                value={pdf.model}
                onChange={(v) => setPdf({ ...pdf, model: v })}
              />
            </Field>
            <Field label="생성 모드">
              <select
                value={pdf.options.generation_mode}
                onChange={(e) =>
                  setPdf({
                    ...pdf,
                    options: { ...pdf.options, generation_mode: e.target.value },
                  })
                }
              >
                <option value="single">single (단일 합성)</option>
                <option value="scenes">scenes (씬별 결합)</option>
              </select>
            </Field>
            <Field label="언어">
              <input
                value={pdf.options.language}
                onChange={(e) =>
                  setPdf({
                    ...pdf,
                    options: { ...pdf.options, language: e.target.value },
                  })
                }
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="목표 총 길이(초)">
              <input
                type="number"
                min="4"
                max="120"
                value={pdf.options.target_total_duration_sec}
                onChange={(e) =>
                  setPdf({
                    ...pdf,
                    options: {
                      ...pdf.options,
                      target_total_duration_sec: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
            <Field label="최대 씬 수">
              <input
                type="number"
                min="1"
                max="8"
                value={pdf.options.max_scenes}
                onChange={(e) =>
                  setPdf({
                    ...pdf,
                    options: { ...pdf.options, max_scenes: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="로고(선택)" hint="오버레이 PNG">
              <input
                type="file"
                accept="image/png"
                onChange={(e) => setPdf({ ...pdf, logo: e.target.files?.[0] || null })}
              />
            </Field>
          </div>
          <div className="checks">
            <label>
              <input
                type="checkbox"
                checked={pdf.options.enable_narration}
                onChange={(e) =>
                  setPdf({
                    ...pdf,
                    options: { ...pdf.options, enable_narration: e.target.checked },
                  })
                }
              />
              내레이션 합성(TTS)
            </label>
            <label>
              <input
                type="checkbox"
                checked={pdf.options.burn_subtitles}
                onChange={(e) =>
                  setPdf({
                    ...pdf,
                    options: { ...pdf.options, burn_subtitles: e.target.checked },
                  })
                }
              />
              자막 굽기
            </label>
          </div>
          <button className="btn btn-primary" disabled={submitting || !pdf.model}>
            {submitting ? "업로드 중…" : "PDF 기획서로 생성 요청"}
          </button>
        </form>
      )}
    </div>
  );
}

function ModelSelect({ models, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="" disabled>
        모델 선택
      </option>
      {models.map((m) => (
        <option key={m.name} value={m.name} disabled={!m.configured}>
          {m.name} — {m.provider}
          {m.configured ? "" : " (미설정)"}
        </option>
      ))}
    </select>
  );
}

function detailOf(data, status) {
  if (!data) return "HTTP " + status;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
  return JSON.stringify(data);
}
