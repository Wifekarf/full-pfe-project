import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './User/Home.jsx';
import AdminHome from './Admin/Home.jsx';
import Welcome from './Welcome.jsx';
import LoginPage from './Auth/Login.jsx';
import RegisterPage from './Auth/Register.jsx';
import Profile from './Profile/Profile.jsx';
import Language from './Language/Index.jsx';
import Quiz from './Quiz/Quiz.jsx';
import Questions from './Question/Questions.jsx';
import Affectation from './Quiz/Affectation.jsx';
import AffUser from './Quiz/AffUser.jsx';
import Index from './Historique/Index.jsx';
import PlayQuiz from './User/PlayQuiz/PlayQuiz.jsx';
import JoinPage from './CodeGeust/JoinPage.jsx';
import QuizGuest from './CodeGeust/QuizGuest.jsx';
import PlayProgrammingProblem from './User/PlayProgrammingProblem.jsx';

// Import ProgProblem components
import ProgProblem from './ProgProblem/ProgProblem.jsx';
import TaskManagement from './ProgProblem/Task.jsx'; // New Task management component
import TaskToProblem from './ProgProblem/TaskToProblem.jsx'; // New Task-to-Problem assignment component
import ProblemToUser from './ProgProblem/ProblemToUser.jsx'; // New Problem-to-User assignment component
import JoinProblem from './ProgProblem/JoinProblem.jsx';
import SolveProblem from './ProgProblem/SolveProblem.jsx';
import TeamsManagement from './TeamManagement/TeamManagement.jsx';
import TeamManagerDashboard from './TeamManagement/TeamManagementDashboard.jsx';
import RHManagerManagement from './Admin/RHManagerManagement.jsx';
import ManageUsers from './Admin/ManageUsers.jsx';
import TeamScores from './pages/TeamScores.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />}/>
        <Route path="Home" element={<Home />}/>
        <Route path="play" element={<PlayQuiz />}/>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<Profile />}/>
        <Route path="join" element={<JoinPage />}/>
        <Route path="quizguest/:code" element={<QuizGuest />} />
        <Route path="/quizguest" element={<QuizGuest />} />
        <Route path="/quizzes/:id/questions" element={<Questions />} />
        <Route path="/admin/quizzes/:quizId/questions" element={<Questions />} />
        <Route path="historique" element={<Index />} />

        {/* Team Manager routes */}
        <Route path="team-manager" element={<TeamManagerDashboard />} />

        {/* Admin Group Routes */}
        <Route path="admin">
          <Route index element={<AdminHome />} />
          <Route path="languages" element={<Language />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="quiz/questions" element={<Affectation />} />
          <Route path="quiz/users" element={<AffUser />} />
          <Route path="questions" element={<Questions />} />
          <Route path="historique" element={<Index />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="teams" element={<TeamsManagement />} />
          
          
          {/* Programming Problem Routes */}
          <Route path="progproblems" element={<ProgProblem />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="progproblems/tasks" element={<TaskToProblem />} />
          <Route path="progproblems/users" element={<ProblemToUser />} />
          <Route path="progproblems/assign" element={<ProblemToUser />} />
          <Route path="progproblems/history" element={<Index />} />
          {/* RH Management Routes */}
          <Route path="rh-managers" element={<RHManagerManagement />} />
        </Route>
        
        {/* Programming Problem User Routes */}
        <Route path="programming-problems" element={<PlayProgrammingProblem />} />
        <Route path="solve-problem/:code" element={<SolveProblem />} />
        <Route path="join-coding" element={<JoinProblem />} />
        {/* RH Manager routes */}
        <Route path="rh">
          <Route path="teams" element={<TeamsManagement />} />
        </Route>
        <Route path="team-scores" element={<TeamScores />} />

        

      </Routes>
    </BrowserRouter>
  </StrictMode>
)
