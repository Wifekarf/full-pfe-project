# Quiz Platform – Fullstack Project

This is a fullstack web application built with **Symfony (backend)** and **React (frontend)** designed for managing technical quizzes and coding problem assessments. It supports user roles like Admin,  Team Manager, Guest,and User.

---

## 🌐 Technologies Used

- **Backend**: PHP 8, Symfony 6, Doctrine ORM, JWT Authentication (LexikJWTAuthenticationBundle), MySQL
- **Frontend**: React, Tailwind CSS, Axios, React Router, Framer Motion
- **Containerization**: Docker, Docker Compose
- **Authentication**: JWT-based login system
- **Dev Tools**: Symfony CLI, Vite, Git

---

## 📁 Project Structure

```
/full-pfe-project/
│
├── backend/              # Symfony backend
│   ├── src/
│   ├── config/
│   ├── public/
│   ├── .env
│   └── Dockerfile
│
├── frontend/             # React frontend
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Running the Project (Dockerized)

### 1. Clone the Repository

```bash
git clone https://github.com/Wifekarf/full-pfe-project.git
cd full-pfe-project
```

### 2. Update `.env` File in Backend

Make sure the database credentials in `/backend/.env` match the ones defined in `docker-compose.yml`.

```bash
DATABASE_URL="mysql://root@127.0.0.1:3306/quizapp?serverVersion=9.1&charset=utf8mb4"
```

### 3. Start Docker Containers

```bash
docker-compose up --build
```

### 4. Access the Services

- Symfony Backend: [http://localhost:8000](http://localhost:8000)
- React Frontend: [http://localhost:5173](http://localhost:5173)
- MySQL: port 3306

### 5. Run Symfony Commands(optional)

After the container is ready, execute into the backend container:

```bash
docker exec -it backend sh
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load
```

---

## 🔑 Login Roles

- **Admin**: `wifek.arfaoui@esprit.tn / wifek123`
- **Team Manager**: `aziz@gmail.Com / aziz123`
- **User**: `taha@gmail.com / taha123`

---

## ✅ Core Features

- Admin Panel (add languages, questions,quizzes ,problems,tasks ,  assign quizzes , assign question , assign tasks , assign problems, create teams, assign users to managers)

- Team Manager (manage their team, assign quizzes)
- Users (take quizzes and solve problems)
- JWT login and role-based access
- Invitation by email (guest code access)
- History tracking and statistics


---

## 🛠️ Future Improvements

- Add real-time leaderboard
- Add chat support during quizzes
- Auto AI-problem solving correction 
- Add timer and quiz expiration


---

## 📦 Useful Commands

### Backend (from `/backend` folder)
```bash
cd backend fin
composer install
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
symfony server:start
```

### Frontend (from `/frontend` folder)
```bash
cd QuizFront
npm install
npm run dev
```

---

## 👨‍💻 Author

Developed by **Arfaoui Wifek** – Final Year Engineering Project (PFE) 2025
