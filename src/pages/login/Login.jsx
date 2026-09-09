import './login.css';
import { useContext, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loginCall } from '../../apiCalls';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress } from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Topbar from '../../components/topbar/Topbar';

const Login = () => {
  const email = useRef();
  const password = useRef();
  const { isFetching, error, dispatch } = useContext(AuthContext);
  
  // Local state to manage user-friendly error message
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sync context error with local error banner
  useEffect(() => {
    if (error) {
      setErrorMessage(
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || "Invalid email or password. Please try again."
      );
    }
  }, [error]);

  // Clear error as soon as the user starts typing again
  const handleInputChange = () => {
    if (errorMessage) setErrorMessage("");
  };

  const handleClick = (e) => {
    e.preventDefault();
    setErrorMessage(""); // reset on submit
    loginCall(
      { email: email.current.value, password: password.current.value },
      dispatch
    );
  };

  return (
    <>
      <Topbar />
      <div className="login">
        <div className="loginCard">
          <div className="loginHeader">
            <h1 className="loginLogo">ZakoraSocial</h1>
            <p className="loginDesc">Welcome back! Please enter your details.</p>
          </div>

          <form className="loginForm" onSubmit={handleClick}>
            {/* Graceful Error Alert Banner */}
            {errorMessage && (
              <div className="loginErrorBanner" role="alert">
                <span className="errorIcon">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="inputGroup">
              <label className="inputLabel">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className={`loginInput ${errorMessage ? 'inputError' : ''}`}
                ref={email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="inputGroup">
              <label className="inputLabel">Password</label>
              <div className="passwordInputWrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`loginInput ${errorMessage ? 'inputError' : ''}`}
                  ref={password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
                <button
                    type="button"
                    className="passwordToggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              </div>
            </div>

            <div className="loginOptions">
              <label className="rememberMe">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="loginForgot">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="loginButton" disabled={isFetching}>
              {isFetching ? (
                <CircularProgress color="inherit" size="22px" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="loginFooter">
            Don't have an account? <Link to="/register">Sign up for free</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;