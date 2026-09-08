import { useState, useEffect, useContext } from "react";
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import Feed from "../../components/feed/Feed";
import Rightbar from "../../components/rightbar/Rightbar";
import "./profile.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { AddAPhoto } from "@mui/icons-material";

const Profile = () => {
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
  const [user, setUser] = useState({});
  const { username } = useParams();
  const { user: currentUser, dispatch } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const validUsername = username && username !== "undefined" ? username.trim() : null;
      if (!validUsername) return;
      try {
        const res = await axios.get(`/users?username=${encodeURIComponent(validUsername)}`);
        if (isMounted && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.warn("Could not load user profile:", err?.message || err);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [username, currentUser]);

  const handleImageUpdate = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const data = new FormData();
      const fileName = Date.now() + "_" + file.name;
      data.append("name", fileName);
      data.append("file", file);
      
      try {
        const res = await axios.post("/upload", data);
        const updateData = { userId: currentUser._id };
        updateData[type] = res.data?.url || fileName;
        
        await axios.put(`/users/${currentUser._id}`, updateData);
        // Update local context
        dispatch({ type: "UPDATE_USER", payload: updateData });
        // Update local state to reflect instantly
        setUser(prev => ({ ...prev, ...updateData }));
      } catch (err) {
        console.error(err);
      }
    }
  }

  const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";
  const isOwnProfile = Boolean(currentUser && username === currentUser.username);
  const coverImage = user.coverPicture ? resolvePath(user.coverPicture) : "https://i.pinimg.com/1200x/d6/94/05/d694055779c0a17614c27f1acc017738.jpg";
  const profileImage = user.profilePicture ? resolvePath(user.profilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg";

  return (
    <>
      <Topbar />
      <div className="profile">
        <Sidebar />
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover">
              <img src={coverImage} alt="" className="profileCoverImg" />
              {isOwnProfile && (
                <label htmlFor="coverFile" className="editCoverBtn">
                  <AddAPhoto /> <span>Edit Cover</span>
                  <input style={{ display: "none" }} type="file" id="coverFile" accept=".png,.jpeg,.jpg" onChange={(e) => handleImageUpdate(e, "coverPicture")} />
                </label>
              )}
              
              <div className="profileUserImgContainer">
                <img src={profileImage} alt="" className="profileUserImg" />
                {isOwnProfile && (
                  <label htmlFor="profileFile" className="editProfileBtn">
                    <AddAPhoto style={{fontSize: "18px"}} />
                    <input style={{ display: "none" }} type="file" id="profileFile" accept=".png,.jpeg,.jpg" onChange={(e) => handleImageUpdate(e, "profilePicture")} />
                  </label>
                )}
              </div>
            </div>
            <div className="profileInfo">
              <h4 className="profileInfoName">{user.username}</h4>
              <span className="profileInfoDesc">{user.desc}</span>
            </div>
          </div>
          <div className="profileRightBottom">
            <Feed username={username}/>
            <Rightbar user={user} />
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile;
