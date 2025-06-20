
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../utils/supabaseClient';

const GEMINI_API_KEY=process.env.REACT_APP_GEMINI_API_KEY;
const cache = {};

const geminiPrompt = async (prompt) => {
  try {
    const res = await fetch(GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'YOLO to the moon!';
  } catch (e) {
    console.error('Gemini error:', e);
    return 'YOLO to the moon!';
  }
};

const cleanResponse = (text, fallback) => {
  if (!text || text.toLowerCase().includes('please provide') || text.length < 10)
    return fallback;
  return text;
};

const TerminalIntro = () => {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = '🧠 Booting Meme Market OS... 💥 Welcome to CyberVerse ';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if(index<fullText.length){
        setDisplayedText((prev) => prev + fullText[index]);
      }
      index++;
      if (index >= fullText.length-1) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-green-400 font-mono text-center text-lg my-4 glitch flicker">
      {displayedText}
    </div>
  );
};

export default function MemeGallery() {
  const [memes, setMemes] = useState([]);
  const [bidInput, setBidInput] = useState({});
  const [bids, setBids] = useState({});
  const [votes, setVotes] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);

  const fetchMemes = async () => {
    const { data: memesData, error: memesError } = await supabase.from('memes').select('*');
    if (memesError) return;

    const { data: bidsData, error: bidsError } = await supabase.from('bids').select('*');
    if (bidsError) return;

    const bidMap = {};
    bidsData.forEach(bid => {
      if (!bidMap[bid.meme_id] || bid.credits > bidMap[bid.meme_id]) {
        bidMap[bid.meme_id] = bid.credits;
      }
    });

    const normalized = memesData.map(meme => ({
      ...meme,
      tags: Array.isArray(meme.tags)
        ? meme.tags
        : meme.tags
        ? String(meme.tags).split(',').map(tag => tag.trim())
        : [],
      highestBid: bidMap[meme.id] || 0,
    }));

    normalized.sort((a, b) => b.highestBid - a.highestBid);

    setMemes(normalized);
  };

  const fetchBids = async () => {
    const { data, error } = await supabase.from('bids').select('*');
    if (!error) {
      const highest = {};
      data.forEach(bid => {
        if (!highest[bid.meme_id] || bid.credits > highest[bid.meme_id].credits) {
          highest[bid.meme_id] = bid;
        }
      });
      setBids(highest);
    }
  };

  const fetchVotes = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('votes').select('*').eq('user_id', user.id);
    if (!error && data) {
      const map = {};
      data.forEach(v => {
        map[v.meme_id] = v;
      });
      setVotes(map);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        let mockId = localStorage.getItem('mock_user_id');
        if (!mockId) {
          mockId = crypto.randomUUID();
          localStorage.setItem('mock_user_id', mockId);
        }

        const mockUsername = `guest_${mockId.slice(0, 6)}`;

        const { error } = await supabase
          .from('users')
          .upsert([{ id: mockId, username: mockUsername }], { onConflict: 'id' });

        if (!error) {
          setUser({ id: mockId });
        }
      }
    };

    getUser();
    fetchMemes();
    fetchBids();

    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('new-bid', bid => {
      setBids(prev => {
        const updated = { ...prev };
        if (!updated[bid.meme_id] || bid.credits > updated[bid.meme_id].credits) {
          updated[bid.meme_id] = bid;
        }
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user) fetchVotes();
  }, [user]);

  const handleBid = async (memeId) => {
    const credits = parseInt(bidInput[memeId]);
    if (isNaN(credits) || !user) return;

    if (bids[memeId] && credits <= bids[memeId].credits) {
      alert('Your bid must be higher than the current highest bid.');
      return;
    }

    const bid = {
      meme_id: memeId,
      user_id: user.id,
      credits,
    };

    const { data, error } = await supabase.from('bids').insert(bid).select().single();

    if (!error && data) {
      socketRef.current?.emit('new-bid', data);
      setBidInput({ ...bidInput, [memeId]: '' });
    }
  };

  const handleVote = async (memeId, type) => {
    if (!user || !user.id) return;

    const { data: existingVote } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('meme_id', memeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      alert(`You already voted: ${existingVote.vote_type}`);
      return;
    }

    await supabase.from('votes').insert([{ meme_id: memeId, user_id: user.id, vote_type: type }]);

    const column = type === 'up' ? 'upvotes' : 'downvotes';
    await supabase.rpc('increment_vote', {
      meme_id_input: memeId,
      column_name: column,
    });

    setMemes(prev =>
      prev.map(m => m.id === memeId ? { ...m, [column]: (m[column] || 0) + 1 } : m)
    );
    setVotes(prev => ({ ...prev, [memeId]: { vote_type: type } }));
  };

  const generateAIContent = async (meme) => {
    if (cache[meme.id]) {
      await fetchMemes();
      return;
    }

    setLoadingId(meme.id);
    const tagList = meme.tags.join(', ') || 'funny, internet';

    const captionPrompt = `Act as a meme caption generator. Based on the tags: [${tagList}], write a short, clever, one-line meme caption. Keep it under 25 words. Make it punchy, sarcastic, or absurd—perfect for Gen Z humor. Do not explain, just output the caption.`;
    const vibePrompt = `Act as a meme vibe detector. Based on the tags: [${tagList}], describe the overall aesthetic or vibe of the meme in 3–5 words only. Use Gen Z slang or internet culture. Respond with only the vibe description, no extra text.`;

    const rawCaption = await geminiPrompt(captionPrompt);
    const rawVibe = await geminiPrompt(vibePrompt);

    const caption = cleanResponse(rawCaption, 'YOLO to the moon!');
    const vibe = cleanResponse(rawVibe, 'Retro Cyber Vibes');

    cache[meme.id] = caption;

    await supabase.from('memes').update({ caption, vibe }).eq('id', meme.id);
    await fetchMemes();
    setLoadingId(null);
  };

  return (
    <div className="bg-black min-h-screen p-4 font-sans">
      <TerminalIntro />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-white">
        {memes.map(meme => (
          <div key={meme.id} className="bg-gradient-to-r from-pink-500 to-purple-800 p-4 rounded-xl shadow-md text-white glitch transition-transform duration-300 ease-in-out hover:scale-105">
            <img
              src={meme.image_url || 'https://picsum.photos/200'}
              alt={meme.title}
              className="w-full h-48 object-cover rounded"
            />
            <h3 className="text-lg mt-2">{meme.title}</h3>
            <p className="text-sm text-pink-200">{meme.tags.join(', ')}</p>

            {meme.caption && <p className="mt-2 text-yellow-300">💬 Caption: {meme.caption}</p>}
            {meme.vibe && <p className="text-blue-300">✨ Vibe: {meme.vibe}</p>}

            <button
              onClick={() => generateAIContent(meme)}
              disabled={loadingId === meme.id}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded glow-button"
            >
              {loadingId === meme.id ? 'Generating...' : 'Generate Caption & Vibe'}
            </button>

            <div className="mt-2 text-green-200">
              <p>
                Highest Bid: {bids[meme.id]?.credits || 0}{' '}
                {bids[meme.id]?.user_id ? `by ${bids[meme.id].user_id.slice(0, 6)}...` : ''}
              </p>
            </div>

            <input
              type="number"
              placeholder="Enter your bid"
              className="w-full mt-2 p-1 bg-gray-800 text-white"
              value={bidInput[meme.id] || ''}
              onChange={(e) => setBidInput({ ...bidInput, [meme.id]: e.target.value })}
            />
            <button
              onClick={() => handleBid(meme.id)}
              className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white py-1 rounded glow-button"
            >
              Bid
            </button>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => handleVote(meme.id, 'up')}
                className="bg-green-600 px-2 py-1 rounded hover:bg-green-700 glow-button"
                disabled={votes[meme.id]}
              >
                👍 {meme.upvotes || 0}
              </button>
              <button
                onClick={() => handleVote(meme.id, 'down')}
                className="bg-red-600 px-2 py-1 rounded hover:bg-red-700 glow-button"
                disabled={votes[meme.id]}
              >
                👎 {meme.downvotes || 0}
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .glow-button {
          box-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff;
        }
        .glitch {
          animation: glitch 1.5s infinite;
        }
        @keyframes glitch {
          0% { transform: translateX(0); }
          20% { transform: translateX(-1px); }
          40% { transform: translateX(1px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
        .flicker {
          animation: flicker 3s infinite alternate;
        }
        @keyframes flicker {
          from { opacity: 1; }
          50% { opacity: 0.4; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}