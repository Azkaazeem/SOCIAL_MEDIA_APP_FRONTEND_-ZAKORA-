import Share from "../share/Share";
import Post from "../post/Post";
import "./feed.css";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { format } from "timeago.js";
import { Link } from "react-router-dom";

const Feed = ({ username }) => {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);

  const fetchPosts = async () => {
    try {
      const validUsername = username && username !== "undefined" ? username.trim() : null;
      const res = validUsername
        ? await axios.get("/posts/profile/" + encodeURIComponent(validUsername))
        : await axios.get("/posts/all");
      
      const usersMap = {};
      try {
        const usersRes = await axios.get("/users/all");
        if (Array.isArray(usersRes?.data)) {
          usersRes.data.forEach(u => {
            if (u?._id) usersMap[u._id] = u.username;
          });
        }
      } catch (uErr) {
        // non-blocking
      }
      
      const rawPosts = Array.isArray(res?.data) ? res.data : [];
      const postsWithMetadata = rawPosts.map(p => ({
        ...p,
        username: usersMap[p.userId] || "",
        timeString: p.createdAt ? format(p.createdAt) : ""
      }));

      const now = new Date();
      const newLocalPosts = [];
      const otherPosts = [];
      
      postsWithMetadata.forEach(p => {
        const postTime = new Date(p.createdAt);
        // 5 minutes threshold to keep newly created posts at the top
        if (user && p.userId === user?._id && (now - postTime) < 300000) {
           newLocalPosts.push(p);
        } else {
           otherPosts.push(p);
        }
      });
      
      newLocalPosts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Shuffle older/other posts
      for (let i = otherPosts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherPosts[i], otherPosts[j]] = [otherPosts[j], otherPosts[i]];
      }

      setPosts([...newLocalPosts, ...otherPosts]);
    } catch (err) {
      console.warn("Could not fetch posts:", err?.message || err);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [username, user?._id]);

  useEffect(() => {
    window.addEventListener('postCreated', fetchPosts);
    return () => window.removeEventListener('postCreated', fetchPosts);
  }, [username, user?._id]);

  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const handleSearch = (e) => setSearchQuery(e.detail.toLowerCase());
    window.addEventListener('searchQueryChanged', handleSearch);
    return () => window.removeEventListener('searchQueryChanged', handleSearch);
  }, []);

  useEffect(() => {
    const handleFilter = (e) => setFilterType(e.detail);
    window.addEventListener('postFilterChanged', handleFilter);
    return () => window.removeEventListener('postFilterChanged', handleFilter);
  }, []);

  const displayedPosts = posts.filter(p => {
    // Media Type filter
    if (filterType === 'video') {
      if (!p.video || p.video.length === 0) return false;
    } else if (filterType === 'image') {
      if (!p.img || p.img.length === 0) return false;
    } else if (filterType === 'article') {
      // Must have desc, but no img and no video
      const hasImg = p.img && p.img.length > 0;
      const hasVideo = p.video && p.video.length > 0;
      if (!p.desc || hasImg || hasVideo) return false;
    }

    // Search query filter
    if (searchQuery === "") return true;
    const matchDesc = p.desc && p.desc.toLowerCase().includes(searchQuery);
    const matchUser = p.username && p.username.toLowerCase().includes(searchQuery);
    const matchTime = p.timeString && p.timeString.toLowerCase().includes(searchQuery);
    return matchDesc || matchUser || matchTime;
  });

  return (
    <div className="feed">
      <div className="feedWrapper">
        {/* Guest user welcome banner */}
        {!user && !username && (
          <div className="feedGuestBanner">
            <div className="feedGuestText">
              <h3 className="feedGuestTitle">
                Welcome to ZakoraSocial! 👋
              </h3>
              <p className="feedGuestDesc">
                You are browsing as a guest. Sign in to like posts, comment, and share your own stories.
              </p>
            </div>
            <div className="feedGuestButtons">
              <Link to="/login" className="feedGuestLoginBtn">
                Log In
              </Link>
              <Link to="/register" className="feedGuestRegisterBtn">
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated user Share post box */}
        {Boolean(user && (!username || username === user.username)) && <Share />}

        {displayedPosts.length > 0 ? (
          displayedPosts.map((p) => (
            <Post key={p._id} post={p} />
          ))
        ) : (
          <div style={{ textAlign: "center", marginTop: "20px", color: "#6b7280" }}>
            No posts found matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
