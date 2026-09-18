import { useEffect, useMemo, useState } from "react";
import "../../styles/posts/postOne.css";
import { useLocation, useNavigate } from "react-router-dom";
import { Loading } from "@src/components";
import { getWithExpiry, imageDecodeToUrl } from "@src/utils";

type TPostImage = string | null;

type TPost = {
  id: string;
  title: string;
  context: string | null;
  category: {
    key: string;
    name: string;
  };
  images: TPostImage[] | null;
  isPublic: string;
  createdAt: string;
  users: {
    nickname: string;
    image: string | null;
    property: boolean;
  };
  count: {
    likes: number;
    commentCount: number;
  };
  comments: {
    id: string | undefined;
    context: string | undefined;
    type: string | undefined;
    parentId: string | undefined | null;
    createdAt: string | undefined;
    deletedAt: string | undefined;
    author:
      | {
          nickname: string;
          image: string | null;
          property: boolean;
        }
      | undefined;
    count: {
      likes: number | undefined;
    };
    replies:
      | {
          id: string | null;
          context: string | null;
          type: string | null;
          parentId: string | null;
          createdAt: string | null;
          deletedAt: string;
          author: {
            nickname: string;
            image: string | null;
            property: boolean;
          };
          count: {
            replyLikes: number | null;
          };
        }[]
      | undefined;
  }[];
};

const getImageMimeType = (base64: string) => {
  if (base64.startsWith("iVBORw0KGgo")) {
    return "image/png";
  }

  if (base64.startsWith("UklGR")) {
    return "image/webp";
  }

  if (base64.startsWith("R0lGOD")) {
    return "image/gif";
  }

  return "image/jpeg";
};

const base64ToBlob = (imageData: string) => {
  /*
    data:image/png;base64,... 또는 순수 Base64 모두 허용합니다.
  */
  const dataUrlMatch = imageData.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );

  const base64 = dataUrlMatch ? dataUrlMatch[2] : imageData;
  const mimeType = dataUrlMatch ? dataUrlMatch[1] : getImageMimeType(base64);

  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], {
    type: mimeType,
  });
};

const normalizeSize = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return fallback;
  }

  if (trimmedValue.endsWith("%") || trimmedValue.endsWith("px")) {
    return trimmedValue;
  }

  return `${trimmedValue}px`;
};

const convertPostContextToHtml = (
  context: string | null,
  imageUrls: string[],
) => {
  const documentNode = new DOMParser().parseFromString(
    context || "<p></p>",
    "text/html",
  );

  const imageElements = documentNode.querySelectorAll<HTMLImageElement>("img");

  imageElements.forEach((imageElement) => {
    const source = imageElement.getAttribute("src") || "";

    /*
      context 저장 형식:
      <img src="image://0" />
      <img src="image://1" />
    */
    const imageReference = source.match(/^image:\/\/(\d+)$/);

    /*
      외부 URL 또는 이미 URL로 변경된 이미지는 그대로 둡니다.
    */
    if (!imageReference) {
      return;
    }

    const imageIndex = Number(imageReference[1]);

    /*
      image://0 -> imageUrls[0]
      image://1 -> imageUrls[1]
    */
    const imageUrl = imageUrls[imageIndex];

    if (!imageUrl) {
      imageElement.remove();
      return;
    }

    imageElement.setAttribute("src", imageUrl);

    /*
      게시글 생성 시 저장한 크기 복원
      data-width="130px"
      width="130"
      style="width: 130px"
      모두 처리합니다.
    */
    const savedWidth =
      imageElement.getAttribute("data-width") ||
      imageElement.getAttribute("width") ||
      imageElement.style.width;

    if (savedWidth) {
      imageElement.style.width = normalizeSize(savedWidth, "auto");
      imageElement.style.maxWidth = "100%";
    }

    const savedHeight =
      imageElement.getAttribute("data-height") ||
      imageElement.getAttribute("height") ||
      imageElement.style.height;

    if (savedHeight) {
      imageElement.style.height = normalizeSize(savedHeight, "auto");
    } else {
      imageElement.style.height = "auto";
    }

    imageElement.style.objectFit = "contain";
  });

  return documentNode.body.innerHTML;
};

