// 잔여 쿠폰 표시 — auth-server /coupons/me 를 조회해 해당 기능의 잔여 횟수를 보여준다.
// type: "video" | "ad"
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { AUTH_BASE } from "../config.js";

const LABEL = { video: "영상 생성", ad: "광고 파이프라인" };

export default function CouponBadge({ type }) {
  const { authFetch } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authFetch(AUTH_BASE + "/coupons/me");
        if (!res.ok) return;
        const d = await res.json();
        if (alive) setInfo(d);
      } catch {
        /* 표시는 부가 기능 — 조용히 무시 */
      }
    })();
    return () => {
      alive = false;
    };
  }, [authFetch]);

  if (!info) return null;
  const remaining = type === "video" ? info.video_coupons : info.ad_coupons;
  const text = info.unlimited ? "무제한" : `${remaining}회`;
  const cls = !info.unlimited && remaining === 0 ? "alert err" : "alert info";
  return (
    <div className={cls} style={{ display: "inline-block", padding: "6px 12px" }}>
      {LABEL[type]} 잔여 쿠폰: <strong>{text}</strong>
      {!info.unlimited && remaining === 0 && " — 관리자에게 발급을 요청하세요"}
    </div>
  );
}
