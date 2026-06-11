import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PageHeader, Field } from "../../components/ui.jsx";

// 1단계: 스토리보드 생성 프롬프트 페이지 (POST /v2/ads/storyboards)
export default function AdsStoryboard() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    prompt: "",
    options: {
      cut_count: 3,
      total_duration_sec: 16,
      aspect_ratio: "16:9",
      resolution: "1080p",
      locale: "ko-KR",
      brand: "JB금융그룹",
    },
  });

  const setOpt = (k, v) =>
    setForm((s) => ({ ...s, options: { ...s.options, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/v2/ads/storyboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "HTTP " + res.status);
      // 잡 생성 후 파이프라인 진행 페이지로 이동
      navigate(`/mma/ads/${data.job_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="광고 파이프라인 · 새 스토리보드"
        subtitle="프롬프트로 광고 스토리보드를 생성하고 4단계 파이프라인을 시작합니다."
      />
      {error && <div className="alert err">{error}</div>}
      <form className="card form" onSubmit={submit}>
        <Field label="광고 프롬프트" hint="캠페인 목표·상품·톤을 자유롭게 작성하세요.">
          <textarea
            rows={5}
            required
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            placeholder="예: MZ세대를 겨냥한 비대면 대출 상품의 신뢰감 있는 15초 영상 광고"
          />
        </Field>
        <div className="form-row">
          <Field label="컷 수">
            <input
              type="number"
              min="1"
              max="8"
              value={form.options.cut_count}
              onChange={(e) => setOpt("cut_count", Number(e.target.value))}
            />
          </Field>
          <Field label="전체 길이(초)">
            <input
              type="number"
              min="4"
              max="60"
              value={form.options.total_duration_sec}
              onChange={(e) => setOpt("total_duration_sec", Number(e.target.value))}
            />
          </Field>
          <Field label="브랜드">
            <input
              value={form.options.brand}
              onChange={(e) => setOpt("brand", e.target.value)}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="화면 비율">
            <select
              value={form.options.aspect_ratio}
              onChange={(e) => setOpt("aspect_ratio", e.target.value)}
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
            </select>
          </Field>
          <Field label="해상도">
            <select
              value={form.options.resolution}
              onChange={(e) => setOpt("resolution", e.target.value)}
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
            </select>
          </Field>
          <Field label="콘텐츠 언어">
            <input
              value={form.options.locale}
              onChange={(e) => setOpt("locale", e.target.value)}
            />
          </Field>
        </div>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "생성 요청 중…" : "스토리보드 생성 & 파이프라인 시작"}
        </button>
      </form>
    </div>
  );
}
