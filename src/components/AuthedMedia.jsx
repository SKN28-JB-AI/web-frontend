import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

// Bearer 인증이 필요한 미디어(이미지/비디오)는 <img src>로 직접 못 띄운다.
// authFetch 로 blob 을 받아 objectURL 로 렌더링한다.
function useBlobUrl(path) {
  const { authFetch } = useAuth();
  const [url, setUrl] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    setUrl(null);
    setErr(null);
    if (!path) return;
    (async () => {
      try {
        const res = await authFetch(path);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (alive) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      } catch (e) {
        if (alive) setErr(e.message);
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, authFetch]);
  return { url, err };
}

export function AuthedImage({ path, alt, className }) {
  const { url, err } = useBlobUrl(path);
  if (err) return <div className="media-fallback err">이미지 오류: {err}</div>;
  if (!url) return <div className="media-fallback">불러오는 중…</div>;
  return <img src={url} alt={alt || ""} className={className} />;
}

export function AuthedVideo({ path, className }) {
  const { url, err } = useBlobUrl(path);
  if (err) return <div className="media-fallback err">영상 오류: {err}</div>;
  if (!url) return <div className="media-fallback">불러오는 중…</div>;
  return <video src={url} controls className={className} />;
}

// 인증 다운로드 버튼 (PDF/MP4/SRT 등)
export function DownloadButton({ path, filename, children }) {
  const { authFetch } = useAuth();
  const [busy, setBusy] = useState(false);
  const aRef = useRef(null);
  const onClick = async () => {
    setBusy(true);
    try {
      const res = await authFetch(path);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = aRef.current;
      a.href = objectUrl;
      a.download = filename || "download";
      a.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } catch (e) {
      alert("다운로드 실패: " + e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button className="btn btn-sm" onClick={onClick} disabled={busy}>
        {busy ? "받는 중…" : children || "다운로드"}
      </button>
      <a ref={aRef} style={{ display: "none" }}>　</a>
    </>
  );
}
