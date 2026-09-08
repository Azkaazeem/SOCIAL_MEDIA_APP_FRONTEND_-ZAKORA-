import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { format } from "timeago.js";
import { Link, useNavigate } from "react-router-dom";
import { 
  Favorite, 
  FavoriteBorder, 
  Chat, 
  Delete, 
  Reply,
  Send
} from "@mui/icons-material";
import { AuthContext } from "../../context/AuthContext";
import Swal from "sweetalert2";
import "./comments.css";

const Comments = ({ postId, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
  const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";

  const defaultAvatar = "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg";

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/comments/post/" + postId);
      setComments(res.data);
      if (onCommentCountChange) {
        onCommentCountChange(res.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const promptLogin = (actionText = "comment") => {
    Swal.fire({
      title: "Login Required",
      text: `Please sign in to ${actionText} on this post!`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Sign In",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/login");
      }
    });
  };

  // Submit top-level main comment
  const handleMainCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      promptLogin("post a comment");
      return;
    }
    if (!newCommentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const res = await axios.post("/comments", {
        postId,
        userId: currentUser._id,
        username: currentUser.username,
        userProfilePicture: currentUser.profilePicture || "",
        text: newCommentText.trim(),
        parentId: null,
      });

      const updated = [...comments, res.data];
      setComments(updated);
      setNewCommentText("");
      if (onCommentCountChange) {
        onCommentCountChange(updated.length);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply to a comment
  const handleReplySubmit = async (parentCommentId) => {
    if (!currentUser) {
      promptLogin("reply to this comment");
      return;
    }
    if (!replyText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const res = await axios.post("/comments", {
        postId,
        userId: currentUser._id,
        username: currentUser.username,
        userProfilePicture: currentUser.profilePicture || "",
        text: replyText.trim(),
        parentId: parentCommentId,
      });

      const updated = [...comments, res.data];
      setComments(updated);
      setReplyText("");
      setReplyingToId(null);
      // Auto-expand replies for this comment so the user sees their reply
      setExpandedComments((prev) => ({ ...prev, [parentCommentId]: true }));
      if (onCommentCountChange) {
        onCommentCountChange(updated.length);
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Like / Unlike comment
  const handleLike = async (commentId) => {
    if (!currentUser) {
      promptLogin("like this comment");
      return;
    }

    try {
      await axios.put(`/comments/${commentId}/like`, { userId: currentUser._id });
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            const hasLiked = c.likes.includes(currentUser._id);
            const newLikes = hasLiked
              ? c.likes.filter((id) => id !== currentUser._id)
              : [...c.likes, currentUser._id];
            return { ...c, likes: newLikes };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Failed to toggle comment like:", err);
    }
  };

  // Delete comment
  const handleDelete = (commentId) => {
    if (!currentUser) return;

    Swal.fire({
      title: "Delete comment?",
      text: "Are you sure you want to remove this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/comments/${commentId}`, {
            data: { userId: currentUser._id },
          });
          const updated = comments.filter(
            (c) => c._id !== commentId && c.parentId !== commentId
          );
          setComments(updated);
          if (onCommentCountChange) {
            onCommentCountChange(updated.length);
          }
        } catch (err) {
          console.error("Failed to delete comment:", err);
        }
      }
    });
  };

  // Toggle collapse state for a main comment's replies
  const toggleReplies = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Separate main comments and replies
  const mainComments = comments.filter((c) => !c.parentId);
  const repliesByParent = {};
  comments.forEach((c) => {
    if (c.parentId) {
      if (!repliesByParent[c.parentId]) {
        repliesByParent[c.parentId] = [];
      }
      repliesByParent[c.parentId].push(c);
    }
  });

  return (
    <div className="commentsSection">
      {/* New Main Comment Input Form */}
      <form className="commentInputWrapper" onSubmit={handleMainCommentSubmit}>
        <img
          src={
            currentUser?.profilePicture
              ? resolvePath(currentUser.profilePicture)
              : defaultAvatar
          }
          alt=""
          className="commentUserAvatar"
        />
        <div className="commentInputBox">
          <input
            type="text"
            placeholder={
              currentUser
                ? "Write a comment..."
                : "Sign in to join the conversation..."
            }
            className="commentInputField"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onClick={() => {
              if (!currentUser) promptLogin("comment");
            }}
          />
          <button
            type="submit"
            className="commentSubmitBtn"
            disabled={!newCommentText.trim() || submitting}
          >
            <Send style={{ fontSize: "16px" }} />
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && comments.length === 0 && (
        <div className="commentsLoading">Loading comments...</div>
      )}

      {/* Empty comments */}
      {!loading && mainComments.length === 0 && (
        <div className="noCommentsText">No comments yet. Be the first to comment!</div>
      )}

      {/* Main Comments List */}
      <div className="commentsList">
        {mainComments.map((comment) => {
          const isLiked = Boolean(
            currentUser && comment.likes?.includes(currentUser._id)
          );
          const commentReplies = repliesByParent[comment._id] || [];
          const areRepliesExpanded = Boolean(expandedComments[comment._id]);
          const isOwner = Boolean(
            currentUser && comment.userId === currentUser._id
          );

          return (
            <div key={comment._id} className="commentItem">
              {/* Comment Row */}
              <div className="commentMainRow">
                <Link to={`/profile/${comment.username}`}>
                  <img
                    src={
                      comment.userProfilePicture
                        ? resolvePath(comment.userProfilePicture)
                        : defaultAvatar
                    }
                    alt=""
                    className="commentAvatar"
                  />
                </Link>

                <div className="commentContentBox">
                  <div className="commentHeader">
                    <Link
                      to={`/profile/${comment.username}`}
                      className="commentAuthor"
                    >
                      {comment.username}
                    </Link>
                    <span className="commentTime">
                      {format(comment.createdAt)}
                    </span>
                  </div>

                  <div className="commentText">{comment.text}</div>

                  {/* Actions & Side Counters */}
                  <div className="commentActionsBar">
                    {/* Likes Action & Counter */}
                    <button
                      type="button"
                      className={`commentActionBtn ${isLiked ? "liked" : ""}`}
                      onClick={() => handleLike(comment._id)}
                      title="Like comment"
                    >
                      {isLiked ? (
                        <Favorite style={{ fontSize: "15px", color: "#ef4444" }} />
                      ) : (
                        <FavoriteBorder style={{ fontSize: "15px" }} />
                      )}
                      <span className="commentCounter">
                        {comment.likes?.length || 0}{" "}
                        {comment.likes?.length === 1 ? "like" : "likes"}
                      </span>
                    </button>

                    <span className="commentActionDot">•</span>

                    {/* Reply Action & Counter */}
                    <button
                      type="button"
                      className="commentActionBtn"
                      onClick={() => {
                        if (!currentUser) {
                          promptLogin("reply");
                          return;
                        }
                        setReplyingToId(
                          replyingToId === comment._id ? null : comment._id
                        );
                        setReplyText("");
                      }}
                      title="Reply to comment"
                    >
                      <Chat style={{ fontSize: "15px" }} />
                      <span className="commentCounter">
                        {commentReplies.length}{" "}
                        {commentReplies.length === 1 ? "reply" : "replies"}
                      </span>
                    </button>

                    {isOwner && (
                      <>
                        <span className="commentActionDot">•</span>
                        <button
                          type="button"
                          className="commentActionBtn deleteBtn"
                          onClick={() => handleDelete(comment._id)}
                          title="Delete comment"
                        >
                          <Delete style={{ fontSize: "15px" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline Reply Box for this Comment */}
              {replyingToId === comment._id && (
                <div className="inlineReplyWrapper">
                  <img
                    src={
                      currentUser?.profilePicture
                        ? resolvePath(currentUser.profilePicture)
                        : defaultAvatar
                    }
                    alt=""
                    className="replyUserAvatar"
                  />
                  <div className="inlineReplyBox">
                    <input
                      type="text"
                      placeholder={`Reply to @${comment.username}...`}
                      className="inlineReplyField"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                    />
                    <div className="inlineReplyButtons">
                      <button
                        type="button"
                        className="inlineReplyCancelBtn"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="inlineReplySubmitBtn"
                        disabled={!replyText.trim() || submitting}
                        onClick={() => handleReplySubmit(comment._id)}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Collapsible Replies Section (Collapsed by default!) */}
              {commentReplies.length > 0 && (
                <div className="commentRepliesSection">
                  {/* Toggle Button to Expand / Collapse */}
                  <button
                    type="button"
                    className="repliesToggleBtn"
                    onClick={() => toggleReplies(comment._id)}
                  >
                    <Reply style={{ fontSize: "15px", transform: "scaleX(-1)" }} />
                    <span>
                      {areRepliesExpanded
                        ? "Hide replies"
                        : `View ${commentReplies.length} ${
                            commentReplies.length === 1 ? "reply" : "replies"
                          }`}
                    </span>
                  </button>

                  {/* Expanded Replies List */}
                  {areRepliesExpanded && (
                    <div className="repliesList">
                      {commentReplies.map((reply) => {
                        const isReplyLiked = Boolean(
                          currentUser && reply.likes?.includes(currentUser._id)
                        );
                        const isReplyOwner = Boolean(
                          currentUser && reply.userId === currentUser._id
                        );

                        return (
                          <div key={reply._id} className="replyItem">
                            <Link to={`/profile/${reply.username}`}>
                              <img
                                src={
                                  reply.userProfilePicture
                                    ? resolvePath(reply.userProfilePicture)
                                    : defaultAvatar
                                }
                                alt=""
                                className="replyAvatar"
                              />
                            </Link>

                            <div className="replyContentBox">
                              <div className="commentHeader">
                                <Link
                                  to={`/profile/${reply.username}`}
                                  className="commentAuthor"
                                >
                                  {reply.username}
                                </Link>
                                <span className="commentTime">
                                  {format(reply.createdAt)}
                                </span>
                              </div>

                              <div className="commentText">{reply.text}</div>

                              {/* Reply Actions & Like Counter */}
                              <div className="commentActionsBar">
                                <button
                                  type="button"
                                  className={`commentActionBtn ${
                                    isReplyLiked ? "liked" : ""
                                  }`}
                                  onClick={() => handleLike(reply._id)}
                                  title="Like reply"
                                >
                                  {isReplyLiked ? (
                                    <Favorite
                                      style={{
                                        fontSize: "13px",
                                        color: "#ef4444",
                                      }}
                                    />
                                  ) : (
                                    <FavoriteBorder
                                      style={{ fontSize: "13px" }}
                                    />
                                  )}
                                  <span className="commentCounter">
                                    {reply.likes?.length || 0}{" "}
                                    {reply.likes?.length === 1
                                      ? "like"
                                      : "likes"}
                                  </span>
                                </button>

                                {isReplyOwner && (
                                  <>
                                    <span className="commentActionDot">•</span>
                                    <button
                                      type="button"
                                      className="commentActionBtn deleteBtn"
                                      onClick={() => handleDelete(reply._id)}
                                      title="Delete reply"
                                    >
                                      <Delete
                                        style={{ fontSize: "13px" }}
                                      />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Comments;
