import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import { getTasks, createTask, updateTask, deleteTask } from '../services/progProblemApi';
import api from '../services/api';

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    task_title: '',
    description: '',
    points: 10,
    difficulty: 'easy',
    time: 15,
    sample_test_cases: JSON.stringify({ input: '', output: '' }),
    evaluation_criteria: JSON.stringify([
      { name: 'Correctness', weight: 60 },
      { name: 'Efficiency', weight: 20 },
      { name: 'Code Quality', weight: 20 }
    ]),
    language_id: 3 // Default to JavaScript
  });

  // Available difficulty levels
  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  // Available languages (fetch from backend in real implementation)
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    // Fetch tasks and languages when component mounts
    fetchLanguages().then(() => {
      fetchTasks();
    });
    
    // Set up socket connection for real-time updates (if needed)
    return () => {
      // Clean up socket connection if needed
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks();
      setTasks(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      // const response = await fetch('http://localhost:8000/api/langages');
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch languages: ${response.statusText}`);
      // }
      // const data = await response.json();
      // setLanguages(data);
      // return data; // Return the data for promise chaining
          const { data } = await api.get('/api/langages/');
   setLanguages(data);
    return data;
    } catch (err) {
      console.error('Error fetching languages:', err);
      setError('Failed to load programming languages. Please try refreshing the page.');
      return []; // Return empty array to avoid breaking the chain
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleTestCasesChange = (e) => {
    try {
      // Validate it can be parsed as JSON
      JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        sample_test_cases: e.target.value
      }));
    } catch (err) {
      // If invalid JSON, don't update the state
      console.error('Invalid JSON for test cases');
    }
  };

  const handleEvaluationCriteriaChange = (e) => {
    try {
      // Validate it can be parsed as JSON
      JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        evaluation_criteria: e.target.value
      }));
    } catch (err) {
      // If invalid JSON, don't update the state
      console.error('Invalid JSON for evaluation criteria');
    }
  };

  const openModal = (task = null) => {
    if (task) {
      // Edit existing task
      setCurrentTask(task);
      
      // Handle sampleTestCases - could be string, object, or array
      let sampleTestCasesStr;
      if (typeof task.sampleTestCases === 'string') {
        try {
          // Check if it's already valid JSON
          JSON.parse(task.sampleTestCases);
          sampleTestCasesStr = task.sampleTestCases;
        } catch (e) {
          // If not valid JSON, wrap it
          sampleTestCasesStr = JSON.stringify({ input: task.sampleTestCases, output: '' });
        }
      } else if (task.sampleTestCases) {
        // If it's an object/array, stringify it
        sampleTestCasesStr = JSON.stringify(task.sampleTestCases);
      } else {
        // Default empty test case
        sampleTestCasesStr = JSON.stringify({ input: '', output: '' });
      }
      
      // Handle evaluationCriteria - could be string, object, or array
      let evaluationCriteriaStr;
      if (typeof task.evaluationCriteria === 'string') {
        try {
          // Check if it's already valid JSON
          JSON.parse(task.evaluationCriteria);
          evaluationCriteriaStr = task.evaluationCriteria;
        } catch (e) {
          // If not valid JSON, create default
          evaluationCriteriaStr = JSON.stringify([{ name: 'Correctness', weight: 100 }]);
        }
      } else if (task.evaluationCriteria) {
        // If it's an object/array, stringify it
        evaluationCriteriaStr = JSON.stringify(task.evaluationCriteria);
      } else {
        // Default criteria
        evaluationCriteriaStr = JSON.stringify([{ name: 'Correctness', weight: 100 }]);
      }
      
      setFormData({
        task_title: task.task_title || '',
        description: task.description || '',
        points: task.points || 10,
        difficulty: task.difficulty || 'easy',
        time: task.time || 15,
        sample_test_cases: sampleTestCasesStr,
        evaluation_criteria: evaluationCriteriaStr,
        language_id: task.language_id || (languages.length > 0 ? languages[0].id : null)
      });
    } else {
      // Create new task
      setCurrentTask(null);
      setFormData({
        task_title: '',
        description: '',
        points: 10,
        difficulty: 'easy',
        time: 15,
        sample_test_cases: JSON.stringify({ input: '', output: '' }),
        evaluation_criteria: JSON.stringify([
          { name: 'Correctness', weight: 60 },
          { name: 'Efficiency', weight: 20 },
          { name: 'Code Quality', weight: 20 }
        ]),
        language_id: languages.length > 0 ? languages[0].id : null
      });
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask(null);
  };

  const validateForm = () => {
    // Check for required fields
    if (!formData.task_title || !formData.description || !formData.language_id) {
      setError('Please fill in all required fields, including language selection.');
      return false;
    }
    
    try {
      // Ensure sample_test_cases is valid JSON
      JSON.parse(formData.sample_test_cases);
      
      // Ensure evaluation_criteria is valid JSON
      const criteria = JSON.parse(formData.evaluation_criteria);
      
      // Check that criteria weights sum to 100
      const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      if (totalWeight !== 100) {
        setError('Evaluation criteria weights must sum to 100.');
        return false;
      }
      
      // Verify language exists
      const languageExists = languages.some(lang => lang.id === parseInt(formData.language_id));
      if (!languageExists) {
        setError('Please select a valid programming language.');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Please ensure all JSON fields are valid.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Prepare a clean data object with exact keys that backend expects
      const taskData = {
        task_title: formData.task_title,
        description: formData.description,
        points: parseInt(formData.points),
        difficulty: formData.difficulty,
        time: parseInt(formData.time),
        language_id: parseInt(formData.language_id),
        sampleTestCases: JSON.parse(formData.sample_test_cases),
        evaluationCriteria: JSON.parse(formData.evaluation_criteria),
        modelSolution: "// Sample solution will be provided"
      };
      
      console.log('Submitting task data:', taskData);
      
      if (currentTask) {
        // Update existing task
        await updateTask(null, currentTask.id, taskData);
      } else {
        // Create new task
        await createTask(null, taskData);
      }
      
      fetchTasks();
      closeModal();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteTask(null, id);
      fetchTasks();
    } catch (err) {
      setError(
        `The task ${id} cannot be deleted because it is associated with programming problems.`
      );
    }
  };

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Task Management
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className="bg-[#006674] hover:bg-[#00525d] text-white py-2 px-4 rounded-lg flex items-center gap-2 shadow-md"
            >
              <FaPlus className="text-sm" />
              Create Task
            </motion.button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <p>{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-700 hover:text-red-900"
              >
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006674]"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-xl text-gray-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (min)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {task.task_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800' 
                            : task.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {languages.find(lang => lang.id === task.language_id)?.nom || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => openModal(task)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentTask ? 'Edit Task' : 'Create New Task'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="task_title"
                      value={formData.task_title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {difficultyLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="points"
                      value={formData.points}
                      onChange={handleChange}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="language_id"
                      value={formData.language_id}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {languages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sample Test Cases (JSON) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="sample_test_cases"
                      value={formData.sample_test_cases}
                      onChange={handleTestCasesChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Format: {"{ \"input\": \"...\", \"output\": \"...\" }"}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evaluation Criteria (JSON) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="evaluation_criteria"
                      value={formData.evaluation_criteria}
                      onChange={handleEvaluationCriteriaChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Format: {"[{ \"name\": \"Correctness\", \"weight\": 60 }, ...]"} - Weights must sum to 100
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#006674] hover:bg-[#00525d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {currentTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
} 