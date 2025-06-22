import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from "../../Layout/AuthLayout";
import api from "../../services/api";
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { saveQuizSubmission } from '../../services/historyService';

const PlayQuiz = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [showQuizList, setShowQuizList] = useState(true);
    const [completedQuizzes, setCompletedQuizzes] = useState([]);

    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await api.post('/actions/get-affected-quiz-by-user', { userId: parseInt(user.id) });
                setQuizzes(response.data.quizzes);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [user.id]);

    const startQuiz = async (index = currentQuizIndex) => {
        if (quizzes.length > 0) {
            try {
                // Appel API pour mettre à jour le statut et incrémenter numberPassed
                await api.post('/actions/start-quiz', {
                    userId: user.id,
                    quizId: quizzes[index].quiz.id
                });
    
                // Initialisation du quiz
                setCurrentQuizIndex(index);
                const firstQuestionTime = quizzes[index].quiz.questions[0].time;
                setTimeLeft(firstQuestionTime > 0 ? firstQuestionTime : null);
                setQuizStarted(true);
                setShowQuizList(false);
                setQuizCompleted(false);
            } catch (err) {
                setError("Failed to start quiz. Please try again.");
                console.error('Error starting quiz:', err);
            }
        }
    };

    useEffect(() => {
        let timer;
        if (quizStarted && !quizCompleted && timeLeft !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleNextQuestion();
        }
        return () => clearInterval(timer);
    }, [quizStarted, quizCompleted, timeLeft]);

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const handleNextQuestion = () => {
        if (quizzes.length === 0) return;

        const currentQuiz = quizzes[currentQuizIndex].quiz;
        const currentQuestion = currentQuiz.questions[currentQuestionIndex];

        // Save user answer
        const newAnswer = {
            reponse: selectedOption,
            question: currentQuestion.question,
            time_user_quest: currentQuestion.time - (timeLeft || 0)
        };

        setUserAnswers([...userAnswers, newAnswer]);

        // Calculate score if answer is correct
        if (selectedOption === currentQuestion.correctAnswer) {
            setScore(prev => prev + currentQuestion.points);
        }

        // Move to next question or complete quiz
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            const nextQuestionTime = currentQuiz.questions[currentQuestionIndex + 1].time;
            setTimeLeft(nextQuestionTime > 0 ? nextQuestionTime : null);
            setSelectedOption(null);
        } else {
            completeQuiz();
        }
    };

    const completeQuiz = async () => {
        setQuizCompleted(true);
        setShowConfetti(true);

        const currentQuiz = quizzes[currentQuizIndex].quiz;
        
        // Add quiz to completed list
        setCompletedQuizzes(prev => [...prev, currentQuiz.id]);

        const correctAnswersCount = userAnswers.filter(
            (answer, index) => answer.reponse === currentQuiz.questions[index].correctAnswer
        ).length + (selectedOption === currentQuiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0);

        // Create submission data
        const submissionData = {
            userId: parseInt(user.id),
            quizId: currentQuiz.id,
            scorePoints: score + (selectedOption === currentQuiz.questions[currentQuestionIndex].correctAnswer
                ? currentQuiz.questions[currentQuestionIndex].points
                : 0),
            correctAnswers: correctAnswersCount,
            userAnswer: [
                ...userAnswers,
                {
                    reponse: selectedOption,
                    question: currentQuiz.questions[currentQuestionIndex].question,
                    time_user_quest: currentQuiz.questions[currentQuestionIndex].time - (timeLeft || 0)
                }
            ],
            dateCreation: new Date().toISOString(),
            quiz: currentQuiz
        };

        try {
            // Submit to server
            const response = await api.post('/actions/create-history', {
                userId: parseInt(user.id),
                quizId: currentQuiz.id,
                scorePoints: submissionData.scorePoints,
                correctAnswers: correctAnswersCount,
                userAnswer: submissionData.userAnswer
            });
            
            if (response.data && response.data.historyId) {
                // If server submission successful, add ID to the data
                submissionData.id = response.data.historyId;
            }
        } catch (err) {
            console.error('Error saving quiz results to server:', err);
        }

        // Save locally regardless of server response
        saveQuizSubmission(submissionData);

        setTimeout(() => setShowConfetti(false), 5000);
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setUserAnswers([]);
        setQuizStarted(false);
        setQuizCompleted(false);
        setScore(0);
        const firstQuestionTime = quizzes[currentQuizIndex].quiz.questions[0].time;
        setTimeLeft(firstQuestionTime > 0 ? firstQuestionTime : null);
    };

    const backToQuizList = () => {
        setQuizStarted(false);
        setQuizCompleted(false);
        setShowQuizList(true);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setUserAnswers([]);
        setScore(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) {
        return (
            <AuthLayout>
                <div className="flex justify-center items-center h-screen">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                    />
                </div>
            </AuthLayout>
        );
    }

    if (error) {
        return (
            <AuthLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        Error: {error}
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (quizzes.length === 0) {
        return (
          <AuthLayout>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center"
              >
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-4">
                  <svg 
                    className="h-10 w-10 text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Aucun quiz disponible pour le moment
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Vous n'avez actuellement aucun quiz attribué. Revenez plus tard ou contactez votre administrateur pour obtenir de nouveaux défis !
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/home')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg 
                    className="-ml-1 mr-3 h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  Retour à l'accueil
                </motion.button>
              </motion.div>
            </div>
          </AuthLayout>
        );
      }
    const currentQuiz = quizzes[currentQuizIndex]?.quiz;
    const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
    const progress = currentQuiz ? ((currentQuestionIndex) / currentQuiz.questions.length) * 100 : 0;

    return (
        <AuthLayout>
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                />
            )}

            <div className="pt-29 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                {/* Quiz List */}
                {showQuizList && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-6xl mx-auto"
                    >
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Vos Quiz Disponibles</h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes
                                .filter(quizData => !completedQuizzes.includes(quizData.quiz.id))
                                .map((quizData, index) => {
                                    const quiz = quizData.quiz;
                                    const language = quiz.questions[0]?.language || { name: 'Général', color: '#ccc', icon: '' };

                                    return (
                                        <motion.div
                                            key={quiz.id}
                                            whileHover={{ y: -5 }}
                                            className="bg-white rounded-xl shadow-md overflow-hidden"
                                        >
                                            <div className="p-6">
                                                <div className="flex items-center space-x-4 mb-4">
                                                    <div
                                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: language.color }}
                                                    >
                                                        {language.icon && (
                                                            <img
                                                                src={language.icon}
                                                                alt={language.name}
                                                                className="w-8 h-8"
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-800">{quiz.name}</h2>
                                                        <p className="text-gray-600">{language.name}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    <div className="bg-blue-50 p-2 rounded-lg">
                                                        <h3 className="text-xs font-medium text-blue-800">Questions</h3>
                                                        <p className="text-lg font-bold text-blue-600">{quiz.totalQuestions}</p>
                                                    </div>
                                                    <div className="bg-purple-50 p-2 rounded-lg">
                                                        <h3 className="text-xs font-medium text-purple-800">Points</h3>
                                                        <p className="text-lg font-bold text-purple-600">{quiz.totalPoints}</p>
                                                    </div>
                                                    <div className="bg-green-50 p-2 rounded-lg">
                                                        <h3 className="text-xs font-medium text-green-800">Difficulté</h3>
                                                        <p className="text-lg font-bold text-green-600 capitalize">
                                                            {quiz.questions.reduce((acc, question) => {
                                                                if (question.difficulty === 'difficile') return 'Difficile';
                                                                if (question.difficulty === 'moyen') return 'Moyen';
                                                                return acc || 'Facile';
                                                            }, '')}
                                                        </p>
                                                    </div>
                                                    <div className="bg-yellow-50 p-2 rounded-lg">
                                                        <h3 className="text-xs font-medium text-yellow-800">Temps</h3>
                                                        <p className="text-lg font-bold text-yellow-600">
                                                            {quiz.questions.reduce((total, q) => total + (q.time || 0), 0)}s
                                                        </p>
                                                    </div>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => startQuiz(index)}
                                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-150"
                                                >
                                                    Commencer
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                        </div>


                    </motion.div>
                )}

                {/* Quiz Started */}
                {quizStarted && !quizCompleted && currentQuiz && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</span>
                                    <h2 className="text-xl font-bold text-gray-800">{currentQuiz.name}</h2>
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

                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                                <motion.div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    initial={{ width: `${progress}%` }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-8">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">{currentQuestion.question}</h3>
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option, index) => (
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={index}
                                                onClick={() => handleOptionSelect(option)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedOption === option
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${selectedOption === option
                                                            ? 'border-blue-500 bg-blue-500'
                                                            : 'border-gray-300'
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

                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Difficulty: <span className="font-medium capitalize">{currentQuestion.difficulty}</span> •
                                        Points: <span className="font-medium">{currentQuestion.points}</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleNextQuestion}
                                        disabled={!selectedOption}
                                        className={`px-6 py-2 rounded-lg font-medium ${selectedOption
                                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* Quiz Completed */}
                {quizCompleted && currentQuiz && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden"
                    >
                        <div className="p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
                                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Quiz Completed!</h2>
                            <p className="mt-2 text-gray-600">You've finished {currentQuiz.name}</p>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-blue-800">Your Score</h3>
                                    <p className="text-2xl font-bold text-blue-600">{score}/{currentQuiz.totalPoints}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-purple-800">Correct Answers</h3>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {
                                            userAnswers.filter(answer =>
                                                currentQuiz.questions.some(q =>
                                                    q.question === answer.question && q.correctAnswer === answer.reponse
                                                )
                                            ).length + (selectedOption === currentQuestion.correctAnswer ? 1 : 0)
                                        }/{currentQuiz.questions.length}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-green-800">Performance</h3>
                                    <p className="text-2xl font-bold text-green-600">
                                        {Math.round((score / currentQuiz.totalPoints) * 100)}%
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={backToQuizList}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-md transition duration-150"
                                >
                                    Back to Quiz List
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AuthLayout>
    );
};

export default PlayQuiz;