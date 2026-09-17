import { useState } from "react";
import "../../styles/auth/resetPassword.css";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [query, _] = useSearchParams();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const isMatched =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.get("email") || !query.get("token")) {
      alert("유효하지 않은 접근입니다.");
      return;
    }

    if (!isPasswordValid) {
      alert("비밀번호 조건을 확인해주세요.");
      return;
    }

    if (!isMatched) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    await fetch(
      `/api/auth/update/password?email=${encodeURIComponent(query.get("email") as string)}&token=${encodeURIComponent(query.get("token") as string)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassowrd: password,
          newConfirmPassword: confirmPassword,
        }),
      },
    )
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
          alert("비밀번호 변경이 완료되었습니다.");
          setLoading(false);
          setDone(true);
          return res;
        }
      });
  };

  if (!query.get("email") || !query.get("token")) {
    return (
      <div className="reset-page">
        <section className="reset-shell single">
          <div className="reset-card">
            <span className="mini-badge">INVALID ACCESS</span>
            <h1>잘못된 접근입니다</h1>
            <p>
              이 페이지는 이메일 인증 완료 후 발급된 유효한 링크로만 접근할 수
              있습니다.
            </p>
            <a href="/forgot-password" className="reset-pw-link">
              비밀번호 재설정 다시 요청하기
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="reset-page">
      <section className="reset-shell">
        <div className="reset-brand">
          <div className="brand-logo">C</div>
          <span className="brand-badge">PASSWORD RESET</span>
          <h1>새 비밀번호를 설정해주세요.</h1>
          <p>
            이메일 인증이 완료되었습니다. 아래에서 새로운 비밀번호를 입력하고
            계정 보안을 다시 설정하세요.
          </p>
        </div>

        <div className="reset-panel">
          <div className="reset-card">
            <span className="mini-badge">STEP 2</span>
            <h2>비밀번호 변경</h2>
            <p>안전한 새 비밀번호를 입력한 뒤 변경을 완료하세요.</p>

            {!done ? (
              <form className="reset-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span>새 비밀번호</span>
                  <div className="input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="새 비밀번호 입력"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "숨기기" : "보기"}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>새 비밀번호 확인</span>
                  <div className="input-wrap">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호 다시 입력"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? "숨기기" : "보기"}
                    </button>
                  </div>
                </label>

                <div className="password-guide">
                  <strong>비밀번호 조건</strong>
                  <ul>
                    <li className={passwordRules.length ? "valid" : ""}>
                      8자 이상
                    </li>
                    <li className={passwordRules.uppercase ? "valid" : ""}>
                      영문 대문자 1개 이상
                    </li>
                    <li className={passwordRules.lowercase ? "valid" : ""}>
                      영문 소문자 1개 이상
                    </li>
                    <li className={passwordRules.number ? "valid" : ""}>
                      숫자 1개 이상
                    </li>
                    <li className={passwordRules.special ? "valid" : ""}>
                      특수문자 1개 이상
                    </li>
                  </ul>
                </div>

                <div className={`match-box ${isMatched ? "valid" : ""}`}>
                  {confirmPassword.length === 0
                    ? "새 비밀번호를 한 번 더 입력해주세요."
                    : isMatched
                      ? "비밀번호가 일치합니다."
                      : "비밀번호가 일치하지 않습니다."}
                </div>

                <button
                  type="submit"
                  className="reset-pw-btn"
                  disabled={loading}
                >
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </form>
            ) : (
              <div className="success-box">
                <div className="success-icon">✓</div>
                <h3>비밀번호가 변경되었습니다</h3>
                <p>
                  이제 새로운 비밀번호로 로그인할 수 있습니다. 보안을 위해 기존
                  세션은 다시 로그인하도록 처리하는 것이 좋습니다.
                </p>
                <a href="/signin" className="reset-pw-link">
                  로그인 하러 가기
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
