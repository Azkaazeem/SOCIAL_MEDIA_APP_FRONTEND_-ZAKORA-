import "./sidebar.css"
import { RssFeed, Chat, PlayCircle, Photo, Article, Info } from "@mui/icons-material";
import Closefriends from "../closeFriends/CloseFriends";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/users/all");
        setUsers(res.data.filter(u => u._id !== currentUser?._id));
      } catch (err) {
        console.log(err);
      }
    };
    fetchUsers();
  }, [currentUser]);

  const filteredUsers = users.filter(u => 
    u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleFilterClick = (filterType) => {
    navigate("/"); // Go home or just filter if already on home/profile
    window.dispatchEvent(new CustomEvent('postFilterChanged', { detail: filterType }));
  };

  return (
    <div className="sidebar">
      <div className="sidebarWrapper">

        <ul className="sidebarList">
          <li className="sidebarListItem" onClick={() => handleFilterClick('all')} style={{ cursor: "pointer" }}>
            <RssFeed className="sidebarIcon" />
            <span className="sidebarListItemText">Feed</span>
          </li>
          <li className="sidebarListItem not-functional">
            <Chat className="sidebarIcon" />
            <span className="sidebarListItemText">Chats</span>
          </li>
          <li className="sidebarListItem" onClick={() => handleFilterClick('video')} style={{ cursor: "pointer" }}>
            <PlayCircle className="sidebarIcon" />
            <span className="sidebarListItemText">Videos</span>
          </li>
          <li className="sidebarListItem" onClick={() => handleFilterClick('image')} style={{ cursor: "pointer" }}>
            <Photo className="sidebarIcon" />
            <span className="sidebarListItemText">Images</span>
          </li>
          <li className="sidebarListItem" onClick={() => handleFilterClick('article')} style={{ cursor: "pointer" }}>
            <Article className="sidebarIcon" />
            <span className="sidebarListItemText">Articles</span>
          </li>
          <li className="sidebarListItem not-functional">
            <Info className="sidebarIcon" />
            <span className="sidebarListItemText">About Zakora</span>
          </li>
        </ul>

        <hr className="sidebarHr"/>

        <div className="sidebarSearchContainer">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="sidebarSearchInput"
          />
        </div>

        <ul className="sidebarFriendList">
         {filteredUsers.length > 0 ? (
           filteredUsers.map((u) => (
            <Link to={"/profile/" + u.username} style={{textDecoration: "none", color: "inherit"}} key={u._id}>
              <Closefriends user={u} />
            </Link>
           ))
         ) : (
           <div style={{color: "gray", fontSize: "14px", textAlign: "center"}}>No users found</div>
         )}
        </ul>

      </div>
    </div>
  )
}

export default Sidebar