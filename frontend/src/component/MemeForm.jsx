// src/components/MemeForm.jsx
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function MemeForm({ onMemeCreated }) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const meme = {
      title,
      image_url: imageUrl || 'https://picsum.photos/200',
      tags: tags.split(',').map(tag => tag.trim()),
      upvotes: 0,
    };

    const { data, error } = await supabase.from('memes').insert([meme]);

    if (!error && onMemeCreated) {
      onMemeCreated(); // Optimistic update
    }

    setTitle('');
    setImageUrl('');
    setTags('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-black text-white p-4 rounded shadow-md">
      <h2 className="text-xl mb-2">Create a Meme</h2>
      <input type="text" placeholder="Meme Title" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-2 bg-gray-900 text-white" />
      <input type="text" placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
        className="w-full p-2 mb-2 bg-gray-900 text-white" />
      <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)}
        className="w-full p-2 mb-2 bg-gray-900 text-white" />
      <button type="submit" className="bg-pink-500 px-4 py-2 hover:bg-pink-700 rounded">🚀 Ship Meme</button>
    </form>
  );
}
