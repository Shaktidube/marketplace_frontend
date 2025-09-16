import React from 'react';
import AppRoutes from './routes/routes';
import NavBar from './components/NavBar';

const App = () => {
  return (
    <div className='bg-black min-h-screen backdrop-blur-lg flex flex-col'>
      <NavBar />
      <main className='flex flex-1 items-center justify-center '>
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;
