import { Link, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Page from '@/app/dashboard/page';
import { TitleUpdater } from '@/hooks/title-updater';

function App() {
  return (
    <>
      <TitleUpdater />
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/page">Page</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/page" element={<Page />} />
      </Routes>

    </>
  );
}

export default App
