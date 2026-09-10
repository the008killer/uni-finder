import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Search from "./pages/Search";
import ProgramDetail from "./pages/ProgramDetails";
import UniversityDetail from "./pages/UniversityDetails";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";

function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <span className="bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
        Study in Germany
      </span>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-6 tracking-tight">
        Find Your Ideal University Degree & Connect With Peers
      </h1>
      <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
        Search thousands of Bachelor & Master programs in German or English.
        Compare public & private universities, and join course chat groups.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/search"
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
        >
          Explore Courses
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/universities/:id" element={<UniversityDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/reset-password/:token"
                element={<ResetPassword />}
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/bookmarks" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
