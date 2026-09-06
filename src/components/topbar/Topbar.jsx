import "./Topbar.css";
import { Search, Person, Chat, Notifications, Menu, Close, Logout, Login as LoginIcon } from "@mui/icons-material";
import { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../sidebar/Sidebar";
import Swal from 'sweetalert2';
import { SocketContext } from "../../context/SocketContext";
import { format } from "timeago.js";

const Topbar = () => {
  const { user, dispatch } = useContext(AuthContext);
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useContext(SocketContext);
  const PF = import.meta.env.VITE_PUBLIC_FOLDER;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);

  const notificationRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
    };

    if (openNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [openNotifications]);

  const resolvePath = (path) => path ? (path.startsWith("http") ? path : PF + path) : "";
  const profileImage = user?.profilePicture ? resolvePath(user.profilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg";
  const profileLink = user?.username ? `/profile/${user.username}` : "/login";

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    window.dispatchEvent(new CustomEvent('searchQueryChanged', { detail: query }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/`);
      setIsMobileMenuOpen(false); 
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("user");
        dispatch({ type: "LOGOUT" });
        navigate("/login");
      }
    });
  };

  const getNotificationText = (n) => {
    if (n.text) return n.text;
    switch (n.type) {
      case "like":
        return "liked your post.";
      case "comment":
        return "commented on your post.";
      case "reply":
        return "replied to your comment.";
      case "follow":
        return "started following you.";
      default:
        return "interacted with you.";
    }
  };

  const handleNotificationClick = () => {
    if (!user) {
      Swal.fire({
        title: "Login Required",
        text: "Please sign in to view your notifications.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Sign In",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#4f46e5"
      }).then((res) => {
        if (res.isConfirmed) navigate("/login");
      });
      return;
    }
    setOpenNotifications(!openNotifications);
  };

  const handleItemClick = (n) => {
    setOpenNotifications(false);
    if (markAsRead) {
      markAsRead(n._id || n.id);
    }
    if ((n.type === "like" || n.type === "comment" || n.type === "reply") && n.postId) {
      navigate(`/post/${n.postId}`);
    } else if (n.senderName) {
      navigate(`/profile/${n.senderName}`);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  return (
    <div className="topbarContainer">
      {/* DESKTOP TOPBAR */}
      <div className="topbarDesktop">
        <div className="topbarLeft">
          <Link to="/" style={{textDecoration:"none"}}><span className="logo">ZakoraSocial</span></Link>
        </div>
        <div className="topbarCenter">
          <form className="searchBar" onSubmit={handleSearch}>
            <Search className="searchIcon"/>
            <input 
              placeholder="Search for posts or friends..." 
              className="searchInput" 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>
        </div>
        <div className="topbarRight">
          <div className="topbarLinks">
            {user ? (
              <span className="topbarLink" onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Logout style={{ fontSize: "18px" }} /> Logout
              </span>
            ) : (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link to="/login" style={{ textDecoration: "none", color: "#4f46e5", fontWeight: "600", fontSize: "13.5px", padding: "6px 14px", borderRadius: "8px", border: "1px solid #4f46e5" }}>
                  Login
                </Link>
                <Link to="/register" style={{ textDecoration: "none", backgroundColor: "#4f46e5", color: "#ffffff", fontWeight: "600", fontSize: "13.5px", padding: "6px 14px", borderRadius: "8px" }}>
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="topbarIcons">
            <div 
              ref={notificationRef}
              className="topbarIconItem" 
              onClick={handleNotificationClick} 
              style={{cursor: "pointer", position: "relative"}}
              title="Notifications"
            >
              <Notifications />
              {unreadCount > 0 && <span className="topbarIconBadge">{unreadCount}</span>}
              
              {openNotifications && (
                <div 
                  className="notificationsDropdown" 
                  style={{ position: "absolute", top: "45px", right: "-10px", backgroundColor: "white", color: "black", width: "340px", maxWidth: "90vw", borderRadius: "10px", boxShadow: "0px 10px 25px -5px rgba(0,0,0,0.15)", zIndex: 999, padding: "15px", maxHeight: "420px", overflowY: "auto", border: "1px solid #f1f5f9" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>Notifications</h4>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {unreadCount > 0 && (
                        <span 
                          onClick={(e) => { e.stopPropagation(); markAllAsRead && markAllAsRead(); }} 
                          style={{ fontSize: "12px", color: "#4f46e5", cursor: "pointer", fontWeight: "600" }}
                        >
                          Mark all read
                        </span>
                      )}
                      {(notifications || []).length > 0 && (
                        <span 
                          onClick={(e) => { e.stopPropagation(); clearAllNotifications && clearAllNotifications(); }} 
                          style={{ fontSize: "12px", color: "#ef4444", cursor: "pointer", fontWeight: "600" }}
                        >
                          Clear All
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(notifications || []).length === 0 ? (
                    <span style={{ fontSize: "14px", color: "#94a3b8", display: "block", textAlign: "center", margin: "25px 0" }}>No new notifications</span>
                  ) : (
                    notifications.map((n, i) => (
                      <div 
                        key={n._id || n.id || i} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          padding: "10px", 
                          borderBottom: "1px solid #f1f5f9", 
                          gap: "10px", 
                          cursor: "pointer", 
                          backgroundColor: n.isRead ? "white" : "#eef2ff", 
                          borderRadius: "8px", 
                          marginBottom: "5px",
                          transition: "background-color 0.2s ease"
                        }} 
                        onClick={() => handleItemClick(n)}
                      >
                        <img 
                          src={n.senderProfilePicture ? resolvePath(n.senderProfilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"} 
                          alt="" 
                          style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenNotifications(false);
                            if (markAsRead) markAsRead(n._id || n.id);
                            navigate(`/profile/${n.senderName}`);
                          }}
                        />
                        <div style={{ flex: 1, fontSize: "13px", lineHeight: "1.4" }}>
                          <div>
                            <span style={{ fontWeight: "600", color: "#1e293b" }}>{n.senderName}</span>{" "}
                            <span style={{ color: "#475569" }}>{getNotificationText(n)}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                            {n.createdAt ? format(n.createdAt) : "Just now"}
                          </div>
                        </div>
                        <Close 
                          style={{ fontSize: "18px", color: "#94a3b8", padding: "3px", cursor: "pointer", flexShrink: 0 }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deleteNotification) deleteNotification(n._id || n.id);
                          }} 
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <Link to={profileLink} title={user ? user.username : "Login"}>
            <img src={profileImage} alt="" className="topbarImg" />
          </Link>
        </div>
      </div>

      {/* MOBILE TOPBAR */}
      <div className="topbarMobile">
        <div className="mobileLeft" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <Close className="mobileHamburgerIcon" /> : <Menu className="mobileHamburgerIcon" />}
        </div>
        <div className="mobileCenter">
          <form className="searchBar" onSubmit={handleSearch} style={{margin: "0", height: "35px", width: "100%"}}>
            <Search className="searchIcon" style={{fontSize: "18px", marginLeft: "5px"}}/>
            <input 
              placeholder="Search..." 
              className="searchInput" 
              value={searchQuery}
              onChange={handleSearchChange}
              style={{fontSize: "12px", width: "100%"}}
            />
          </form>
        </div>
        <div className="mobileRight">
          <div 
            className="topbarIconItem" 
            onClick={handleNotificationClick} 
            style={{cursor: "pointer", position: "relative", display: "flex", alignItems: "center"}}
            title="Notifications"
          >
            <Notifications style={{ fontSize: "22px", color: "white" }} />
            {unreadCount > 0 && <span className="topbarIconBadge">{unreadCount}</span>}
          </div>
          <Link to={profileLink} style={{display: "flex"}}>
            <img src={profileImage} alt="" className="mobileAvatarImg" />
          </Link>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="mobileMenuOverlay">
          <div className="mobileMenuHeader">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{textDecoration:"none"}}><span className="logo">ZakoraSocial</span></Link>
          </div>

          {user ? (
            <div style={{padding: "0 20px", marginTop: "10px", display: "flex", gap: "15px"}}>
               <button style={{padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", width: "100%"}} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div style={{padding: "0 20px", marginTop: "10px", display: "flex", gap: "10px"}}>
               <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{textAlign: "center", flex: 1, padding: "8px 16px", border: "1px solid #4f46e5", color: "#4f46e5", borderRadius: "8px", fontWeight: "600", textDecoration: "none"}}>Login</Link>
               <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} style={{textAlign: "center", flex: 1, padding: "8px 16px", backgroundColor: "#4f46e5", color: "white", borderRadius: "8px", fontWeight: "600", textDecoration: "none"}}>Register</Link>
            </div>
          )}

          <div className="mobileMenuSidebarWrapper">
             <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
};

export default Topbar;