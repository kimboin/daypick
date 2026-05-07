"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/date-picker";
import { createDateRange } from "@/lib/date";

export function CreateForm() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allDates = useMemo(() => createDateRange(startDate, endDate), [startDate, endDate]);

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort(),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName,
          startDate,
          endDate,
          availableDates: selectedDates,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "방 생성에 실패했습니다.");
      }

      setInviteCode(data.inviteCode);
      router.push(`/room/${data.inviteCode}?created=1`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "방 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Create Room</span>
        <h1 className="hero-title">방을 만들고 날짜 범위를 정하세요</h1>
        <p className="hero-text">
          방장은 초대코드를 만든 뒤 친구들에게 공유합니다. 먼저 가능한 날짜 범위를 정하고, 그 안에서
          본인이 가능한 날짜를 선택하면 됩니다.
        </p>
      </section>

      <div className="layout-grid">
        <form className="panel field-group" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="hostName">방장 닉네임</label>
            <input
              id="hostName"
              className="input"
              value={hostName}
              onChange={(event) => setHostName(event.target.value)}
              placeholder="예: 민지"
            />
          </div>

          <div className="row form-row">
            <div className="field form-row-item">
              <label htmlFor="startDate">시작일</label>
              <input
                id="startDate"
                type="date"
                className="input"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setSelectedDates([]);
                }}
              />
            </div>
            <div className="field form-row-item">
              <label htmlFor="endDate">종료일</label>
              <input
                id="endDate"
                type="date"
                className="input"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setSelectedDates([]);
                }}
              />
            </div>
          </div>

          <div className="field">
            <label>가능한 날짜 선택</label>
            <DatePicker allDates={allDates} selectedDates={selectedDates} onToggle={toggleDate} />
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="form-actions">
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "초대코드 만들기"}
            </button>
          </div>
        </form>

        <aside className="panel">
          <h2>진행 방식</h2>
          <p className="section-text">
            1. 닉네임을 입력합니다.
            <br />
            2. 친구들과 맞출 날짜 범위를 정합니다.
            <br />
            3. 본인이 가능한 날짜를 여러 개 선택합니다.
            <br />
            4. 생성된 6자리 코드를 친구에게 전달합니다.
          </p>

          <div className="info-box" style={{ marginTop: 18 }}>
            <strong>안내</strong>
            <p className="help-text">
              생성이 끝나면 결과 화면으로 바로 이동합니다. 현재 버전에서는 같은 닉네임으로 다시 제출하면
              기존 입력이 갱신됩니다.
            </p>
          </div>

          {inviteCode ? (
            <div className="status-box" style={{ marginTop: 18 }}>
              생성된 초대코드: <strong>{inviteCode}</strong>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
