import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Home, ArrowBack, Explore, Person, Login as LoginIcon } from "@mui/icons-material";
import Topbar from "../../components/topbar/Topbar";
import "./notFound.css";

const NotFound = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <>
      <Topbar />
      <div className="notFoundContainer">
        {/* Ambient Decorative Glows */}
        <div className="notFoundGlow notFoundGlow1"></div>
        <div className="notFoundGlow notFoundGlow2"></div>

        <div className="notFoundCard">
          {/* Status Badge */}
          <div className="notFoundBadge">
            <span className="notFoundPulse"></span>
            <span>404 • PAGE NOT FOUND</span>
          </div>

          {/* Big Creative 404 Hero */}
          <div className="notFoundHero">
            <span className="notFoundDigit">4</span>
            <div className="notFoundCenterOrb">
              <Explore className="notFoundOrbIcon" />
              <div className="notFoundOrbRing"></div>
            </div>
            <span className="notFoundDigit">4</span>
          </div>

          {/* Text Content */}
          <h1 className="notFoundTitle">Lost in the Social Space?</h1>
          <p className="notFoundDesc">
            We couldn't find the page or post you were looking for. It might have been moved, deleted, or the URL might be mistyped.
          </p>

          {/* Action Buttons */}
          <div className="notFoundActions">
            <Link to="/" className="notFoundPrimaryBtn">
              <Home style={{ fontSize: "20px" }} />
              <span>Back to Home Feed</span>
            </Link>
            <button 
              type="button" 
              className="notFoundSecondaryBtn"
              onClick={() => navigate(-1)}
            >
              <ArrowBack style={{ fontSize: "19px" }} />
              <span>Go Back</span>
            </button>
          </div>

          {/* Helpful Quick Links */}
          <div className="notFoundQuickLinks">
            <span className="notFoundQuickLabel">Quick shortcuts:</span>
            <div className="notFoundChips">
              <Link to="/" className="notFoundChip">
                <Explore style={{ fontSize: "16px" }} />
                <span>Explore Feed</span>
              </Link>
              {user ? (
                <Link to={`/profile/${user.username}`} className="notFoundChip">
                  <Person style={{ fontSize: "16px" }} />
                  <span>My Profile</span>
                </Link>
              ) : (
                <Link to="/login" className="notFoundChip">
                  <LoginIcon style={{ fontSize: "16px" }} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
