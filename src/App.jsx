import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/Home';
import Profile from './pages/profile/Profile';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import SinglePost from './pages/singlePost/SinglePost';
import NotFound from './pages/notFound/NotFound';
import AiAgent from './components/aiAgent/AiAgent';
import BackToTop from './components/backToTop/BackToTop';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/post/:postId" element={<SinglePost />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BackToTop />
      <AiAgent />
    </BrowserRouter>
  );
}

export default App;
