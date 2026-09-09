import "./rightbar.css";
import { Online } from "../online/Online";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import { Add, Remove, Edit } from "@mui/icons-material";
import Swal from "sweetalert2";

const Rightbar = ({ user }) => {
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [followed, setFollowed] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    city: "",
    from: "",
    relationship: 1
  });

  const [connections, setConnections] = useState({ followers: [], followings: [], mutuals: [] });

  useEffect(() => {
    if (user?._id && currentUser?.followings) {
      setFollowed(currentUser.followings.includes(user._id));
    } else {
      setFollowed(false);
    }
    setEditData({
      city: user?.city || "",
      from: user?.from || "",
      relationship: user?.relationship || 1
    });
  }, [currentUser, user]);

  // Fetch connections for ProfileRightbar
  useEffect(() => {
    const getConnections = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get("/users/connections/" + user._id);
        setConnections(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getConnections();
  }, [user]);

  // Fetch friends (followings) for HomeRightbar
  useEffect(() => {
    const getFriends = async () => {
      const targetUserId = currentUser?._id;
      if (!targetUserId) return;
      try {
        const friendList = await axios.get("/users/friends/" + targetUserId);
        setFriends(friendList.data);
      } catch (err) {
        console.log(err);
      }
    };
    getFriends();
  }, [currentUser]);

  const promptLogin = (actionText = "interact") => {
    Swal.fire({
      title: "Login Required",
      text: `Please sign in to ${actionText} on ZakoraSocial!`,
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
  };

  const handleClick = async () => {
    if (!currentUser) {
      promptLogin("follow users");
      return;
    }

    try {
      if (followed) {
        await axios.put("/users/" + user._id + "/unfollow", { userId: currentUser._id });
        dispatch({ type: "UNFOLLOW", payload: user._id });
      } else {
        await axios.put("/users/" + user._id + "/follow", { userId: currentUser._id });
        dispatch({ type: "FOLLOW", payload: user._id });
      }
      setFollowed(!followed);
    } catch (err) {
      console.log(err);
    }
  };

  const handleFollowBack = async (c) => {
    if (!currentUser) {
      promptLogin("follow users");
      return;
    }

    try {
      await axios.put("/users/" + c._id + "/follow", { userId: currentUser._id });
      dispatch({ type: "FOLLOW", payload: c._id });
      if (user?._id === currentUser._id) {
        setConnections(prev => ({
          ...prev,
          followings: [...prev.followings, c],
          mutuals: [...prev.mutuals, c]
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditSave = async () => {
    if (!currentUser) return;
    try {
      const updateData = { userId: currentUser._id, ...editData };
      await axios.put(`/users/${currentUser._id}`, updateData);
      dispatch({ type: "UPDATE_USER", payload: updateData });
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";

  const renderConnectionSection = (title, list) => {
    return (
      <div style={{ marginBottom: "20px" }}>
        <h4 className="rightbarTitle" style={{ marginBottom: "10px" }}>
          {title} <span style={{ color: "gray", fontSize: "14px" }}>({list.length})</span>
        </h4>
        <div className="rightbarFollowings">
          {list.map((c) => {
            const isFollower = title === "Followers";
            const iFollowThem = currentUser?.followings?.includes(c._id);
            const showFollowBack = isFollower && !iFollowThem && c._id !== currentUser?._id;

            return (
              <div key={c._id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Link style={{ textDecoration: "none", color: "inherit" }} to={"/profile/" + c.username}>
                  <div className="rightbarFollowing">
                    <img src={c.profilePicture ? resolvePath(c.profilePicture) : "/assets/person/noAvatar.jpg"} alt="" className="rightbarFollowingImg" />
                    <span className="rightbarFollowingName">{c.username}</span>
                  </div>
                </Link>
                {showFollowBack && (
                  <button
                    style={{ marginTop: "5px", fontSize: "12px", padding: "3px 8px", cursor: "pointer", backgroundColor: "#1877f2", color: "white", border: "none", borderRadius: "5px", fontWeight: "500" }}
                    onClick={() => handleFollowBack(c)}
                  >
                    Follow Back
                  </button>
                )}
              </div>
            );
          })}
          {list.length === 0 && <span className="rightbarEmptyText">No users yet.</span>}
        </div>
      </div>
    );
  };

  // Profile View Content - rendered inline so DOM inputs are NEVER remounted during editing
  const renderProfileView = () => {
    const isOwnProfile = Boolean(currentUser && user?.username === currentUser.username);
    const followsMe = Boolean(currentUser?.followers?.includes(user?._id));

    return (
      <>
        {!isOwnProfile && (
          <button className="rightbarFollowButton" onClick={handleClick}>
            {followed ? "Unfollow" : (followsMe ? "Follow Back" : "Follow")}
            {followed ? <Remove /> : <Add />}
          </button>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h4 className="rightbarTitle" style={{ marginBottom: 0 }}>
            {user?.username ? `${user.username} Information` : "User Information"}
          </h4>
          {isOwnProfile && !isEditing && (
            <button onClick={() => setIsEditing(true)} style={{ border: "none", background: "transparent", color: "#4f46e5", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" }}>
              <Edit style={{ fontSize: "16px" }} /> Edit
            </button>
          )}
        </div>

        <div className="rightbarInfo">
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
              <div>
                <label style={{ fontSize: "14px", color: "#6b7280", marginBottom: "5px", display: "block" }}>City</label>
                <input
                  type="text"
                  name="city"
                  value={editData.city}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "14px", color: "#6b7280", marginBottom: "5px", display: "block" }}>From</label>
                <input
                  type="text"
                  name="from"
                  value={editData.from}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "14px", color: "#6b7280", marginBottom: "5px", display: "block" }}>Relationship</label>
                <select
                  name="relationship"
                  value={editData.relationship}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                >
                  <option value={1}>Single</option>
                  <option value={2}>Married</option>
                  <option value={3}>-</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button onClick={handleEditSave} style={{ padding: "6px 15px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "500" }}>Save</button>
                <button onClick={() => setIsEditing(false)} style={{ padding: "6px 15px", backgroundColor: "#e5e7eb", color: "#4b5563", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="rightbarInfoItem">
                <div className="rightbarInfoKey">City:</div>
                <div className="rightbarInfoValue"> {user?.city || "-"}</div>
              </div>

              <div className="rightbarInfoItem">
                <div className="rightbarInfoKey">From:</div>
                <div className="rightbarInfoValue"> {user?.from || "-"}</div>
              </div>

              <div className="rightbarInfoItem">
                <div className="rightbarInfoKey">Relationship:</div>
                <div className="rightbarInfoValue"> {user?.relationship === 1 ? "Single" : user?.relationship === 2 ? "Married" : "-"}</div>
              </div>
            </>
          )}
        </div>

        <hr className="rightbarDivider" />

        {renderConnectionSection("Friends", connections.mutuals)}
        {renderConnectionSection("Followers", connections.followers)}
        {renderConnectionSection("Followings", connections.followings)}
      </>
    );
  };

  // Home View Content
  const renderHomeView = () => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();

    const birthdayFriends = friends.filter(f => {
      if (!f.dob) return false;
      const dobDate = new Date(f.dob);
      return (dobDate.getMonth() + 1) === todayMonth && dobDate.getDate() === todayDate;
    });

    return (
      <>
        {/* Unauthenticated Guest Join Banner */}
        {!currentUser && (
          <div className="rightbarGuestCard">
            <h4 className="rightbarGuestTitle">New to ZakoraSocial?</h4>
            <p className="rightbarGuestDesc">
              Sign in to like posts, share moments, and connect with friends!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link to="/login" className="rightbarGuestLoginBtn">
                Sign In
              </Link>
              <Link to="/register" className="rightbarGuestRegisterBtn">
                Create Free Account
              </Link>
            </div>
          </div>
        )}

        {birthdayFriends.length > 0 && (
          <div className="birthdayContainer">
            <img className="birthdayImg" src="/assets/gift.png" alt="" />
            <span className="birthdayText">
              <b>{birthdayFriends.map(f => f.username).join(", ")}</b> {birthdayFriends.length > 1 ? "have" : "has"} a birthday today!
            </span>
          </div>
        )}

        <img src="/assets/ad.png" alt="" className="rightbarAd" />

        {currentUser && (
          <>
            <h4 className="rightbarTitle">Online Friends</h4>
            <ul className="rightbarFriendList">
              {friends.map((u) => (
                <Link to={"/profile/" + u.username} style={{ textDecoration: "none", color: "inherit" }} key={u._id}>
                  <Online user={u} />
                </Link>
              ))}
              {friends.length === 0 && (
                <div style={{ color: "#9ca3af", fontSize: "13px" }}>No friends online right now</div>
              )}
            </ul>
          </>
        )}
      </>
    );
  };

  return (
    <div className="rightbar">
      <div className="rightbarWrapper">
        {user ? renderProfileView() : renderHomeView()}
      </div>
    </div>
  );
};

export default Rightbar;