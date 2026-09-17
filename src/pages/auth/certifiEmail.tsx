import { useState } from "react";
import "../../styles/auth/certifiEmail.css";
import { useNavigate } from "react-router-dom";

export default function CertifiEmail() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState<boolean>(false);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    await fetch("/api/auth/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then(async (res) => {
        if (res.status > 200 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
          setLoading(false);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then((res) => {
        if (res?.ok) {
          setStep("verify");
          setLoading(false);
          return res;
        }
      });
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!code.trim()) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    setVerifyLoading(true);

    await fetch("/api/auth/authentication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, type: "PASSWORD", code }),
    })
      .then(async (res) => {
        if (res.status > 200 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
          setLoading(false);
          setVerifyLoading(false);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then(async (res) => {
        if (res?.ok) {
          const response = await res.json();
          alert("인증이 완료되었습니다.");
          setLoading(false);
          setVerifyLoading(false);

          navigate(
            `/auth/password/reset?email=${encodeURIComponent(email)}&token=${encodeURIComponent(response.token)}`,
          );
          return res;
        }
      });
  };

  const handleResendCode = async () => {
    setLoading(true);
    setCode("");

    await fetch("/api/auth/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then(async (res) => {
        if (res.status > 200 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
          setLoading(false);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then((res) => {
        if (res?.ok) {
          alert("인증번호를 다시 전송했습니다. 이메일을 확인해주세요.");
          setLoading(false);
          return res;
        }
      });
  };

  return (
    <div className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand">
          <div className="brand-logo">C</div>
          <span className="brand-badge">PASSWORD RECOVERY</span>
          <h1>이메일 인증으로 비밀번호를 재설정하세요.</h1>
          <p>
            가입한 이메일 주소를 입력한 뒤, 메일로 전송된 인증번호를 확인하면 새
            비밀번호를 설정할 수 있습니다.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-card">
            <span className="mini-badge">STEP 1</span>
            <h2>이메일 인증</h2>
            <p>가입한 이메일 주소를 입력해주세요.</p>

            <form className="auth-form" onSubmit={handleSendCode}>
              <label className="field">
                <span>이메일</span>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step === "verify"}
                />
              </label>

              {step === "email" && (
                <button
                  type="submit"
                  className="email-send-btn"
                  disabled={loading}
                >
                  {loading ? "전송 중..." : "인증 메일 보내기"}
                </button>
              )}
            </form>

            {step === "verify" && (
              <>
                <div className="success-box">
                  <strong>{email}</strong>로 인증번호를 전송했습니다. 메일함을
                  확인한 뒤 아래에 인증번호를 입력해주세요.
                </div>

                <form
                  className="auth-form verify-form"
                  onSubmit={handleVerifyCode}
                >
                  <label className="field">
                    <span>인증번호</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6자리 인증번호 입력"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </label>

                  <button
                    type="submit"
                    className="certifi-email-verify-btn"
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? "확인 중..." : "인증번호 확인"}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    {loading ? "재전송 중..." : "인증번호 다시 보내기"}
                  </button>
                </form>
              </>
            )}

            <p className="bottom-link">
              로그인으로 돌아가기 <a href="/signin">로그인</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
