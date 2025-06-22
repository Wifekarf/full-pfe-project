import { useEffect, useState } from "react";
import api from "../services/api";
import AuthLayout from "../Layout/AuthLayout";

export default function TeamScores() {
  const [data, setData] = useState({ members: [], languages: [] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/rhm/teams/scores");
        setData(res.data);
      } catch (e) {
        setData({ members: [], languages: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const filteredMembers = data.members.filter((m) =>
    m.username.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthLayout>
      <div className="container mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Team Scores</h1>
        <div className="mb-4 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85a831]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Quiz Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Prog Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prog Score</th>
                {data.languages.map(lang => (
                  <th key={lang.id + "quiz"} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang.name} Quiz
                  </th>
                ))}
                {data.languages.map(lang => (
                  <th key={lang.id + "prog"} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang.name} Prog
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5 + 2 * data.languages.length} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={5 + 2 * data.languages.length} className="text-center py-8 text-gray-400">No team members found.</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    {member.image ? (
                      <img src={member.image} alt={member.username} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <span className="h-10 w-10 rounded-full bg-[#85a831]/20 flex items-center justify-center text-[#85a831] font-bold text-lg">
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <div className="font-semibold text-gray-800">{member.username}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.lastQuizActivity || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.lastProgActivity || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      {member.overallQuizScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                      {member.overallProgScore}%
                    </span>
                  </td>
                  {data.languages.map(lang => (
                    <td key={lang.id + "quizcell"} className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                        {member.quizScoresByLang[lang.name] || 0}%
                      </span>
                    </td>
                  ))}
                  {data.languages.map(lang => (
                    <td key={lang.id + "progcell"} className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                        {member.progScoresByLang[lang.name] || 0}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthLayout>
  );
} 