import "./Topbar.css";
import { Search, Person, Chat, Notifications, Menu, Close, Logout, Login as LoginIcon, LightMode, DarkMode } from "@mui/icons-material";
import { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import Sidebar from "../sidebar/Sidebar";
import Swal from 'sweetalert2';
import { SocketContext } from "../../context/SocketContext";
import { format } from "timeago.js";

const Topbar = () => {
  const { user, dispatch } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useContext(SocketContext);
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notificationRef = useRef(null);
  const mobileNotificationRef = useRef(null);
  const profileMenuRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideDesktopNotif = notificationRef.current && notificationRef.current.contains(event.target);
      const clickedInsideMobileNotif = mobileNotificationRef.current && mobileNotificationRef.current.contains(event.target);
      if (!clickedInsideDesktopNotif && !clickedInsideMobileNotif) {
        setOpenNotifications(false);
      }
      const clickedInsideDesktopProfile = profileMenuRef.current && profileMenuRef.current.contains(event.target);
      const clickedInsideMobileProfile = mobileProfileMenuRef.current && mobileProfileMenuRef.current.contains(event.target);
      if (!clickedInsideDesktopProfile && !clickedInsideMobileProfile) {
        setProfileMenuOpen(false);
      }
    };

    if (openNotifications || profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [openNotifications, profileMenuOpen]);

  const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";
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

  const renderNotificationsDropdown = () => (
    <div 
      className="notificationsDropdown" 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="notificationsDropdownHeader">
        <h4 className="notifHeaderTitle">Notifications</h4>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {unreadCount > 0 && (
            <span 
              onClick={(e) => { e.stopPropagation(); markAllAsRead && markAllAsRead(); }} 
              className="notifMarkReadBtn"
            >
              Mark all read
            </span>
          )}
          {(notifications || []).length > 0 && (
            <span 
              onClick={(e) => { e.stopPropagation(); clearAllNotifications && clearAllNotifications(); }} 
              className="notifClearAllBtn"
            >
              Clear All
            </span>
          )}
        </div>
      </div>
      
      {(notifications || []).length === 0 ? (
        <span className="notifEmptyText">No new notifications</span>
      ) : (
        notifications.map((n, i) => (
          <div 
            key={n._id || n.id || i} 
            className={`notifItem ${n.isRead ? 'read' : 'unread'}`}
            onClick={() => handleItemClick(n)}
          >
            <img 
              src={n.senderProfilePicture ? resolvePath(n.senderProfilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"} 
              alt="" 
              className="notifAvatar"
              onClick={(e) => {
                e.stopPropagation();
                setOpenNotifications(false);
                if (markAsRead) markAsRead(n._id || n.id);
                navigate(`/profile/${n.senderName}`);
              }}
            />
            <div style={{ flex: 1, fontSize: "13px", lineHeight: "1.4" }}>
              <div>
                <span className="notifSenderName">{n.senderName}</span>{" "}
                <span className="notifActionText">{getNotificationText(n)}</span>
              </div>
              <div className="notifTimestamp">
                {n.createdAt ? format(n.createdAt) : "Just now"}
              </div>
            </div>
            <Close 
              className="notifCloseIcon"
              onClick={(e) => {
                e.stopPropagation();
                if (deleteNotification) deleteNotification(n._id || n.id);
              }} 
            />
          </div>
        ))
      )}
    </div>
  );

  const renderProfileDropdown = () => (
    <div className="profileDropdownMenu" onClick={(e) => e.stopPropagation()}>
      {user ? (
        <>
          <div className="profileDropdownUserHeader">
            <span className="profileDropdownName">{user.username}</span>
            <span className="profileDropdownEmail">Zakora Member</span>
          </div>
          <div 
            className="profileDropdownItem"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate(`/profile/${user.username}`);
            }}
          >
            <Person style={{ fontSize: "19px" }} />
            <span>Profile</span>
          </div>
          <div 
            className="profileDropdownItem"
            onClick={() => {
              toggleTheme();
            }}
          >
            {darkMode ? (
              <LightMode style={{ fontSize: "19px", color: "#facc15" }} />
            ) : (
              <DarkMode style={{ fontSize: "19px", color: "#6366f1" }} />
            )}
            <span>{darkMode ? "Light Theme" : "Dark Theme"}</span>
          </div>
          <div 
            className="profileDropdownItem profileDropdownLogout"
            onClick={() => {
              setProfileMenuOpen(false);
              handleLogout();
            }}
          >
            <Logout style={{ fontSize: "19px" }} />
            <span>Logout</span>
          </div>
        </>
      ) : (
        <>
          <div 
            className="profileDropdownItem"
            onClick={() => {
              toggleTheme();
            }}
          >
            {darkMode ? (
              <LightMode style={{ fontSize: "19px", color: "#facc15" }} />
            ) : (
              <DarkMode style={{ fontSize: "19px", color: "#6366f1" }} />
            )}
            <span>{darkMode ? "Light Theme" : "Dark Theme"}</span>
          </div>
          <div 
            className="profileDropdownItem"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/login");
            }}
          >
            <LoginIcon style={{ fontSize: "19px" }} />
            <span>Login</span>
          </div>
          <div 
            className="profileDropdownItem"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/register");
            }}
          >
            <Person style={{ fontSize: "19px" }} />
            <span>Register</span>
          </div>
        </>
      )}
    </div>
  );

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
          <div className="topbarIcons">
            <button 
              type="button"
              className="themeToggleBtn"
              onClick={toggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <LightMode className="themeToggleIcon" />
              ) : (
                <DarkMode className="themeToggleIcon" />
              )}
            </button>

            <div 
              ref={notificationRef}
              className="topbarIconItem" 
              onClick={handleNotificationClick} 
              style={{cursor: "pointer", position: "relative"}}
              title="Notifications"
            >
              <Notifications />
              {unreadCount > 0 && <span className="topbarIconBadge">{unreadCount}</span>}
              {openNotifications && renderNotificationsDropdown()}
            </div>
          </div>

          {/* Profile Picture with Dropdown Menu */}
          <div ref={profileMenuRef} style={{ position: "relative" }}>
            <img 
              src={profileImage} 
              alt={user?.username || "User"} 
              className="topbarImg" 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={user ? `${user.username} (Click for menu)` : "Menu"}
              style={{ cursor: "pointer" }}
            />
            {profileMenuOpen && renderProfileDropdown()}
          </div>
        </div>
      </div>

      {/* MOBILE TOPBAR */}
      <div className="topbarMobile">
        <div className="mobileLeft" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Menu">
          {isMobileMenuOpen ? (
            <Close className="mobileHamburgerIcon" style={{ color: darkMode ? "#f8fafc" : "#111827", fontSize: "28px" }} />
          ) : (
            <Menu className="mobileHamburgerIcon" style={{ color: darkMode ? "#f8fafc" : "#111827", fontSize: "28px" }} />
          )}
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
            ref={mobileNotificationRef}
            className="topbarIconItem" 
            onClick={handleNotificationClick} 
            style={{cursor: "pointer", position: "relative", display: "flex", alignItems: "center"}}
            title="Notifications"
          >
            <Notifications style={{ fontSize: "22px", color: darkMode ? "#f8fafc" : "#4b5563" }} />
            {unreadCount > 0 && <span className="topbarIconBadge">{unreadCount}</span>}
            {openNotifications && renderNotificationsDropdown()}
          </div>
          
          <div ref={mobileProfileMenuRef} style={{ position: "relative" }}>
            <img 
              src={profileImage} 
              alt={user?.username || "User"} 
              className="mobileAvatarImg" 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{ cursor: "pointer" }}
              title="Menu"
            />
            {profileMenuOpen && renderProfileDropdown()}
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY (HAMBURGER DRAWER - CLEANED) */}
      {isMobileMenuOpen && (
        <div className="mobileMenuOverlay">
          <div className="mobileMenuHeader">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{textDecoration:"none"}}><span className="logo">ZakoraSocial</span></Link>
          </div>

          <div className="mobileMenuSidebarWrapper">
             <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
};

export default Topbar;