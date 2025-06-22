import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import AuthLayout from "../Layout/AuthLayout";
import "./Ques.css";
import Select from 'react-select';
//import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [filters, setFilters] = useState({
    languages: [],
    difficulty: "all",
    search: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    difficulty: "facile",
    language_id: "",
    points: 5,
    time: 30
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { id: quizIdFromURL } = useParams();


  console.log("quizIdFromURL:", quizIdFromURL);

  // const fetchQuestions = async () => {
  //   try {
  //     const response = await api.get("/api/questions");
  //     setQuestions(response.data);
  //   } catch (error) {
  //     console.error("Error fetching questions:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchQuestions();
  // }, []);
  useEffect(() => {
      setLoading(true);

  Promise.all([
    api.get("/api/questions"),
    api.get("/api/langages")
  ])
    .then(([qRes, langRes]) => {
      setQuestions(qRes.data);
      setLanguages(langRes.data);
    })
    .catch(err => {
      console.error("Error loading data:", err);
      setError("Failed to load questions or languages.");
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);


  useEffect(() => {
    let result = [...questions];

    if (filters.languages.length > 0) {
      result = result.filter(q =>
        q.language && filters.languages.includes(q.language.id.toString())
      );
    }

    if (filters.difficulty !== "all") {
      result = result.filter(q => q.difficulty === filters.difficulty);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(q =>
        q.question.toLowerCase().includes(searchTerm) ||
        q.options.some(opt => opt.toLowerCase().includes(searchTerm))
      );
    }

    console.log("Filtered Questions:", result);
    setFilteredQuestions(result);
  }, [questions, filters]);


  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle option changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  // Create or Update question
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/questions", formData);
      setFormData({ question: "", options: ["", "", "", ""], correctAnswer: 0 });
      fetchQuestions();
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  // Edit question
  const handleEdit = (question) => {
    setFormData({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      language_id: question.language.id,
      points: question.points,
      time: question.time // ⏱️ Ajout du temps

    });
    setEditingId(question.id);
    setIsModalOpen(true);
  };

  // Delete question
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      difficulty: "facile",
      language_id: "",
      points: 5,
      time: 30 // Valeur par défaut

    });
    setEditingId(null);
  };

  // Open modal for creating new question
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Fonction pour convertir les secondes en format minutes:secondes
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Questions</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              Add Question
            </motion.button>
          </div>

          {/* Filters Section */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Language Filter */}
              {/* Language Filter - Version avec react-select */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Filter by Languages
                </label>
                <Select
                  isMulti
                  options={languages.map(lang => ({
                    value: lang.id.toString(),
                    label: (
                      <div className="flex items-center">
                        {lang.icon && (
                          <img
                            src={lang.icon}
                            alt={lang.nom}
                            className="w-4 h-4 mr-2 rounded-full"
                            style={{ backgroundColor: lang.color }}
                          />
                        )}
                        {lang.nom}
                      </div>
                    ),
                    id: lang.id,
                    icon: lang.icon,
                    color: lang.color
                  }))}
                  value={filters.languages.map(langId => {
                    const lang = languages.find(l => l.id.toString() === langId);
                    return lang ? {
                      value: lang.id.toString(),
                      label: (
                        <div className="flex items-center">
                          {lang.icon && (
                            <img
                              src={lang.icon}
                              alt={lang.nom}
                              className="w-4 h-4 mr-2 rounded-full"
                              style={{ backgroundColor: lang.color }}
                            />
                          )}
                          {lang.nom}
                        </div>
                      )
                    } : null;
                  }).filter(Boolean)}
                  onChange={(selectedOptions) => {
                    setFilters(prev => ({
                      ...prev,
                      languages: selectedOptions.map(option => option.value)
                    }));
                  }}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select languages..."
                  closeMenuOnSelect={false}
                  components={{
                    Option: ({ innerProps, label, data, isSelected }) => (
                      <div
                        {...innerProps}
                        className={`flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer ${isSelected ? 'bg-blue-100' : ''}`}
                      >
                        {data.icon && (
                          <img
                            src={data.icon}
                            alt=""
                            className="w-4 h-4 mr-2 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                        )}
                        {data.label.props.children[1]}
                      </div>
                    ),
                    MultiValueLabel: ({ data }) => (
                      <div className="flex items-center">
                        {data.icon && (
                          <img
                            src={data.icon}
                            alt=""
                            className="w-3 h-3 mr-1 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                        )}
                        {data.label.props.children[1]}
                      </div>
                    )
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.25rem',
                      minHeight: '46px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      },
                      '&:focus-within': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#EFF6FF',
                      borderRadius: '9999px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#1E40AF',
                      padding: '0 0.5rem'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#1E40AF',
                      ':hover': {
                        backgroundColor: '#DBEAFE',
                        color: '#1E3A8A'
                      }
                    })
                  }}
                />
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Filter by Difficulty
                </label>
                <select
                  name="difficulty"
                  value={filters.difficulty}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Search Questions
                </label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search questions or options..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No questions found matching your filters
                  </div>
                ) : (
                  filteredQuestions.map((question) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-xl font-semibold text-gray-800">
                            {question.question}
                          </h2>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${question.difficulty === 'facile'
                              ? 'bg-green-100 text-green-800'
                              : question.difficulty === 'moyen'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {question.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {question.points} pts
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {formatTime(question.time)}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-500 text-sm mb-1">Options:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {question.options.map((option, index) => (
                              <li
                                key={index}
                                className={`${option === question.correctAnswer ? 'font-bold text-green-600' : 'text-gray-700'}`}
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {question.language?.icon && (
                              <img
                                src={question.language.icon}
                                alt={`${question.language.nom} icon`}
                                className="w-6 h-6 mr-2"
                                style={{ backgroundColor: question.language.color }}
                              />
                            )}
                            <span className="text-gray-600">
                              {question.language?.nom || 'No language'}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(question)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(question.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {editingId ? "Edit Question" : "Add New Question"}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label
                        htmlFor="question"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Question
                      </label>
                      <input
                        type="text"
                        id="question"
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        Options (at least 2 required)
                      </label>
                      {formData.options.map((option, index) => (
                        <div key={index} className="mb-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="correctOption"
                              checked={option === formData.correctAnswer}
                              onChange={() => setFormData(prev => ({
                                ...prev,
                                correctAnswer: option
                              }))}
                              className="mr-2"
                              disabled={option.trim() === ""}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="difficulty"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Difficulty
                        </label>
                        <select
                          id="difficulty"
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="facile">Facile</option>
                          <option value="moyen">Moyen</option>
                          <option value="difficile">Difficile</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="language_id"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Language
                        </label>
                        <select
                          id="language_id"
                          name="language_id"
                          value={formData.language_id}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Language</option>
                          {languages.map((language) => (
                            <option key={language.id} value={language.id}>
                              {language.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="points"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Points
                        </label>
                        <input
                          type="number"
                          id="points"
                          name="points"
                          min="1"
                          value={formData.points}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>


                      <div>
                        <label
                          htmlFor="time"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Time (seconds)
                        </label>
                        <input
                          type="number"
                          id="time"
                          name="time"
                          min="1"
                          value={formData.time}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>



                    </div>

                    <div className="flex justify-end space-x-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {editingId ? "Update" : "Create"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}