export function PostOne() {
  const navigate = useNavigate();
  const isSession = getWithExpiry("ack");

  const [post, setPost] = useState<TPost>();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { pathname } = useLocation();
  const postId = pathname.split("/posts")[1].slice(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [context, setContext] = useState<string>("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(
    null,
  );
  const [replyContent, setReplyContent] = useState<string>("");

  /*
    image://0 -> imageUrls[0]
    image://1 -> imageUrls[1]
    순서대로 교체된 최종 HTML
  */
  const renderedPostContext = useMemo(() => {
    return convertPostContextToHtml(post?.context ?? null, imageUrls);
  }, [post?.context, imageUrls]);

  const handleStartEdit = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
    setReplyingCommentId(null);
    setReplyContent("");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleStartReply = (commentId: string) => {
    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    setReplyingCommentId(commentId);
    setReplyContent("");
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleCancelReply = () => {
    setReplyingCommentId(null);
    setReplyContent("");
  };

  const likePost = async () => {
    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    await fetch(`/api/posts/${encodeURIComponent(postId)}/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
    })
      .then(async (res) => {
        if (res.status > 201 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then((res) => {
        if (res?.ok) {
          window.location.reload();
          return res;
        }
      });
  };

  const deletePost = async () => {
    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    const message = confirm("게시글을 삭제하시겠습니까?");

    if (!message) {
      return;
    }

    await fetch(`/api/posts/${encodeURIComponent(postId)}/remove`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
    })
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
      .then((res) => {
        if (res?.ok) {
          setIsLoading(false);
          alert("게시글이 삭제 완료 되었습니다.");
          navigate("/posts");
          return res;
        }
      });
  };

  const handlerCreateComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    if (!context.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
      body: JSON.stringify({
        context: context.trim(),
      }),
    })
      .then(async (res) => {
        if (res.status > 201 && res.status < 500) {
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
      .then((res) => {
        if (res?.ok) {
          setIsLoading(false);
          window.location.reload();
          return res;
        }
      });
  };

  const handleCreateReply = async (
    parentId: string,
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    if (!replyContent.trim()) {
      alert("답글 내용을 입력해주세요.");
      return;
    }

    await fetch(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(parentId)}/replies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${isSession}`,
        },
        body: JSON.stringify({
          context: replyContent.trim(),
        }),
      },
    )
      .then(async (res) => {
        if (res.status > 201 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then((res) => {
        if (res?.ok) {
          alert("답글이 등록되었습니다.");
          window.location.reload();
          return res;
        }
      });
  };

  const handlerUpdateComment = async ({
    postId,
    commentId,
    type,
    parentId,
  }: {
    postId: string;
    commentId: string;
    type: string | null;
    parentId: string | null;
  }) => {
    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    if (!editContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    const requestUrl =
      type === "COMMENT" && parentId === null
        ? `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
            commentId,
          )}/update`
        : `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
            parentId as string,
          )}/replies/${encodeURIComponent(commentId)}/update`;

    await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
      body: JSON.stringify({
        context: editContent.trim(),
      }),
    })
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
      .then((res) => {
        if (res?.ok) {
          setIsLoading(false);
          alert(
            type === "COMMENT" && parentId === null
              ? "댓글 수정이 완료 되었습니다."
              : "답글 수정이 완료 되었습니다.",
          );
          window.location.reload();
          return res;
        }
      });
  };

  const handlerDeleteComment = async (
    {
      postId,
      commentId,
      type,
      parentId,
    }: {
      postId: string;
      commentId: string;
      type: string | null;
      parentId: string | null;
    },
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    const message = confirm("댓글을 삭제하시겠습니까?");

    if (!message) {
      return;
    }

    const requestUrl =
      type === "COMMENT" && parentId === null
        ? `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
            commentId,
          )}/remove`
        : `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
            parentId as string,
          )}/replies/${encodeURIComponent(commentId)}/remove`;

    await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
    })
      .then(async (res) => {
        if (res.status > 200 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then((res) => {
        if (res?.ok) {
          alert("댓글 삭제가 완료 되었습니다.");
          window.location.reload();
          return res;
        }
      });
  };

  const handlerCommentLike = async (
    {
      postId,
      commentId,
      replyId,
    }: {
      postId: string;
      commentId: string;
      replyId: string | null;
    },
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    const url =
      commentId && !replyId
        ? `/api/posts/${postId}/comments/${commentId}/likes`
        : `/api/posts/${postId}/comments/${commentId}/replies/${replyId}/likes`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
    })
      .then(async (res) => {
        if (res.status > 201 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then(async (res) => {
        if (res?.ok) {
          window.location.reload();
          return res;
        }
      });
  };

  useEffect(() => {
    const requestPost = async () => {
      await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${isSession}`,
        },
        credentials: "include",
      })
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
            navigate(-1);
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

            setPost(response.data);
            setIsLoading(false);

            return res;
          }
        });
    };

    requestPost();
  }, [pathname, postId, isSession, navigate]);

  /*
    게시글 상세 요청이 완료된 뒤:
    post.image[0] -> Blob URL imageUrls[0]
    post.image[1] -> Blob URL imageUrls[1]
  */
  useEffect(() => {
    if (!post?.images) {
      setImageUrls([]);
      return;
    }

    const createdUrls = post.images.map((base64) => {
      if (!base64) {
        return "";
      }

      try {
        const blob = base64ToBlob(base64);

        return URL.createObjectURL(blob);
      } catch (error) {
        console.error("게시글 이미지 Blob 변환 실패:", error);

        /*
          실패해도 빈 값을 넣어 image://N의 index가 밀리지 않게 합니다.
        */
        return "";
      }
    });

    setImageUrls(createdUrls);

    return () => {
      createdUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [post?.images]);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <main className="post-one-page">
          <section className="post-one-shell">
            <article className="post-one-main">
              <header className="post-one-hero">
                <div className="post-one-meta-top">
                  <span
                    className={`post-one-category ${post?.category.key.toLowerCase()}`}
                  >
                    {post?.category.name}
                  </span>

                  <span className="post-one-visibility">
                    {post?.isPublic ? "공개 글" : "비공개 글"}
                  </span>
                </div>

                <h1>{post?.title}</h1>

                <div className="post-one-meta-bottom">
                  <div className="post-one-author">
                    <div className="post-one-author-avatar">
                      {post?.users.image ? (
                        <img
                          src={imageDecodeToUrl(post.users.image) as string}
                          alt={`${post.users.nickname} 프로필`}
                        />
                      ) : (
                        <span className="post-one-avatar-span">
                          {post?.users.nickname.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <strong>{post?.users.nickname}</strong>
                      <span>{post?.createdAt}</span>
                    </div>
                  </div>

                  {isSession && post?.users.property && (
                    <div className="post-one-actions">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/posts/update/${encodeURIComponent(postId)}`,
                          )
                        }
                      >
                        수정
                      </button>

                      <button type="button" onClick={deletePost}>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <section className="post-one-content">
                <div
                  className="post-one-rich-content"
                  dangerouslySetInnerHTML={{
                    __html: renderedPostContext,
                  }}
                />
              </section>

              <section className="post-one-engagement">
                <button
                  type="button"
                  className="post-one-like-btn"
                  onClick={likePost}
                >
                  좋아요 {post?.count.likes}
                </button>

                <button
                  type="button"
                  className="post-one-list-btn"
                  onClick={() => navigate("/posts")}
                >
                  목록으로
                </button>
              </section>

              <section className="post-one-comments">
                <div className="post-one-comments-head">
                  <h2>댓글 {post?.count.commentCount}</h2>

                  <p>이 게시글에 대한 생각을 자유롭게 남겨보세요.</p>
                </div>

                <form
                  className="post-one-comment-form"
                  aria-labelledby="comment-form-title"
                  onSubmit={handlerCreateComment}
                >
                  <h3 id="comment-form-title" className="sr-only">
                    댓글 작성
                  </h3>

                  <label htmlFor="comment" className="post-one-comment-label">
                    댓글 내용
                  </label>

                  <textarea
                    id="comment"
                    name="comment"
                    rows={5}
                    value={context}
                    placeholder="댓글을 입력해주세요."
                    onChange={(e) => setContext(e.target.value)}
                  />

                  <div className="post-one-comment-actions">
                    <button type="submit" className="post-one-comment-submit">
                      댓글 등록
                    </button>
                  </div>
                </form>

                <div className="post-one-comment-list">
                  {post?.comments.map((comment) => {
                    const isEditing = editingCommentId === comment.id;
                    const isReplying = replyingCommentId === comment.id;

                    return (
                      <article
                        className="post-one-comment-thread"
                        key={comment.id}
                      >
                        <div className="post-one-comment-item">
                          {comment.author?.nickname ? (
                            <div className="post-one-comment-avatar">
                              {comment.author.image ? (
                                <img
                                  src={
                                    imageDecodeToUrl(
                                      comment.author.image,
                                    ) as string
                                  }
                                  alt={`${comment.author.nickname} 프로필`}
                                />
                              ) : (
                                <span>
                                  {comment.author.nickname
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                          ) : null}

                          <div className="post-one-comment-body">
                            <div className="post-one-comment-meta">
                              <div className="post-one-comment-meta-left">
                                <strong>{comment.author?.nickname}</strong>
                                <span>{comment.createdAt}</span>
                              </div>

                              <div className="post-one-comment-actions">
                                {!isEditing &&
                                  comment.deletedAt === "FALSE" &&
                                  comment.id && (
                                    <button
                                      type="button"
                                      className="post-one-comment-action like"
                                      onClick={(e) =>
                                        handlerCommentLike(
                                          {
                                            postId: post.id,
                                            commentId: comment.id as string,
                                          } as {
                                            postId: string;
                                            commentId: string;
                                            replyId: null;
                                          },
                                          e,
                                        )
                                      }
                                    >
                                      좋아요 {comment.count.likes}
                                    </button>
                                  )}

                                {!isEditing &&
                                  isSession &&
                                  comment.deletedAt === "FALSE" && (
                                    <button
                                      type="button"
                                      className="post-one-comment-action reply"
                                      onClick={() =>
                                        handleStartReply(comment.id as string)
                                      }
                                    >
                                      답글
                                    </button>
                                  )}

                                {!isEditing &&
                                  comment.deletedAt === "FALSE" &&
                                  comment.author?.property && (
                                    <>
                                      <button
                                        type="button"
                                        className="post-one-comment-action edit"
                                        onClick={() =>
                                          handleStartEdit(
                                            comment.id as string,
                                            comment.context ?? "",
                                          )
                                        }
                                      >
                                        수정
                                      </button>

                                      <button
                                        type="button"
                                        className="post-one-comment-action delete"
                                        onClick={(e) =>
                                          handlerDeleteComment(
                                            {
                                              postId,
                                              commentId: comment.id as string,
                                              type: comment.type ?? null,
                                              parentId:
                                                comment.parentId ?? null,
                                            },
                                            e,
                                          )
                                        }
                                      >
                                        삭제
                                      </button>
                                    </>
                                  )}
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="comment-edit-box">
                                <textarea
                                  className="comment-edit-textarea"
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
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
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                    >
                                      취소
                                    </button>

                                    <button
                                      type="button"
                                      className="comment-action-btn primary"
                                      onClick={() =>
                                        handlerUpdateComment({
                                          postId,
                                          commentId: comment.id as string,
                                          type: comment.type ?? null,
                                          parentId: comment.parentId ?? null,
                                        })
                                      }
                                      disabled={isSaving || !editContent.trim()}
                                    >
                                      {isSaving ? "저장 중..." : "저장"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="comment-context">
                                {comment.context}
                              </p>
                            )}

                            {isReplying && (
                              <form
                                className="post-one-reply-form"
                                onSubmit={(e) =>
                                  handleCreateReply(comment.id as string, e)
                                }
                              >
                                <textarea
                                  id={`reply-${comment.id}`}
                                  className="post-one-reply-textarea"
                                  rows={3}
                                  placeholder="이 댓글에 답글을 입력해주세요."
                                  value={replyContent}
                                  onChange={(e) =>
                                    setReplyContent(e.target.value)
                                  }
                                />

                                <div className="post-one-reply-form-actions">
                                  <button
                                    type="button"
                                    className="comment-action-btn ghost"
                                    onClick={handleCancelReply}
                                  >
                                    취소
                                  </button>

                                  <button
                                    type="submit"
                                    className="comment-action-btn primary"
                                    disabled={!replyContent.trim()}
                                  >
                                    답글 등록
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>

                        {comment.replies?.length ? (
                          <div className="post-one-reply-list">
                            {comment.replies.map((reply) => {
                              const isReplyEditing =
                                editingCommentId === reply.id;

                              return (
                                <article
                                  className="post-one-reply-item"
                                  key={reply.id}
                                >
                                  <div className="post-one-reply-avatar">
                                    {reply.author.image ? (
                                      <img
                                        src={
                                          imageDecodeToUrl(
                                            reply.author.image,
                                          ) as string
                                        }
                                        alt={`${reply.author.nickname} 프로필`}
                                      />
                                    ) : (
                                      <span>
                                        {reply.author.nickname
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="post-one-reply-body">
                                    <div className="post-one-reply-meta">
                                      <div className="post-one-comment-meta-left">
                                        <strong>{reply.author.nickname}</strong>
                                        <span>{reply.createdAt}</span>
                                      </div>
                                      <div className="post-one-comment-actions">
                                        {!isReplyEditing &&
                                          reply.deletedAt === "FALSE" && (
                                            <button
                                              type="button"
                                              className="post-one-comment-action like"
                                              onClick={(e) =>
                                                handlerCommentLike(
                                                  {
                                                    postId: post.id,
                                                    commentId:
                                                      comment.id as string,
                                                    replyId: reply.id,
                                                  } as {
                                                    postId: string;
                                                    commentId: string;
                                                    replyId: string;
                                                  },
                                                  e,
                                                )
                                              }
                                            >
                                              좋아요 {reply.count.replyLikes}
                                            </button>
                                          )}

                                        {!isReplyEditing &&
                                          isSession &&
                                          reply.author.property &&
                                          reply.deletedAt === "FALSE" && (
                                            <button
                                              type="button"
                                              className="post-one-comment-action edit"
                                              onClick={() =>
                                                handleStartEdit(
                                                  reply.id as string,
                                                  reply.context ?? "",
                                                )
                                              }
                                            >
                                              수정
                                            </button>
                                          )}

                                        {!isReplyEditing &&
                                          isSession &&
                                          reply.author.property &&
                                          reply.deletedAt === "FALSE" && (
                                            <button
                                              type="button"
                                              className="post-one-comment-action delete"
                                              onClick={(e) =>
                                                handlerDeleteComment(
                                                  {
                                                    postId,
                                                    commentId:
                                                      reply.id as string,
                                                    type: reply.type,
                                                    parentId: reply.parentId,
                                                  },
                                                  e,
                                                )
                                              }
                                            >
                                              삭제
                                            </button>
                                          )}
                                      </div>
                                    </div>

                                    {isReplyEditing ? (
                                      <div className="comment-edit-box">
                                        <textarea
                                          className="comment-edit-textarea"
                                          value={editContent}
                                          onChange={(e) =>
                                            setEditContent(e.target.value)
                                          }
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
                                              onClick={handleCancelEdit}
                                              disabled={isSaving}
                                            >
                                              취소
                                            </button>

                                            <button
                                              type="button"
                                              className="comment-action-btn primary"
                                              onClick={() =>
                                                handlerUpdateComment({
                                                  postId,
                                                  commentId: reply.id as string,
                                                  type: reply.type,
                                                  parentId: reply.parentId,
                                                })
                                              }
                                              disabled={
                                                isSaving || !editContent.trim()
                                              }
                                            >
                                              {isSaving ? "저장 중..." : "저장"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="comment-context">
                                        {reply.context}
                                      </p>
                                    )}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : undefined}
                      </article>
                    );
                  })}
                </div>
              </section>
            </article>

            <aside className="post-one-side">
              <section className="post-one-side-card">
                <span className="post-one-side-badge">AUTHOR</span>

                <div className="post-one-side-author">
                  <div className="post-one-side-avatar">
                    {post?.users.image ? (
                      <img
                        src={imageDecodeToUrl(post.users.image) as string}
                        alt={`${post.users.nickname} 프로필`}
                      />
                    ) : (
                      <span>
                        {post?.users.nickname.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <strong>{post?.users.nickname}</strong>
                  </div>
                </div>
              </section>

              <section className="post-one-side-card">
                <span className="post-one-side-badge">POST INFO</span>

                <ul className="post-one-info-list">
                  <li>
                    <strong>카테고리</strong>
                    <span>{post?.category.name}</span>
                  </li>

                  <li>
                    <strong>작성일</strong>
                    <span>{post?.createdAt}</span>
                  </li>

                  <li>
                    <strong>공개 여부</strong>
                    <span>{post?.isPublic ? "공개" : "비공개"}</span>
                  </li>
                </ul>
              </section>

              <section className="post-one-side-card">
                <span className="post-one-side-badge">GUIDE</span>

                <p className="post-one-guide-text">
                  댓글은 예의를 지켜 작성하고, 주제와 관계없는 내용은
                  피해주세요.
                </p>
              </section>
            </aside>
          </section>
        </main>
      )}
    </>
  );
}
