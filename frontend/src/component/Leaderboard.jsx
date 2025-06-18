import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Leaderboard() {
  const [topMemes, setTopMemes] = useState([]);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('memes')
      .select('*')
      .order('upvotes', { ascending: false })
      .limit(10);

    if (!error) setTopMemes(data);
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">🔥 Leaderboard (Top 10 Memes)</h2>
      <ul>
        {topMemes.map((meme, index) => (
          <li key={meme.id} className="mb-2">
            #{index + 1}: <strong>{meme.title}</strong> - 👍 {meme.upvotes}
          </li>
        ))}
      </ul>
    </div>
  );
}
