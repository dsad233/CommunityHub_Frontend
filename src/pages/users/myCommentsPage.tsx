import { useEffect, useState } from "react";
import "../../styles/users/myCommentsPage.css";
import { getVisiblePages, getWithExpiry } from "@src/utils";
import { useNavigate } from "react-router-dom";
import { Loading } from "@src/components";
import Pagination from "@src/components/pagination";

type TMyComment = {
  id: string;
  context: string;
  type: string;
  parentId: string | null;
  createdAt: string;
  posts: {
    id: string;
    title: string;
    category: {
      key: string;
      name: string;
    };
  };
  users: {
    nickname: string;
  };
}[];

export type TStateComments = {
  week: number;
  reply: number;
};

export default function MyCommentsPage() {
  const navigate = useNavigate();
  const isSession = getWithExpiry("ack");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comments, setComments] = useState<TMyComment>([]);
  const [count, setCount] = useState<number>(0);
  const [stateComments, setStateComments] = useState<TStateComments>({
    week: 0,
    reply: 0,
  });
  const [inputSearch, setInputSearch] = useState<string>("");
  const [selectType, setSelectType] = useState<string>("ALL");
  const [selectOrder, setSelectOrder] = useState<string>("NEW");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(10);

  const totalPages = Math.ceil(count / pages);

  // 수정 시작
  const handleStartEdit = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  // 수정 취소
  const handleCancelEdit = (originalContent: string) => {
    if (editContent.trim() !== originalContent.trim()) {
      const isConfirm = window.confirm("수정 내용을 취소하시겠습니까?");
      if (!isConfirm) return;
    }

    setEditingCommentId(null);
    setEditContent("");
  };

  const handleSaveEdit = async ({
    postId,
    commentId,
    type,
    parentId,
  }: {
    postId: string;
    commentId: string;
    type: string;
    parentId: string | null;
  }) => {
    if (!editContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    setIsSaving(true);

    if (type === "COMMENT" && parentId === null) {
      await fetch(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
          body: JSON.stringify({
            context: editContent,
            type: type,
          }),
        },
      )
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
          } else if (res.status >= 500) {
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            window.location.reload();
            return res;
          }
        });

      return;
    } else {
      await fetch(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies/${encodeURIComponent(parentId as string)}/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
          body: JSON.stringify({
            context: editContent,
            type: type,
          }),
        },
      )
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
          } else if (res.status >= 500) {
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            window.location.reload();
            return res;
          }
        });
    }
  };

  const handleDeleteComment = async ({
    postId,
    commentId,
    type,
    parentId,
  }: {
    postId: string;
    commentId: string;
    type: string;
    parentId: string | null;
  }) => {
    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    const message = confirm("댓글을 삭제하시겠습니까?");

    if (!message) return;

    if (type === "COMMENT" && parentId === null) {
      await fetch(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/remove`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
        },
      )
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
          } else if (res.status >= 500) {
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            alert("댓글 삭제가 완료 되었습니다.");
            window.location.reload();
            return res;
          }
        });

      return;
    } else {
      // 대댓글 삭제
      await fetch(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(parentId as string)}/replies/${encodeURIComponent(commentId)}/remove`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
        },
      )
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
          } else if (res.status >= 500) {
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            alert("댓글 삭제가 완료 되었습니다.");
            window.location.reload();
            return res;
          }
        });
    }
  };

  useEffect(() => {
    if (!isSession) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/signin");
      return;
    }

    const requestWriteComments = async () => {
      await fetch(
        `/api/users/write/comments??page=${encodeURIComponent(page)}&pages=${encodeURIComponent(pages)}&search=${encodeURIComponent(inputSearch)}&orderBy=${encodeURIComponent(selectOrder)}&type=${encodeURIComponent(selectType)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
        },
      )
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
          } else if (res.status >= 500) {
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            const response = await res.json();
            setComments(response.data?.comments);
            setStateComments(response.data?.countState);
            setPage(response.data?.paginations.page);
            setPages(response.data?.paginations.pages);
            setCount(response.data?.paginations.count);
            return res;
          }
        });
    };

    requestWriteComments();
  }, [page, pages, isSession, navigate, inputSearch, selectType, selectOrder]);

  const visiblePages = getVisiblePages(page, totalPages);

  const handleMovePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <main className="my-comments-page">
          <section className="my-comments-shell">
            <header className="my-comments-hero">
              <div>
                <span className="my-comments-badge">MY PAGE</span>
                <h1>최근 댓글 전체보기</h1>
                <p>
                  내가 작성한 댓글과 대댓글을 시간순으로 모아보고, 원문 게시글로
                  바로 이동할 수 있어요.
                </p>
              </div>

              <div className="my-comments-summary">
                <div className="summary-card">
                  <strong>
                    {count.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>전체 댓글</span>
                </div>
                <div className="summary-card">
                  <strong>
                    {stateComments.week.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>이번 주 작성</span>
                </div>
                <div className="summary-card">
                  <strong>
                    {stateComments.reply.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>대댓글</span>
                </div>
              </div>
            </header>

            <section className="my-comments-toolbar">
              <div className="toolbar-left">
                <button
                  className={`toolbar-chip ${selectType === "ALL" ? "active" : ""}`}
                  onClick={() => setSelectType("ALL")}
                >
                  전체
                </button>
                <button
                  className={`toolbar-chip ${selectType === "COMMENT" ? "active" : ""}`}
                  onClick={() => setSelectType("COMMENT")}
                >
                  댓글
                </button>
                <button
                  className={`toolbar-chip ${selectType === "REPLY" ? "active" : ""}`}
                  onClick={() => setSelectType("REPLY")}
                >
                  대댓글
                </button>
              </div>

              <div className="toolbar-right">
                <input
                  type="text"
                  placeholder="댓글 내용 또는 게시글 제목 검색"
                  aria-label="댓글 검색"
                  onChange={(e) => setInputSearch(e.target.value)}
                />
                <select
                  aria-label="정렬 선택"
                  onChange={(e) => setSelectOrder(e.target.value)}
                >
                  <option value="NEW">최신순</option>
                  <option value="OLD">오래된순</option>
                </select>
              </div>
            </section>

            <section className="my-comments-list-section">
              <div className="my-comments-list-head">
                <h2>댓글 목록</h2>
                <span>{comments.length}개</span>
              </div>

              <div className="my-comments-list">
                {comments.map((comment) => {
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <article className="my-comment-card" key={comment.id}>
                      <div className="my-comment-top">
                        <div className="my-comment-meta">
                          <span
                            className={`comment-category ${comment.posts.category.key.toLowerCase()}`}
                          >
                            {comment.posts.category.name}
                          </span>
                          {comment.parentId !== null &&
                            comment.type === "REPLY" && (
                              <span className="comment-type-badge">대댓글</span>
                            )}
                        </div>

                        <span className="comment-time">
                          {comment.createdAt}
                        </span>
                      </div>

                      <strong className="comment-author">
                        {comment.users.nickname}
                      </strong>

                      {isEditing ? (
                        <div className="comment-edit-box">
                          <textarea
                            className="comment-edit-textarea"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            maxLength={1000}
                            rows={4}
                          />

                          <div className="comment-edit-footer">
                            <span className="comment-edit-count">
                              {editContent.length}/1000
                            </span>

                            <div className="comment-edit-actions">
                              <button
                                type="button"
                                className="comment-action-btn ghost"
                                onClick={() =>
                                  handleCancelEdit(comment.context)
                                }
                                disabled={isSaving}
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                className="comment-action-btn primary"
                                onClick={() =>
                                  handleSaveEdit({
                                    postId: comment.posts.id,
                                    commentId: comment.id,
                                    type: comment.type,
                                    parentId: comment.parentId,
                                  })
                                }
                                disabled={isSaving}
                              >
                                {isSaving ? "저장 중..." : "저장"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="comment-context">{comment.context}</p>
                      )}

                      <div className="comment-post-box">
                        <span className="comment-post-label">원문 게시글</span>
                        <a
                          href={`/posts/${comment.posts.id}`}
                          className="comment-post-link"
                        >
                          {comment.posts.title}
                        </a>
                      </div>

                      {!isEditing && (
                        <div className="comment-actions">
                          <button
                            type="button"
                            className="comment-action-btn ghost"
                            onClick={() =>
                              handleStartEdit(comment.id, comment.context)
                            }
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="comment-action-btn danger"
                            onClick={() =>
                              handleDeleteComment({
                                postId: comment.posts.id,
                                commentId: comment.id,
                                type: comment.type,
                                parentId: comment.parentId,
                              })
                            }
                          >
                            삭제
                          </button>
                          <a
                            href={`/posts/${comment.posts.id}`}
                            className="comment-action-btn primary"
                          >
                            게시글로 이동
                          </a>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <Pagination
              page={page}
              totalPages={totalPages}
              visiblePages={visiblePages}
              onMovePage={handleMovePage}
              ariaLabel="내 게시글 페이지 이동"
            />
          </section>
        </main>
      )}
    </>
  );
}
