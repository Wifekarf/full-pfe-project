import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCode, FaCodeBranch, FaLaptopCode, FaQuestionCircle, FaUsers, FaHistory, FaLanguage, FaChalkboardTeacher, FaTasks, FaUserShield } from 'react-icons/fa';

// Custom component for navigation links
const NavLink = ({ to, icon, children, active }) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md transition ${
        active ? 'bg-[#006674] text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="ml-3">{children}</span>
    </Link>
  );
};

const AdminNavbar = () => {
  const location = useLocation();
  const path = location.pathname;
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Quiz Management</h2>
        <div className="space-y-2">
          <NavLink 
            to="/admin/quiz" 
            icon={<FaChalkboardTeacher className="text-blue-500" />}
            active={path === '/admin/quiz'}
          >
            Manage Quizzes
          </NavLink>
          <NavLink 
            to="/admin/questions" 
            icon={<FaQuestionCircle className="text-green-500" />}
            active={path === '/admin/questions'}
          >
            Questions
          </NavLink>
          <NavLink 
            to="/admin/quiz/users" 
            icon={<FaUsers className="text-yellow-600" />}
            active={path === '/admin/quiz/users'}
          >
            Quiz Assignments
          </NavLink>
          <NavLink 
            to="/admin/historique" 
            icon={<FaHistory className="text-purple-500" />}
            active={path === '/admin/historique'}
          >
            Quiz History
          </NavLink>

        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Programming Problems</h2>
        <div className="space-y-2">
          <NavLink 
            to="/admin/progproblems" 
            icon={<FaCode className="text-blue-500" />}
            active={path === '/admin/progproblems' || path.includes('/admin/progproblems/')}
          >
            Manage Problems
          </NavLink>
          <NavLink 
            to="/admin/tasks" 
            icon={<FaTasks className="text-green-500" />}
            active={path === '/admin/tasks'}
          >
            Tasks
          </NavLink>
          <NavLink 
            to="/admin/progproblems/users" 
            icon={<FaUsers className="text-yellow-600" />}
            active={path === '/admin/progproblems/users'}
          >
            Problem Assignments
          </NavLink>
          <NavLink 
            to="/admin/progproblems/history" 
            icon={<FaHistory className="text-purple-500" />}
            active={path === '/admin/progproblems/history'}
          >
            Problem History
          </NavLink>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">System</h2>
        <div className="space-y-2">
          <NavLink 
            to="/admin/languages" 
            icon={<FaLanguage className="text-indigo-500" />}
            active={path === '/admin/languages'}
          >
            Languages
          </NavLink>
          <NavLink 
            to="/admin" 
            icon={<FaLaptopCode className="text-gray-500" />}
            active={path === '/admin'}
          >
            Dashboard
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar; 