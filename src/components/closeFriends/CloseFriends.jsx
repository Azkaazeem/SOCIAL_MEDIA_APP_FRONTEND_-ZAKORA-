import "./closeFriends.css"

const Closefriends = ({ user }) => {
    const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
    const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";
    return (
        <li className="sidebarFriend">
            <img className="sidebarFriendImg" src={user.profilePicture ? resolvePath(user.profilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"} alt="" />
            <span className="sidebarFriendName">{user.username}</span>
        </li>
    )
}

export default Closefriends