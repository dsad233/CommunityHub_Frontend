import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/index.ts";
import App from "@src/App.tsx";
import SignIn from "./pages/auth/signIn.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MyPage from "./pages/users/mypage.tsx";
import CertifiEmail from "./pages/auth/certifiEmail.tsx";
import ResetPassword from "./pages/auth/resetPassword.tsx";
import SignUp from "./pages/auth/signup.tsx";
import Posts from "./pages/posts/posts.tsx";
import PostCreate from "./pages/posts/postCreate.tsx";
import { PostOne } from "./pages/posts/postOne.tsx";
import PostUpdate from "./pages/posts/postUpdate.tsx";
import VerifyPage from "./pages/auth/verifyPage.tsx";
import MyCommentsPage from "./pages/users/myCommentsPage.tsx";
import MyPostsPage from "./pages/users/myPostsPage.tsx";
import EditUserPage from "./pages/users/editUserPage.tsx";
import EditProfilePage from "./pages/users/editProfilePage.tsx";
import GoogleRedirect from "./pages/auth/googleRedirect.tsx";
import GoogleLinkRedirect from "./pages/auth/googleLinkRedirect.tsx";
import GoogleSignUpSuccessRedirect from "./pages/auth/googleSignUpSuccessRedirect.tsx";
import GoogleSignUpFailureRedirect from "./pages/auth/GoogleSignUpFailureRedirect.tsx";
import NotFound from "./pages/common/notFound.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      <Header />
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<App />} />
        // auth
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/email/verify" element={<VerifyPage />} />
        <Route path="/auth/password/forgot" element={<CertifiEmail />} />
        <Route path="/auth/password/reset" element={<ResetPassword />} />
        <Route path="/signin/google/redirect" element={<GoogleRedirect />} />
        <Route
          path="/signup/google/success/redirect"
          element={<GoogleSignUpSuccessRedirect />}
        />
        <Route
          path="/signup/google/fail/redirect"
          element={<GoogleSignUpFailureRedirect />}
        />
        <Route path="/link/google/redirect" element={<GoogleLinkRedirect />} />
        // users
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/users/comments" element={<MyCommentsPage />} />
        <Route path="/users/posts" element={<MyPostsPage />} />
        <Route path="/users/profile/edit" element={<EditProfilePage />} />
        <Route path="/users/edit" element={<EditUserPage />} />
        // posts
        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/:id" element={<PostOne />} />
        <Route path="/posts/create" element={<PostCreate />} />
        <Route path="/posts/update/:id" element={<PostUpdate />} />
      </Routes>
    </StrictMode>
  </BrowserRouter>,
);
