"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/date-picker";
import { createDateRange } from "@/lib/date";

type RoomMeta = {
  hostName: string;
  startDate: string;
  endDate: string;
  inviteCode: string;
};

export function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [room, setRoom] = useState<RoomMeta | null>(null);
  const [nickname, setNickname] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function verifyCode(rawCode: string) {
    setError("");
    setIsLoading(true);

    try {
      const normalizedCode = rawCode.replace(/\D/g, "").slice(0, 6);
      const response = await fetch(`/api/rooms/${normalizedCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "초대코드를 확인할 수 없습니다.");
      }

      setRoom(data);
    } catch (checkError) {
      setRoom(null);
      setError(checkError instanceof Error ? checkError.message : "코드 확인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  const allDates = useMemo(() => {
    if (!room) {
      return [];
    }

    return createDateRange(room.startDate, room.endDate);
  }, [room]);

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort(),
    );
  }

  async function handleCodeCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyCode(code);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCode = params.get("code")?.replace(/\D/g, "").slice(0, 6) ?? "";

    if (initialCode.length === 6) {
      setCode(initialCode);
      void verifyCode(initialCode);
    }
  }, []);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/rooms/${room.inviteCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, availableDates: selectedDates }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "참여 저장에 실패했습니다.");
      }

      router.push(`/room/${room.inviteCode}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "참여 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Join Room</span>
        <h1 className="hero-title">초대코드로 바로 참여하기</h1>
        <p className="hero-text">
          전달받은 6자리 코드를 입력하면 방장이 정한 날짜 범위 안에서 가능한 일정을 선택할 수 있습니다.
        </p>
      </section>

      <div className="layout-grid">
        <div className="panel">
          {!room ? (
            <form className="field-group" onSubmit={handleCodeCheck}>
              <div className="field">
                <label htmlFor="inviteCode">초대코드 입력</label>
                <input
                  id="inviteCode"
                  className="code-input"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                />
              </div>

              {error ? <p className="error-text">{error}</p> : null}

              <div className="form-actions">
                <button className="button" type="submit" disabled={isLoading}>
                  {isLoading ? "확인 중..." : "코드 확인"}
                </button>
              </div>
            </form>
          ) : (
            <form className="field-group" onSubmit={handleJoin}>
              <div className="status-box">
                방장: <strong>{room.hostName}</strong>
                <br />
                날짜 범위: <strong>{room.startDate}</strong> ~ <strong>{room.endDate}</strong>
              </div>

              <div className="field">
                <label htmlFor="nickname">닉네임</label>
                <input
                  id="nickname"
                  className="input"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: 지수"
                />
              </div>

              <div className="field">
                <label>가능한 날짜 선택</label>
                <DatePicker allDates={allDates} selectedDates={selectedDates} onToggle={toggleDate} />
              </div>

              {error ? <p className="error-text">{error}</p> : null}

              <div className="form-actions">
                <button className="button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "제출 중..." : "가능 날짜 제출"}
                </button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => {
                    setRoom(null);
                    setNickname("");
                    setSelectedDates([]);
                    setError("");
                    setCode("");
                  }}
                >
                  코드 다시 입력
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="panel">
          <h2>참여 안내</h2>
          <p className="section-text">
            초대코드가 유효하면 닉네임과 날짜 선택 화면으로 넘어갑니다. 제출이 끝나면 모든 참여자의
            가능한 날짜와 겹치는 후보를 결과 화면에서 볼 수 있습니다.
          </p>
        </aside>
      </div>
    </div>
  );
}
