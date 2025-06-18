import MemeGallery from '../component/MemeGallery';
import MemeForm from '../component/MemeForm';
import { useState } from 'react';

export default function Home() {
  const [reload, setReload] = useState(false);

  const refresh = () => setReload(!reload);

  return (
    <div className="container mx-auto px-4 py-6">

      <MemeForm onMemeCreated={refresh} />
      
      <MemeGallery key={reload} />
    </div>
  );
}
