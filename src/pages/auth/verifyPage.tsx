import { useEffect, useState } from "react";
import "../../styles/auth/verifyPage.css";

type VerifyStatus = "loading" | "success" | "already-verified" | "error";

export default function VerifyPage() {
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("이메일 인증을 확인하고 있습니다.");

  useEffect(() => {
    const verifyEmail = async () => {
      const query = new URLSearchParams(window.location.search);
      const email = query.get("email");

      if (!email) {
        setStatus("error");
        setMessage("잘못된 인증 요청입니다. 다시 시도해 주세요.");
        return;
      }

      await fetch(`/api/auth/verify?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then(async (res) => {
          const response = await res.json();
          if (res.status > 200 && res.status < 500) {
            if (res.status === 400) {
              setStatus("already-verified");
              setMessage("이 계정은 이미 이메일 인증이 완료된 상태예요.");
              return;
            }
            setStatus("error");
            setMessage(response.error || "인증 처리 중 문제가 발생했습니다.");
            return;
          } else if (res.status >= 500) {
            setStatus("error");
            setMessage("서버와 통신하는 중 문제가 발생했습니다.");
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then((res) => {
          if (res?.ok) {
            setStatus("success");
            setMessage("이메일 인증이 정상적으로 완료되었어요.");
            return res;
          }
        });
    };

    verifyEmail();
  }, []);

  const titleMap: Record<VerifyStatus, string> = {
    loading: "이메일 인증을 확인하고 있어요",
    success: "이메일 인증이 완료되었어요",
    "already-verified": "이미 이메일 인증이 완료되었어요",
    error: "이메일 인증을 진행할 수 없어요",
  };

  const badgeMap: Record<VerifyStatus, string> = {
    loading: "VERIFYING",
    success: "VERIFIED",
    "already-verified": "ALREADY VERIFIED",
    error: "FAILED",
  };

  return (
    <main className="verify-page">
      <section
        className={`verify-card ${status}`}
        aria-labelledby="verify-title"
      >
        <div className={`verify-icon ${status}`} aria-hidden="true">
          {status === "error" ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8V13"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17" r="1.2" fill="currentColor" />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          ) : status === "loading" ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M20 7L10.8 16.2L6 11.4"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <span className={`verify-badge ${status}`}>{badgeMap[status]}</span>

        <h1 id="verify-title">{titleMap[status]}</h1>

        <p className="verify-description">{message}</p>

        {status !== "loading" && (
          <div className="verify-actions">
            <a href="/signin" className="verify-btn primary">
              로그인하러 가기
            </a>
            <a href="/" className="verify-btn secondary">
              홈으로 가기
            </a>
          </div>
        )}

        {status === "loading" && (
          <div className="verify-loading-bar">
            <span />
          </div>
        )}

        <p className="verify-help">
          {status === "success" &&
            "이제 로그인 후 서비스를 정상적으로 이용할 수 있습니다."}
          {status === "already-verified" &&
            "이미 처리된 인증 링크일 수 있어요. 바로 로그인해서 이용해 주세요."}
          {status === "error" &&
            "링크가 만료되었거나 잘못된 요청일 수 있습니다. 다시 시도해 주세요."}
          {status === "loading" && "잠시만 기다려 주세요."}
        </p>
      </section>
    </main>
  );
}
