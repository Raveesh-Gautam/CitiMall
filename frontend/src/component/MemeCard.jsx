export default function MemeCard({ meme }) {
  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 shadow-lg border border-pink-500">
      <img src={meme.image_url} alt={meme.title} className="w-full h-48 object-cover rounded mb-2" />
      <h3 className="text-xl font-bold">{meme.title}</h3>
      <p className="text-sm italic text-pink-400">{meme.tags?.join(', ')}</p>
      <p className="mt-2 text-green-400">Upvotes: {meme.upvotes}</p>
    </div>
  );
}
