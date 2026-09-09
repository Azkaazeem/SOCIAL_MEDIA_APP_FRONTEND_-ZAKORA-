import { useState , useEffect, useContext } from 'react';
import './post.css'
import { MoreVert, Favorite, FavoriteBorder, Chat, Close } from '@mui/icons-material';
import axios from "axios";
import { format } from "timeago.js";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import Swal from 'sweetalert2';
import AutoPlayVideo from '../videoPlayer/AutoPlayVideo';
import FormattedContent from '../formattedContent/FormattedContent';
import Comments from '../comments/Comments';

const Post = ({ post }) => {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
  const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : null;
  const { user: currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLiked(Boolean(currentUser?._id && post.likes?.includes(currentUser._id)));
  }, [currentUser?._id, post.likes]);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      if (!post?.userId) return;
      try {
        const res = await axios.get(`/users?userId=${post.userId}`);
        if (isMounted && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        // Suppress unhandled errors if post author is deleted or not found
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [post.userId]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const res = await axios.get(`/comments/post/${post._id}`);
        setCommentCount(res.data.length);
      } catch (err) {
        console.error(err);
      }
    };
    if (post._id) {
      fetchCommentCount();
    }
  }, [post._id]);

  const likeHandler = async () => {
    if (!currentUser) {
      Swal.fire({
        title: "Login Required",
        text: "Please sign in to like this post and join the conversation!",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Sign In",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#4f46e5"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    try {
      await axios.put("/posts/" + post._id + "/like", { userId: currentUser._id });
      
    } catch (err) {
      console.error(err);
    }
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  const handleDelete = () => {
    Swal.fire({
      title: 'Delete Post?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/posts/${post._id}`, { data: { userId: currentUser._id } });
          window.dispatchEvent(new CustomEvent('postCreated')); // reuse this event to trigger feed refresh
          Swal.fire('Deleted!', 'Your post has been deleted.', 'success');
        } catch(err) {
          console.log(err);
          Swal.fire('Error!', 'Something went wrong.', 'error');
        }
      }
    });
  }

  const handleOpenLikes = async () => {
    setShowLikesModal(true);
    setLoadingLikes(true);
    try {
      const res = await axios.get(`/posts/${post._id}/likes`);
      setLikedUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load likes:", err);
      setLikedUsers([]);
    } finally {
      setLoadingLikes(false);
    }
  };
  
  return (
    <div className='post'>
      <div className="postWrapper">
        <div className="postTop">
          <div className="postTopLeft">
            <Link to={`/profile/${user.username}`}>
            <img src={user.profilePicture ? resolvePath(user.profilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"} alt="" className="postProfileImg" />
            </Link>
            <div className="postUsername">{user.username}</div>
            <div className="postDate">{format(post.createdAt)}</div>
          </div>
          <div className="postTopRight" style={{position: "relative"}}>
            {Boolean(currentUser && post.userId === currentUser._id) && (
              <>
                <MoreVert style={{cursor: "pointer"}} onClick={() => setMenuOpen(!menuOpen)} />
                {menuOpen && (
                  <div className="postDropdown">
                    <span onClick={handleDelete} className="postDropdownItem">Delete</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="postCenter">
          <div className="postText">
            <FormattedContent content={post?.desc} />
          </div>
          
          {post.img && typeof post.img === "string" && (
            <img src={resolvePath(post.img)} alt="" className="postImg" />
          )}
          
          {post.img && Array.isArray(post.img) && post.img.length > 0 && (
            <div className="postImagesContainer" style={{ position: "relative", marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: "12px", overflow: "hidden" }}>
              <img src={resolvePath(post.img[currentImgIndex])} alt="" className="postImg" style={{ margin: 0, maxHeight: "500px", width: "100%", objectFit: "contain" }} />
              
              {post.img.length > 1 && (
                <>
                  <div onClick={() => setCurrentImgIndex((prev) => (prev - 1 + post.img.length) % post.img.length)} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "white", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>
                    &#10094;
                  </div>
                  <div onClick={() => setCurrentImgIndex((prev) => (prev + 1) % post.img.length)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "white", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>
                    &#10095;
                  </div>
                  <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>
                    {currentImgIndex + 1} / {post.img.length}
                  </div>
                </>
              )}
            </div>
          )}

          {post.video && Array.isArray(post.video) && post.video.length > 0 && (
            <div className="postVideosContainer" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {post.video.map((videoName, i) => (
                <AutoPlayVideo key={i} src={resolvePath(videoName)} />
              ))}
            </div>
          )}
        </div>

        <div className="postBottom">
          <div className="postBottomLeft">
            {isLiked ? (
              <Favorite htmlColor="red" onClick={likeHandler} className="likeIcon" style={{ cursor: "pointer", fontSize: "24px", marginRight: "5px" }} />
            ) : (
              <FavoriteBorder htmlColor="red" onClick={likeHandler} className="likeIcon" style={{ cursor: "pointer", fontSize: "24px", marginRight: "5px" }} />
            )}
            <span 
              className='postLikeCounter' 
              onClick={handleOpenLikes}
              title="Click to view who liked this post"
            >
              {like} {like === 1 ? "person likes it" : "people like it"}
            </span>
          </div>

          <div 
            className="postBottomRight"
            onClick={() => setShowComments(!showComments)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            title={showComments ? "Hide comments" : "Show comments"}
          >
            <Chat style={{ fontSize: "18px", color: "#6b7280" }} />
            <span className="postCommentText">
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>

        {/* Comments Thread Section */}
        {showComments && (
          <Comments
            postId={post._id}
            onCommentCountChange={(newCount) => setCommentCount(newCount)}
          />
        )}

        {/* Likes Modal Popup */}
        {showLikesModal && (
          <div className="likesModalOverlay" onClick={() => setShowLikesModal(false)}>
            <div className="likesModal" onClick={(e) => e.stopPropagation()}>
              <div className="likesModalHeader">
                <div className="likesModalHeaderTitle">
                  <Favorite style={{ color: "#ef4444", fontSize: "20px" }} />
                  <span>Liked by ({like})</span>
                </div>
                <button
                  type="button"
                  className="likesModalCloseBtn"
                  onClick={() => setShowLikesModal(false)}
                  title="Close"
                  aria-label="Close"
                >
                  <Close style={{ fontSize: "18px" }} />
                </button>
              </div>

              <div className="likesModalBody">
                {loadingLikes ? (
                  <div className="likesModalLoading">Loading likes...</div>
                ) : likedUsers.length === 0 ? (
                  <div className="likesModalEmpty">
                    {like > 0
                      ? "Liked by users on ZakoraSocial"
                      : "No likes yet. Be the first to like this post!"}
                  </div>
                ) : (
                  <div className="likesModalList">
                    {likedUsers.map((u) => (
                      <div
                        key={u._id}
                        className="likesModalUserItem"
                        onClick={() => {
                          setShowLikesModal(false);
                          navigate(`/profile/${u.username}`);
                        }}
                      >
                        <img
                          src={u.profilePicture ? resolvePath(u.profilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"}
                          alt={u.username}
                          className="likesModalUserImg"
                          onError={(e) => {
                            e.target.src = "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg";
                          }}
                        />
                        <div className="likesModalUserInfo">
                          <span className="likesModalUsername">{u.username}</span>
                          {u.desc && <span className="likesModalDesc">{u.desc}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Post;
