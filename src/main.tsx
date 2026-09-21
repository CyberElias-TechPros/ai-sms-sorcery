import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Boot theme: default cinematic dark unless the user chose light.
const stored = localStorage.getItem('sorcery-theme');
document.documentElement.classList.toggle('dark', stored !== 'light');

createRoot(document.getElementById("root")!).render(<App />);
