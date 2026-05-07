"use client";

import { useEffect, useState } from "react";

type Props = {
  inviteCode: string;
  created?: boolean;
};

export function SharePanel({ inviteCode, created = false }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"" | "link" | "code">("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareLink = origin ? `${origin}/join?code=${inviteCode}` : `/join?code=${inviteCode}`;

  async function copyText(type: "link" | "code", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  }

  return (
    <section className={`share-panel ${created ? "created" : ""}`}>
      <div className="share-panel-header">
        <div>
          <p className="share-kicker">{created ? "방 생성 완료" : "친구 초대하기"}</p>
          <h2>{created ? "이제 친구들에게 바로 공유하세요" : "링크와 초대코드를 같이 보낼 수 있어요"}</h2>
        </div>
        <div className="share-code-badge">{inviteCode}</div>
      </div>

      <p className="section-text">
        링크를 보내면 친구가 바로 입장 화면으로 이동하고, 초대코드도 자동으로 채워집니다. 메신저에는 링크와
        초대코드를 같이 보내는 방식이 가장 자연스럽습니다.
      </p>

      <div className="share-box">
        <span className="share-label">참여 링크</span>
        <div className="share-value">{shareLink}</div>
        <button className="button" type="button" onClick={() => copyText("link", shareLink)}>
          {copied === "link" ? "링크 복사됨" : "링크 복사하기"}
        </button>
      </div>

      <div className="share-box soft">
        <span className="share-label">초대코드</span>
        <div className="share-value code">{inviteCode}</div>
        <button className="button-secondary" type="button" onClick={() => copyText("code", inviteCode)}>
          {copied === "code" ? "코드 복사됨" : "초대코드 복사"}
        </button>
      </div>

      <div className="info-box">
        <strong>공유 문구 예시</strong>
        <p className="help-text">
          여기로 들어와서 가능한 날짜 골라줘:
          <br />
          {shareLink}
          <br />
          초대코드: {inviteCode}
        </p>
      </div>
    </section>
  );
}
