// src/pages/QuizGuest.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import api from "../services/api"; // ← your axios instance
//import { useSearchParams } from "react-router-dom";

export default function QuizGuest() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
//const [searchParams] = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") || "");
  const navigate = useNavigate();

  // quiz data & loading
  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [quizCompleted, setQuizCompleted] = useState(false);

  // voice recognition
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceAnswer, setVoiceAnswer] = useState("");

  // 1) on mount: verify code → fetch questions
  useEffect(() => {
    (async () => {
      try {
        console.log("Code extrait de l'URL:", code); // debug
  
        const {
          data: { id },
        } = await api.post('/api/quizzes/verify-code', { code });
  
        console.log("Quiz ID reçu de l'API :", id); // debug
  
        setQuizId(id); // ← important si tu veux l’utiliser plus tard
  
        const { data: qs } = await api.get(`/api/quizzes/${id}/questions`)
        setQuestions(qs);
  
        if (qs.length) {
          setTimeLeft(qs[0].time);
        }
      } catch (err) {
        console.error("Erreur Axios:", err);
        alert(err.response?.data?.error || "Code invalide");
        navigate("/join", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [code, navigate]);
  

  // 2) timer tick
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
    if (!loading && timeLeft === 0) {
      handleNext();
    }
  }, [loading, timeLeft]);

  // 3) voice setup
  useEffect(() => {
    if ("webkitSpeechRecognition" in window && questions.length) {
      const SR = window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "fr-FR";
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setVoiceAnswer(transcript);
        const match = questions[currentIdx]?.options.find(
          (opt) =>
            opt.toLowerCase().includes(transcript.toLowerCase()) ||
            transcript.toLowerCase().includes(opt.toLowerCase())
        );
        if (match) setSelectedOption(match);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [currentIdx, questions]);

  // 4) update confetti on resize
  useEffect(() => {
    const onResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleVoice = () => {
    if (!isListening) {
      setVoiceAnswer("");
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleNext = () => {
    const q = questions[currentIdx];
    const correct = selectedOption === q.correctAnswer;
    setUserAnswers((ans) => [
      ...ans,
      { ...q, isCorrect: correct, given: selectedOption, timeLeft },
    ]);
    if (correct) setScore((s) => s + q.points);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setTimeLeft(questions[currentIdx + 1].time);
    } else {
      setQuizCompleted(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60),
      s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ——— RENDER ———

  // loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement du quiz…</p>
      </div>
    );
  }

  // quiz complete
  if (quizCompleted) {

    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const percent = Math.round((score / totalPoints) * 100);
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Confetti {...windowSize} recycle={false} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden w-full"
        >
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
              <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Quiz terminé !</h2>
            <p className="mt-2 text-gray-600">Merci d’avoir participé à ce quiz.</p>
  
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Score</h3>
                <p className="text-2xl font-bold text-blue-600">{score}/{totalPoints}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Bonnes réponses</h3>
                <p className="text-2xl font-bold text-purple-600">{correctCount}/{questions.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Performance</h3>
                <p className="text-2xl font-bold text-green-600">{percent}%</p>
              </div>
            </div>
  
            <div className="mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-md transition duration-150"
              >
                Retour à l'accueil
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  

  // running quiz
  const q = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {showConfetti && <Confetti {...windowSize} recycle={false} />}
  
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-sm text-gray-500">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <h2 className="text-xl font-bold text-gray-800">Quiz invité</h2>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-red-500">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
  
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <motion.div
            className="bg-blue-600 h-2.5 rounded-full"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
  
        {/* Question */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{q.question}</h3>
          <div className="space-y-3">
            {q.options.map((option, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOption(option)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedOption === option
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedOption === option
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {selectedOption === option && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
  
        {/* Voice recognition */}
        <div className="flex justify-between items-center mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleVoice}
            className={`px-4 py-2 rounded-lg font-medium ${
              isListening
                ? "bg-red-500 text-white"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {isListening ? "Arrêter" : "Parler"}
          </motion.button>
          {voiceAnswer && (
            <p className="text-sm text-gray-500">
              Vous avez dit : <em>"{voiceAnswer}"</em>
            </p>
          )}
        </div>
  
        {/* Next button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-6 py-2 rounded-lg font-medium ${
              selectedOption
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {currentIdx === questions.length - 1 ? "Terminer" : "Suivant"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
  
}
