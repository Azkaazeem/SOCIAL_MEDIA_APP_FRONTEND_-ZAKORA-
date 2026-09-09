import { useRef, useState } from 'react';
import '../login/login.css'; // Reusing the identical CSS classes
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AddAPhoto } from '@mui/icons-material';
import Topbar from '../../components/topbar/Topbar';

const Register = () => {
    const username = useRef();
    const dob = useRef();
    const email = useRef();
    const password = useRef();
    const passwordAgain = useRef();
    const history = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordAgain, setShowPasswordAgain] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isFetching, setIsFetching] = useState(false);
    const [file, setFile] = useState(null);

    const PF = import.meta.env.VITE_PUBLIC_FOLDER;

    const handleClick = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        passwordAgain.current.setCustomValidity("");

        if(passwordAgain.current.value !== password.current.value) {
            setErrorMessage("Passwords don't match!");
            return;
        } 
        
        setIsFetching(true);
        const user = {
            username: username.current.value,
            dob: dob.current.value,
            email: email.current.value,
            password: password.current.value,
        }

        if (file) {
            const data = new FormData();
            const fileName = Date.now() + file.name;
            data.append("name", fileName);
            data.append("file", file);
            try {
                const res = await axios.post("/upload", data);
                user.profilePicture = res.data.url;
            } catch (err) {
                console.log(err);
            }
        }

        try{
            await axios.post("/auth/register", user);
            history("/login");
        } catch(err) {
            console.log(err);
            setErrorMessage(err.response?.data?.message || "Registration failed. Please try again.");
            setIsFetching(false);
        }
    }

    const handleInputChange = () => {
        if(errorMessage) setErrorMessage("");
    }

    return (
        <>
            <Topbar />
            <div className="login">
                <div className="loginCard">
                <div className="loginHeader">
                    <h1 className="loginLogo">ZakoraSocial</h1>
                    <p className="loginDesc">Create a new account.</p>
                </div>

                <form className="loginForm" onSubmit={handleClick}>
                    {errorMessage && (
                        <div className="loginErrorBanner" role="alert">
                            <span className="errorIcon">⚠️</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="registerProfilePicContainer">
                        <label htmlFor="profilePicture" className="registerProfilePicLabel">
                            <img 
                                src={file ? URL.createObjectURL(file) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"} 
                                alt="Profile Preview" 
                                className="registerProfilePic" 
                            />
                            <span className="registerProfilePicHint"><AddAPhoto style={{fontSize:"14px", marginRight:"4px", verticalAlign:"middle"}}/> Add Profile Photo</span>
                            <input 
                                style={{ display: "none" }} 
                                type="file" 
                                id="profilePicture" 
                                accept=".png,.jpeg,.jpg" 
                                onChange={(e) => setFile(e.target.files[0])} 
                            />
                        </label>
                    </div>

                    <div className="inputGroup">
                        <label className="inputLabel">Username</label>
                        <input 
                            type="text" 
                            placeholder='Enter a username' 
                            className={`loginInput ${errorMessage ? 'inputError' : ''}`} 
                            ref={username} 
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="inputGroup">
                        <label className="inputLabel">Date of Birth</label>
                        <input 
                            type="date" 
                            className={`loginInput ${errorMessage ? 'inputError' : ''}`} 
                            ref={dob} 
                            onChange={handleInputChange}
                            required 
                        />
                    </div>
                    
                    <div className="inputGroup">
                        <label className="inputLabel">Email</label>
                        <input 
                            type="email" 
                            placeholder='Enter your email' 
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
                                placeholder='Create a password' 
                                className={`loginInput ${errorMessage ? 'inputError' : ''}`} 
                                minLength="6" 
                                ref={password} 
                                onChange={handleInputChange}
                                required 
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

                    <div className="inputGroup">
                        <label className="inputLabel">Confirm Password</label>
                        <div className="passwordInputWrapper">
                            <input
                                type={showPasswordAgain ? "text" : "password"}
                                placeholder='Confirm your password'
                                className={`loginInput ${errorMessage ? 'inputError' : ''}`}
                                ref={passwordAgain}
                                onChange={handleInputChange}
                                required
                            />
                            <button
                                type="button"
                                className="passwordToggle"
                                onClick={() => setShowPasswordAgain(!showPasswordAgain)}
                                aria-label={showPasswordAgain ? "Hide confirmation password" : "Show confirmation password"}
                            >
                                {showPasswordAgain ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </button>
                        </div>
                    </div>

                    <button className="loginButton" type='submit' disabled={isFetching}>
                        {isFetching ? "Signing up..." : "Sign Up"}
                    </button>
                </form>

                <p className="loginFooter">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
        </>
    )
}

export default Register;
