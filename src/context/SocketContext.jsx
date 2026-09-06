import { createContext, useEffect, useState, useContext, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  
  const [notifications, setNotifications] = useState(() => {
    if (user && user._id) {
      const saved = localStorage.getItem("notifications_" + user._id);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const knownNotificationIds = useRef(new Set());

  // Show SweetAlert2 toast notification
  const showToastNotification = (notif) => {
    let messageText = "interacted with you.";
    if (notif.text) {
      messageText = notif.text;
    } else if (notif.type === "like") {
      messageText = "liked your post.";
    } else if (notif.type === "comment") {
      messageText = "commented on your post.";
    } else if (notif.type === "reply") {
      messageText = "replied to your comment.";
    } else if (notif.type === "follow") {
      messageText = "started following you.";
    }

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });

    Toast.fire({
      icon: "info",
      title: `${notif.senderName || "Someone"} ${messageText}`,
    });
  };

  // Fetch notifications from MongoDB backend
  const fetchNotificationsFromApi = useCallback(async (isInitial = false) => {
    if (!user || !user._id) return;
    try {
      const res = await axios.get("/notifications/" + user._id);
      if (Array.isArray(res.data)) {
        const fetched = res.data;

        // On periodic poll (not initial load), check for new incoming items
        if (!isInitial) {
          const newItems = fetched.filter(
            (item) => item._id && !knownNotificationIds.current.has(item._id) && !item.isRead
          );
          if (newItems.length > 0) {
            // Show toast for the latest notification
            showToastNotification(newItems[0]);
          }
        }

        // Update known IDs
        fetched.forEach((item) => {
          if (item._id) knownNotificationIds.current.add(item._id);
        });

        setNotifications(fetched);
        localStorage.setItem("notifications_" + user._id, JSON.stringify(fetched));
      }
    } catch (err) {
      // Ignore network errors on background poll
    }
  }, [user]);

  // Initial fetch on user change
  useEffect(() => {
    if (user && user._id) {
      // Load saved from local storage first
      const saved = localStorage.getItem("notifications_" + user._id);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications(parsed);
          parsed.forEach((item) => {
            if (item._id) knownNotificationIds.current.add(item._id);
          });
        } catch (e) {
          // ignore
        }
      }
      fetchNotificationsFromApi(true);
    } else {
      setNotifications([]);
      knownNotificationIds.current.clear();
    }
  }, [user?._id, fetchNotificationsFromApi]);

  // Sync to local storage
  useEffect(() => {
    if (user && user._id) {
      localStorage.setItem("notifications_" + user._id, JSON.stringify(notifications));
    }
  }, [notifications, user?._id]);

  // Periodic polling every 12 seconds (guarantees notifications work on Vercel & serverless)
  useEffect(() => {
    if (!user || !user._id) return;

    const interval = setInterval(() => {
      fetchNotificationsFromApi(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [user, fetchNotificationsFromApi]);

  // Real-time Socket Connection
  useEffect(() => {
    if (user) {
      const SOCKET_URL = import.meta.env.PROD
        ? "https://social-media-app-backend-l94r39p6n-azka-azeems-projects.vercel.app"
        : "http://localhost:8800";

      const newSocket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("newUser", user.username);
      });

      newSocket.on("getNotification", (data) => {
        const notifId = data._id || data.id || (Date.now() + Math.random().toString());
        const formattedNotif = {
          ...data,
          _id: notifId,
          id: notifId,
          isRead: false,
          createdAt: data.createdAt || new Date().toISOString(),
        };

        knownNotificationIds.current.add(notifId);

        setNotifications((prev) => {
          // Avoid duplicate entry
          if (prev.some((n) => (n._id && n._id === notifId) || (n.id && n.id === notifId))) {
            return prev;
          }
          return [formattedNotif, ...prev];
        });

        showToastNotification(formattedNotif);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item._id === id || item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await axios.put(`/notifications/${id}/read`);
    } catch (e) {
      // non-blocking
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || !user._id) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await axios.put(`/notifications/read-all/${user._id}`);
    } catch (e) {
      // non-blocking
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((item) => item._id !== id && item.id !== id));
    try {
      await axios.delete(`/notifications/${id}`);
    } catch (e) {
      // non-blocking
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!user || !user._id) return;
    setNotifications([]);
    try {
      await axios.delete(`/notifications/clear/${user._id}`);
    } catch (e) {
      // non-blocking
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        setNotifications,
        fetchNotifications: fetchNotificationsFromApi,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
