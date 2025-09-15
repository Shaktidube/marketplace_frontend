import React, { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FaSpinner , FaSearch , FaArrowCircleDown } from 'react-icons/fa';
import { getAllNfts } from '../api/user';
import { Link } from 'react-router-dom';

const Home = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('sNftName');
  const [sortOrder, setSortOrder] = useState(1);
  const [timeoutId, setTimeoutId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  

  useEffect(() => {
    if(timeoutId) {
      clearTimeout(timeoutId);
    }
    const timeout = setTimeout(() => {
      console.log("search term : ",searchTerm)
      fetch();
      setIsSearching(true);
      setTimeoutId(timeout)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => setIsSearching(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch: fetch,
  } = useInfiniteQuery({
    queryKey: ['nfts' ,currentPage , sortField, sortOrder],
    queryFn: ({ pageParam = 1 }) => getAllNfts(pageParam , searchTerm , sortField , sortOrder),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.page < lastPage.data.totalPages) {
        return lastPage.data.page + 1;
      }
      return undefined;
    },
    gcTime: 6000,
    staleTime:  30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <FaSpinner className="animate-spin text-4xl text-teal-400" />
      </div>
    );
  }

  if (isError) {
    console.error("Error fetching NFTs:", error);
    if( error.status === 404 ){
      return (
        <div className="text-center text-gray-400 py-12">
          <p className="text-2xl font-semibold">No NFTs found.</p>
          <p className="mt-2">Please mint some NFTs to see them here.</p>
        </div>
      );
    }
    return (
      <div className="text-center p-4 text-red-400">
        <p>Error: {error.message || 'Failed to fetch NFTs'}</p>
      </div>
    );
  }

  console.log("data" , data);
  console.log("data" , data.data);

  // const handleSortFieldChange = (e) => {
  //   const [field, order] = e.target.value.split('_');
  //   setSortField(field);
  //   setSortOrder(order === '1' ? 1 : -1);
  //   setCurrentPage(1); 
  // };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center uppercase tracking-wider mb-10">
        <div className="absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:skew-x-12 before:-translate-x-screen before:animate-auto-shine-screen"></div>
        NFTs
      </h1>

      {/* <div className="mb-8 flex justify-center items-center relative max-w-3xl mx-auto">
        <div className="relative w-[50%] group">
          <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400 transition-all duration-300 group-focus-within:text-teal-300 group-hover:text-teal-300 ${isSearching ? 'animate-pulse' : ''}`} size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NFTs by name"
            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border-2 border-transparent rounded-full shadow-lg focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 text-gray-200 placeholder-gray-400 text-lg font-medium hover:bg-white/20 hover:shadow-xl"
            aria-label="Search NFTs"
          />
          {isSearching && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 via-transparent to-purple-400/20 animate-shimmer"></div>
          )}
        </div>

        <div className="ml-4 relative group">
          <select 
            value={`${sortField}_${sortOrder}`}
            onChange={handleSortFieldChange}
            className="px-6 py-4 bg-white/10 backdrop-blur-md border-2 border-transparent rounded-full shadow-lg focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 text-gray-200 placeholder-gray-400 text-lg font-medium hover:bg-white/20 hover:shadow-xl appearance-none cursor-pointer"
            aria-label="Sort NFTs"
          >
            <option value="sNftName_1">Name A-Z</option>
            <option value="sNftName_-1">Name Z-A</option>
          </select>
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none text-teal-400 group-hover:text-teal-300 transition-colors duration-300">
            <FaArrowCircleDown size={20} />
          </div>
        </div>
      </div> */}

      {data?.pages[0]?.data?.nfts.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-2xl font-semibold">No NFTs found.</p>
          <p className="mt-2">Please mint some NFTs to see them here.</p>
        </div>
      ) : (
        <div className="grid   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {data.pages.map((page) =>
            page.data.nfts.map((nft) => (
              <Link
                to={`/nft-detail/${nft._id}`}
                key={nft._id}
                className="relative bg-gray-800/80 rounded-2xl overflow-hidden shadow-lg border border-gray-700 transform transition-transform duration-300 hover:scale-105 hover:border-teal-500"
              >
                <div className="absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:skew-x-12 before:-translate-x-full before:animate-auto-shine"></div>

                <div className="w-full h-56 bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={nft.sImageUrl}
                    alt={nft.sNftName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-bold text-gray-200 truncate">
                    {nft.sNftName}{' '}
                    <span className="text-sm text-gray-400">#{nft.nTokenId}</span>
                  </h3>
                  <p className="text-sm font-medium text-gray-400 truncate">
                    Creator : 
                    {nft.sFirstMInterAddress.slice(0, 4)}...{nft.sFirstMInterAddress.slice(-4)}
                  </p>
                </div>

                {nft.isApprovedForSale === true && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    OnSale
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-8 py-3 bg-teal-600 text-white rounded-full font-semibold shadow-lg transition duration-300 hover:bg-teal-700 hover:shadow-xl disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
