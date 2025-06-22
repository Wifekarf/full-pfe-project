import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaTrash, FaExclamationTriangle, FaSearch, FaArrowLeft } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ProblemToUser() {
  const [progProblems, setProgProblems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/prog-problems/');
      setProgProblems(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users/users');
      setAllUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (!selectedProblem) {
      return;
    }

    const fetchAssignedUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/prog-problems/${selectedProblem}/assigned-users`);
        const affectedUsers = response.data;

        const assigned = affectedUsers;
        const unassigned = allUsers.filter(
          (user) => !assigned.some((assignedUser) => assignedUser.id === user.id)
        );

        setAssignedUsers(assigned);
        setUnassignedUsers(unassigned);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assigned users.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedUsers();
  }, [selectedProblem, allUsers]);

  const handleAssignUser = async (user) => {
    try {
      await api.post('/prog-actions/assign-problem', {
        userId: user.id,
        progProblemId: selectedProblem,
      });

      setAssignedUsers([...assignedUsers, user]);
      setUnassignedUsers(unassignedUsers.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign user to problem.');
    }
  };

  const handleUnassignUser = async (user) => {
    try {
      await api.post('/prog-actions/unassign-problem', {
        userId: user.id,
        progProblemId: selectedProblem,
      });

      setUnassignedUsers([...unassignedUsers, user]);
      setAssignedUsers(assignedUsers.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign user from problem.');
    }
  };

  const handleAssignAll = async () => {
    try {
      await Promise.all(
        filteredUnassignedUsers.map((user) =>
          api.post('/prog-actions/assign-problem', {
            userId: user.id,
            progProblemId: selectedProblem,
          })
        )
      );

      setAssignedUsers([...assignedUsers, ...filteredUnassignedUsers]);
      setUnassignedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign all users to problem.');
    }
  };

  const handleUnassignAll = async () => {
    try {
      await Promise.all(
        assignedUsers.map((user) =>
          api.post('/prog-actions/unassign-problem', {
            userId: user.id,
            progProblemId: selectedProblem,
          })
        )
      );

      setUnassignedUsers([...unassignedUsers, ...assignedUsers]);
      setAssignedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign all users from problem.');
    }
  };

  const goBack = () => {
    navigate('/admin/progproblems');
  };

  const filteredUnassignedUsers = unassignedUsers.filter((user) =>
    (user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
     user.email?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const formatDifficulty = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center text-[#006674] hover:text-[#00525d] mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Programming Problems
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Assign Users to Programming Problems
          </h1>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center"
            >
              <FaExclamationTriangle className="mr-2" />
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-700 hover:text-red-900"
              >
                &times;
              </button>
            </motion.div>
          )}

          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              Select Programming Problem:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {progProblems.map((problem) => (
                <motion.div
                  key={problem.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProblem(problem.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedProblem === problem.id
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-white hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-800">{problem.title}</h3>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600 mr-2">Difficulty: {formatDifficulty(problem.difficulty)}</span>
                    <span className="text-sm text-gray-600">Points: {problem.points_total}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedProblem && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {progProblems.find((p) => p.id === selectedProblem)?.title}
                </h2>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAssignAll}
                    disabled={filteredUnassignedUsers.length === 0}
                    className={`px-4 py-2 rounded text-sm flex items-center ${
                      filteredUnassignedUsers.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    Assign All Filtered
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUnassignAll}
                    disabled={assignedUsers.length === 0}
                    className={`px-4 py-2 rounded text-sm flex items-center ${
                      assignedUsers.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    Unassign All
                  </motion.button>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <FaSearch className="text-gray-400" />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006674]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-800">
                      Unassigned Users ({filteredUnassignedUsers.length})
                    </h3>
                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                      {filteredUnassignedUsers.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {filteredUnassignedUsers.map((user) => (
                            <motion.li
                              key={user.id}
                              whileHover={{ backgroundColor: "#f3f9ff" }}
                              className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                              onClick={() => handleAssignUser(user)}
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  {user.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                              <motion.span
                                whileHover={{ scale: 1.1 }}
                                className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium"
                              >
                                Assign
                              </motion.span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No unassigned users found
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-800">
                      Assigned Users ({assignedUsers.length})
                    </h3>
                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                      {assignedUsers.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {assignedUsers.map((user) => (
                            <motion.li
                              key={user.id}
                              whileHover={{ backgroundColor: "#fff5f5" }}
                              className="p-3 hover:bg-red-50 cursor-pointer flex justify-between items-center"
                              onClick={() => handleUnassignUser(user)}
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  {user.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {user.email}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Status: {user.status || "Pending"}
                                </p>
                              </div>
                              <motion.span
                                whileHover={{ scale: 1.1 }}
                                className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium"
                              >
                                Unassign
                              </motion.span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No assigned users yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
} 