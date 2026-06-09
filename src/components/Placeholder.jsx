import { useState } from "react";
import { PageHeader } from "./ui.jsx";

// 아직 백엔드가 구현되지 않은 에이전트의 빈 프롬프트 페이지.
// UI 는 동작하지만 전송은 비활성(준비 중) 상태.
export function PlaceholderPrompt({ title, subtitle, placeholder }) {
  const [text, setText] = useState("");
  return (
    <div className="page">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="alert info">
        이 에이전트는 아직 구현되지 않았습니다. 화면은 준비되어 있으며, 백엔드 연동 후 활성화됩니다.
      </div>
      <div className="card form">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
        />
        <button className="btn btn-primary" disabled title="준비 중">
          전송 (준비 중)
        </button>
      </div>
    </div>
  );
}
