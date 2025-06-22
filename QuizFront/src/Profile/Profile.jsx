import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "../Layout/AuthLayout";
import axios from "axios";
import CountUp from "react-countup";
import { format, parseISO, subDays } from "date-fns";
import { saveAs } from "file-saver";
import { debounce } from "lodash";
import { FaUser, FaLock, FaChartLine, FaDownload, FaFileUpload} from "react-icons/fa";
import api from "../services/api";

// Lazy-load recharts…
const LineChart       = lazy(() => import("recharts").then(m => ({ default: m.LineChart })));
const Line            = lazy(() => import("recharts").then(m => ({ default: m.Line })));
const XAxis           = lazy(() => import("recharts").then(m => ({ default: m.XAxis })));
const YAxis           = lazy(() => import("recharts").then(m => ({ default: m.YAxis })));
const Tooltip         = lazy(() => import("recharts").then(m => ({ default: m.Tooltip })));
const Legend          = lazy(() => import("recharts").then(m => ({ default: m.Legend })));
const CartesianGrid   = lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })));
const ResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({
    history: [], quizzesTaken: 0, correctAnswers: 0,
    highestScore: 0, currentStreak: 0, successRate: 0,
  });
  const [animatedRate, setAnimatedRate] = useState(0);
  const [tab, setTab] = useState("profile");
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dateFilter, setDateFilter] = useState("all");
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (storedUser) {
      api.get(`/api/users/getbyid/${storedUser.id}`)
        .then(res => {
          setProfile(res.data);
          
          setForm({ username: res.data.username || "", email: res.data.email || "", password: "" });
          setStats({
            history: res.data.history || [],
            quizzesTaken: res.data.quizzesTaken || 0,
            correctAnswers: res.data.correctAnswers || 0,
            highestScore: res.data.highestScore || 0,
            currentStreak: res.data.currentStreak || 0,
            successRate: 0,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

 const uploadAvatar = async e => {
   const file = e.target.files[0];
   if (!file) return;
   console.log("🖼  uploading avatar:", file);
   const fd = new FormData();
   fd.append("image", file, file.name);
   try {
     const { data } = await api.post("/api/users/upload", fd);
      setProfile(u => ({ ...u, image: data.image }));
     setMsg({ type: "success", text: "Avatar mis à jour !" });
   } catch (err) {
     console.error(err);
     setMsg({ type: "error", text: err.response?.data?.message || "Erreur avatar" });
   }
 };

 const uploadCV = async () => {
  if (!cvFile) return;
  const fd = new FormData();
  fd.append("cv", cvFile, cvFile.name);

    try {
      const { data } = await api.post("/api/users/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile(u => ({ ...u, cv: data.cv }));
    setMsg({ type: "success", text: "CV uploadé !" });
  } catch (err) {
    setMsg({ type: "error", text: err.response?.data?.message || "Erreur CV" });
  }
};

  // Memoized stats…
  const computedStats = useMemo(() => {
    const taken   = stats.quizzesTaken;
    const correct = stats.correctAnswers;
    const rate    = taken ? Math.round((correct / taken) * 100) : 0;
    const formattedHistory = stats.history
      .filter(i => i.date && !isNaN(i.score))
      .map(i => ({
        ...i,
        date: format(parseISO(i.date), "dd/MM/yyyy"),
        formattedScore: i.score,
      }))
      .sort((a,b)=> new Date(b.date)-new Date(a.date));
    const filtered = formattedHistory.filter(i => {
      if (dateFilter==="all") return true;
      const d = parseISO(i.date);
      if (dateFilter==="7days") return d >= subDays(new Date(),7);
      if (dateFilter==="30days") return d >= subDays(new Date(),30);
      return true;
    });
    return { ...stats, successRate: rate, history: filtered };
  }, [stats, dateFilter]);

  // Debounced form update…
  const updateForm = debounce((name,value)=>{
    setForm(prev=>({...prev,[name]:value}));
    if(name==="email" && value && !/\S+@\S+\.\S+/.test(value)){
      setFormErrors(prev=>({...prev,email:"Email invalide"}));
    } else {
      setFormErrors(prev=>({...prev,[name]:""}));
    }
  },300);

  // 2) Animate circular…
  useEffect(()=>{
    if(tab!=="stats") return;
    setAnimatedRate(0);
    const t = setTimeout(()=>setAnimatedRate(computedStats.successRate),300);
    return ()=>clearTimeout(t);
  },[tab,computedStats.successRate]);

  // File input handlers
  const handleImageChange = e=> e.target.files[0] && setImage(e.target.files[0]);
  const handleCvChange    = e=> e.target.files[0] && setCvFile(e.target.files[0]);

  // 3) Main form submit (username/email/password)
  const handleSubmit = async e=>{
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("username", form.username);
      fd.append("email", form.email);
      fd.append("password", form.password);
      // include image+cv in same PUT if desired
      if(image) fd.append("image", image, image.name);
      if(cvFile)    fd.append("cv", cvFile, cvFile.name);

      const res = await api.put(`/api/users/${profile.id}`, fd);
      if(res.status !== 200) throw new Error("Échec de la mise à jour");
      setProfile(res.data);
      setMsg({ type:"success", text:"Profil mis à jour avec succès" });
      setImage(null);
      setCvFile(null);
    } catch(err){
      setMsg({ type:"error", text:err.response?.data?.message||err.message });
    }
  };

  // **4) Separate files-only upload**
  const handleUpload = async ()=>{
    if(!image && !cvFile){
      setMsg({ type:"error", text:"Aucun fichier sélectionné." });
      return;
    }
   const fd = new FormData();
   if(image)   fd.append("image", image, image.name);
   if(cvFile)  fd.append("cv", cvFile, cvFile.name);

    try {
 const { data } = await api.post("/api/users/upload", fd);
      if(data.error) throw new Error(data.error);
      // Merge returned URLs into state
      setProfile(u=>({ ...u, image:data.image, cv:data.cv }));
      setMsg({ type:"success", text:"Fichiers uploadés !" });
      setImage(null);
      setCvFile(null);
    } catch(err){
      setMsg({ type:"error", text:err.response?.data?.message||"Échec de l'upload" });
    }
  };

  // 5) Export stats…
  const exportStats = ()=>{
    const hdr = ["Date","Score","Quiz Title","Category"];
    const rows = computedStats.history.map(i=>[
      i.date,
      i.formattedScore,
      i.quizTitle||"N/A",
      i.category||"N/A"
    ]);
    const csv = [hdr.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv],{ type:"text/csv;charset=utf-8;" });
    saveAs(blob,`stats_${profile.id}.csv`);
  };

  if(!profile) return null;

  const badges = [
    { label:"Débutant", icon:"🥉",   description:"Complétez votre premier quiz" },
    { label:"Expert",    icon:"🎓",   description:"Taux de réussite entre 80 et 90%" },
    { label:"Maitre Expert", icon:"🏆", description:"Taux de réussite > 90%" },
    { label:"Assidu",     icon:"🔥",  description:"Quiz passés pendant 7 jours consécutifs" },
    { label:"Maitre Assidu", icon:"💪",description:"Quiz passés pendant 15 jours consécutifs" },
  ];

  const containerVariants = {
    hidden:{ opacity:0, y:20 },
    visible:{ opacity:1, y:0, transition:{ staggerChildren:0.1, delayChildren:0.2 } }
  };
  const itemVariants = { hidden:{ opacity:0, y:10 }, visible:{ opacity:1, y:0 } };
  return (
    <AuthLayout>
      <div className={`min-h-screen pt-28 px-4 sm:px-6 lg:px-8 ${darkMode ? "dark bg-gray-800" : "bg-gradient-to-br from-cyan-50 to-purple-100"} transition-colors duration-500`}>
        <div className="mx-auto max-w-5xl">
          {/* Dark mode toggle */}
          <motion.div
            className="flex justify-end mb-6"
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </motion.div>


          {/* Tabs */}
          <motion.div
            className="flex space-x-4 border-b border-gray-200 dark:border-gray-600 mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { id: "profile", label: "Mon Profil", icon: <FaUser /> },
              { id: "security", label: "Sécurité", icon: <FaLock /> },
              { id: "stats", label: "Statistiques", icon: <FaChartLine /> },
              { id: "files",    label: "Fichiers",  icon: <FaFileUpload /> },
            ].map((t) => (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                variants={itemVariants}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-lg ${
                  tab === t.id
                    ? "border-b-4 border-cyan-500 dark:text-cyan-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-cyan-500"
                }`}
                aria-current={tab === t.id ? "page" : undefined}
              >
                {t.icon}
                {t.label}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab + darkMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="mt-8"
            >
              {/* Profile Tab */}
              {tab === "profile" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <motion.div
                      className="relative group"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                     <div className="relative h-28 w-28 rounded-full overflow-hidden group">
                      <div className="h-full w-full bg-gradient-to-br from-cyan-400 to-purple-500 p-1">
                        <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-4xl font-semibold text-gray-700 dark:text-gray-200">
                          {profile.image
                          ? <img src={`http://localhost:8000${profile.image}`} alt="avatar" className="object-cover w-full h-full"/>
                            : profile.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      {/* the invisible picker now truly covers the avatar: */}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={uploadAvatar}
                      />
                    </div>
                      <span className="absolute bottom-0 right-0 rounded-full bg-yellow-300 px-2 py-1 text-xs font-semibold text-gray-800">
                        {(Array.isArray(profile.role) ? profile.role[0] : profile.role || "").replace("ROLE_", "")}
                      </span>
                    </motion.div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{profile.username}</h2>
                      <p className="text-gray-600 dark:text-gray-300 text-lg">{profile.email}</p>
                      <motion.div
                        className="mt-6 flex flex-wrap gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {badges.map((b, i) => (
                          <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                            className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-600 p-4 shadow-sm"
                          >
                            <span className="text-2xl">{b.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-100">{b.label}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{b.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                      <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTab("security")}
                        className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full shadow-lg"
                        aria-label="Éditer le profil"
                      >
                        Éditer le profil
                      </motion.button>
                      {(Array.isArray(profile.role) ? profile.role.includes("ROLE_ADMIN") : profile.role === "ROLE_ADMIN") && (
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="mt-8 bg-gray-100 dark:bg-gray-600 p-6 rounded-lg shadow-sm"
                        >
                          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Actions Admin</h3>
                          <div className="flex flex-wrap gap-4">
                            {[
                              { label: "Créer un quiz", color: "bg-green-500" },
                              { label: "Gérer les utilisateurs", color: "bg-blue-500" },
                              { label: "Consulter rapports", color: "bg-yellow-500" },
                            ].map((action, i) => (
                              <motion.button
                                key={i}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, rotate: 3 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-6 py-3 ${action.color} text-white rounded-lg shadow`}
                              >
                                {action.label}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg"
                  >
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Activité récente</h3>
                    <div className="space-y-4">
                      {computedStats.history.slice(0, 3).map((item, i) => (
                        <motion.div
                          key={i}
                          variants={itemVariants}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.quizTitle || "Quiz"} ({item.date})
                          </span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {item.formattedScore}/100
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Security Tab */}
              {tab === "security" && (
                <motion.form
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  onSubmit={handleSubmit}
                  className="space-y-6 max-w-md mx-auto bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg"
                >
                  {msg && (
                    <motion.div
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      className={`p-4 rounded-lg ${
                        msg.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {msg.text}
                    </motion.div>
                  )}
                  {[
                    { label: "Nom d'utilisateur", name: "username", value: form.username, type: "text" },
                    { label: "Email", name: "email", value: form.email, type: "email" },
                  ].map((f, i) => (
                    <motion.div key={i} variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {f.label}
                      </label>
                      <input
                        name={f.name}
                        type={f.type}
                        value={f.value}
                        onChange={(e) => updateForm(f.name, e.target.value)}
                        required
                        className={`mt-1 w-full rounded-lg border ${
                          formErrors[f.name] ? "border-red-500" : "border-gray-300"
                        } shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400`}
                        aria-invalid={formErrors[f.name] ? "true" : "false"}
                        aria-describedby={formErrors[f.name] ? `${f.name}-error` : undefined}
                      />
                      {formErrors[f.name] && (
                        <p id={`${f.name}-error`} className="text-red-500 text-sm mt-1">
                          {formErrors[f.name]}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nouveau mot de passe{" "}
                      <span className="text-xs text-gray-500 dark:text-gray-400">(laisser vide)</span>
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPwd ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        placeholder="••••••••"
                        className="mt-1 w-full rounded-lg border-gray-300 dark:border-gray-500 pr-12 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:bg-gray-600 dark:placeholder-gray-400"
                        aria-label="Nouveau mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                        aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPwd ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex space-x-4">
                    <motion.button
                      type="submit"
                      disabled={loading || Object.values(formErrors).some((err) => err)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`rounded-full px-8 py-3 text-white shadow-lg ${
                        loading || Object.values(formErrors).some((err) => err)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-cyan-500 to-purple-500"
                      }`}
                      aria-label="Enregistrer les modifications"
                    >
                      {loading ? "..." : "Enregistrer"}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setTab("profile")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-3 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-sm"
                      aria-label="Annuler les modifications"
                    >
                      Annuler
                    </motion.button>
                  </motion.div>
                </motion.form>
              )}

              {/* Stats Tab */}
              {tab === "stats" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                  {/* Date Filter */}
                  <motion.div variants={itemVariants} className="flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer par période :</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="rounded-lg border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                      aria-label="Filtrer les statistiques par période"
                    >
                      <option value="all">Tout le temps</option>
                      <option value="7days">7 derniers jours</option>
                      <option value="30days">30 derniers jours</option>
                    </select>
                  </motion.div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Quiz passés", val: computedStats.quizzesTaken, icon: "📊" },
                      { label: "Réponses justes", val: computedStats.correctAnswers, icon: "✅" },
                      { label: "Meilleur score", val: computedStats.highestScore, icon: "🏆" },
                      { label: "Taux réussite", val: computedStats.successRate, icon: "🎯" },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                        className="flex flex-col items-center rounded-lg bg-white dark:bg-gray-700 p-6 shadow-sm"
                      >
                        <span className="text-3xl">{s.icon}</span>
                        <CountUp
                          end={s.val}
                          duration={2}
                          suffix={s.label === "Taux réussite" ? "%" : ""}
                          className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100"
                        />
                        <p className="text-gray-500 dark:text-gray-400">{s.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Line Chart */}
                  <motion.div
                    variants={itemVariants}
                    className="h-80 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"
                  >
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Historique des scores</h3>
                    {computedStats.history.length > 0 ? (
                      <Suspense fallback={<div className="text-center text-gray-500">Chargement du graphique...</div>}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={computedStats.history}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                            <XAxis
                              dataKey="date"
                              stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                              tickFormatter={(date) => date}
                            />
                            <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} domain={[0, 100]} />
                            <Tooltip
                              content={({ payload }) =>
                                payload?.length ? (
                                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-500">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].payload.date}</p>
                                    <p>Score: {payload[0].payload.formattedScore}/100</p>
                                    <p>Quiz: {payload[0].payload.quizTitle || "N/A"}</p>
                                    <p>Catégorie: {payload[0].payload.category || "N/A"}</p>
                                  </div>
                                ) : null
                              }
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="formattedScore"
                              name="Score"
                              stroke="#46c7d8"
                              strokeWidth={4}
                              animationDuration={1500}
                              dot={{ fill: "#46c7d8", r: 6 }}
                              activeDot={{ r: 8, fill: "#0b94a7" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Suspense>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        Aucune donnée disponible pour cette période.
                      </div>
                    )}
                  </motion.div>

                  {/* Detailed Stats Table */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"
                  >
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Détails des quiz</h3>
                    {computedStats.history.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b dark:border-gray-500">
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Date</th>
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Quiz</th>
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Catégorie</th>
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {computedStats.history.map((item, i) => (
                              <motion.tr
                                key={i}
                                variants={itemVariants}
                                className="border-b dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{item.date}</td>
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{item.quizTitle || "N/A"}</td>
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{item.category || "N/A"}</td>
                                <td className="py-2 px-4 font-semibold text-cyan-600 dark:text-cyan-400">
                                  {item.formattedScore}/100
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        Aucune donnée disponible.
                      </div>
                    )}
                  </motion.div>

                  {/* Circular Progress and Export */}
                  <motion.div
                    variants={itemVariants}
                    className="flex justify-center mt-6"
                  >
                    <div style={{ width: 140, height: 140 }}>
                      <CircularProgressbar
                        value={animatedRate}
                        maxValue={100}
                        text={`${animatedRate}%`}
                        strokeWidth={10}
                        styles={buildStyles({
                          pathColor: "#46c7d8",
                          textColor: darkMode ? "#E5E7EB" : "#046b7b",
                          trailColor: darkMode ? "#374151" : "#E5E7EB",
                          pathTransitionDuration: 1,
                          textSize: "16px",
                        })}
                      />
                    </div>
                  </motion.div>
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportStats}
                    className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full shadow-lg flex items-center gap-2"
                    aria-label="Exporter les statistiques en CSV"
                  >
                    <FaDownload />
                    Exporter en CSV
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
            {/* ------------ Fichiers Tab ------------ */}
              {tab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6 max-w-sm mx-auto"
                >
                {profile.cv && (
                    <a
                    href={`http://localhost:8000${profile.cv}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 underline"
                    >
                      <FaDownload /> Télécharger le CV actuel
                    </a>
                  )}

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setCvFile(e.target.files[0])}
                    className="border rounded w-full px-3 py-2"
                  />

                  <button
                    disabled={!cvFile}
                    onClick={uploadCV}
                    className={`w-full py-2 rounded text-white ${
                      cvFile
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Upload CV
                  </button>

                {msg && (
                    <p
                      className={`p-2 rounded ${
                        msg.type === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
  );
}