import MemeForm from './component/MemeForm';
import MemeGallery from './component/MemeGallery';

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-4 text-3xl text-center font-bold text-pink-500">⚡ Meme Marketplace</header>
      <div className="p-4">
        <MemeForm onMemeCreated={() => window.location.reload()} />
        <hr className="my-6 border-pink-500" />
        <MemeGallery />
      </div>
    </div>
  );
}

export default App;
