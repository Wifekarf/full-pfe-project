import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaUserShield } from "react-icons/fa";

export default function AuthLayout({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [isQuizMenuOpen, setIsQuizMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Sidebar */}
      <nav className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-white shadow-lg py-6 px-4 overflow-y-auto">
        {/* Logo */}
        <motion.div
          className="mb-8 flex cursor-pointer items-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(user?.role === "ROLE_ADMIN" ? "/admin" : "/home")}
        >
          <img src="/logo.png" alt="Wevioo Quiz Logo" className="mr-2 h-10 w-10 object-contain" />
          <span className="text-2xl font-serif font-bold text-[#85a831] tracking-tight">
            Wevioo Quiz
          </span>
        </motion.div>

        {/* Profil */}
        <NavLink
          to={user?.role === "ROLE_ADMIN" ? "/admin" : "/home"}
          className={({ isActive }) =>
            `mb-6 flex items-center rounded-lg px-3 py-2 transition-all duration-200 ${
              isActive
                ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
            }`
          }
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#85a831]/20 text-[#85a831] font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
          <span className="ml-2">{user?.username}</span>
        </NavLink>

        {/* Menu */}
        <div className="flex-1 space-y-2">
          {(user?.role === "ROLE_USER" || user?.role === "ROLE_TEAM_MANAGER") && (
            <NavLink
              to="/play"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
                }`
              }
            >
              Play
            </NavLink>
          )}

          {(user?.role === "ROLE_TEAM_MANAGER" || user?.role === "ROLE_USER") && (
            <NavLink
              to="/team-manager"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
                }`
              }
            >
              My Team
            </NavLink>
          )}

          {(user?.role === "ROLE_USER" || user?.role === "ROLE_TEAM_MANAGER") && (
            <NavLink
              to="/programming-problems"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
                }`
              }
            >
              Code Challenges
            </NavLink>
          )}

          {(user?.role === "ROLE_TEAM_MANAGER") && (
            <NavLink
              to="/team-scores"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
                }`
              }
            >
              Team Scores
            </NavLink>
          )}

          {/* Admin Menu */}
          {user?.role === "ROLE_ADMIN" && (
            <div>
              <button
                onClick={() => setIsQuizMenuOpen(!isQuizMenuOpen)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-[#85a831] transition-all duration-200"
              >
                Management
                <svg
                  className={`h-4 w-4 transform transition-transform ${
                    isQuizMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isQuizMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 ml-4 flex flex-col space-y-1"
                >
                  {[
                    { to: "/admin/quiz", text: "Quizzes" },
                    { to: "/admin/quiz/questions", text: "Affectation Questions" },
                    { to: "/admin/quiz/users", text: "Affectation Users" },
                    { to: "/admin/languages", text: "Languages" },
                    { to: "/admin/questions", text: "Questions" },
                    { divider: true },
                    { to: "/admin/progproblems", text: "Programming Problems" },
                    { to: "/admin/tasks", text: "Tasks" },
                    { to: "/admin/progproblems/users", text: "Problem Assignments" },
                    { divider: true },
                    { to: "/admin/teams", text: "Manage Teams" },
                    { to: "/admin/users", text: "Manage Users" },
                  ].map((item, i) =>
                    item.divider ? (
                      <div key={i} className="border-t border-gray-200 my-1" />
                    ) : (
                      <NavLink
                        key={i}
                        to={item.to}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 transition-all duration-200 ${
                            isActive
                              ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                              : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
                          }`
                        }
                        onClick={() => setIsQuizMenuOpen(false)}
                      >
                        {item.text}
                      </NavLink>
                    )
                  )}
                </motion.div>
              )}
            </div>
          )}

          <NavLink
            to={user?.role === "ROLE_ADMIN" ? "/admin/historique" : "/historique"}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 transition-all duration-200 ${
                isActive
                  ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
              }`
            }
          >
            Historique
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 transition-all duration-200 ${
                isActive
                  ? "bg-[#85a831]/10 text-[#85a831] font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium"
              }`
            }
          >
            Profile
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full text-left rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-[#85a831] transition-all duration-200 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
