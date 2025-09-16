import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate('/home');
  };

  return (
    <div className='flex items-center justify-center h-78 bg-gray-900 text-white'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-teal-400'>404</h1>
        <p className='text-2xl mt-4'>Page Not Found</p>
        <p className='text-gray-400 mt-2'>
          The page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={handleGoToHome}
          className='mt-6 inline-block bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors duration-300'
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PageNotFound;
