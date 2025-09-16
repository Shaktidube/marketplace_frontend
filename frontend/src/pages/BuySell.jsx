import React, { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaSpinner } from "react-icons/fa";
import { liveSellNfts, updateNftById } from "../api/user";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { handleBuyNFt, cancelListing, showToast } from "../utils/helper";
import { useAppKitProvider } from "@reown/appkit/react";


const BuySell = () => {
  const user = useSelector((state) => state.auth.user);
  const { walletProvider } = useAppKitProvider("eip155");
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionType, setActionType] = useState("");
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["buy-nfts"],
    queryFn: ({ pageParam = 1 }) => liveSellNfts(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.page < lastPage.data.totalPages) {
        return lastPage.data.page + 1;
      }
      return undefined;
    },
    gcTime: 4000,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { mutate: updateNftMutate } = useMutation({
    mutationFn: (nftData) => updateNftById(nftData),
    onSuccess: (data) => {
      console.log("NFT updated successfully:", data);
      queryClient.invalidateQueries(["profile"]);
      showToast("NFT updated successfully!", "success");
      navigate("/profile");
    },
    onError: (error) => {
      console.error("Error updating NFT:", error);
      showToast("Failed to update NFT", "error");
    },
  });

  const handleBuyBtnNFt = async (nft) => {
    setIsLoadingAction(true);
    setActionType("buy");
    try {
      const result = await handleBuyNFt(nft, walletProvider);
      if (result && result.success) {
        console.log("Buying process completed");
        navigate('/profile');
      }
    } catch (error) {
      console.error("Error buying NFT:", error.reason);
      if(error.reason === "Market : Token not listed" || error.reason === "Market : Buyer and Seller can not be same"){
        console.log(" tokenId and tokenAddress" , nft.nTokenId , nft.sTokenAddress);
        await updateNftMutate(nft._id);
        await queryClient.invalidateQueries(["buy-nfts"]);
        showToast("This NFT is no longer listed for sale", "error");
      }
    } finally {
      setIsLoadingAction(false);
      setActionType("");
    }
  };

  const handleCancelListing = async (nft) => {
    setIsLoadingAction(true);
    setActionType("cancel");
    try {
      const result = await cancelListing(nft, walletProvider);
      if (result && result.success) {
        console.log("Cancel listing transaction successful");
        // setIsLoadingAction(false);
        // await delay(10000);
        // navigate('/profile');
        return;
      }
      console.log("Cancel process completed");
    } catch (error) {
      console.error("Error cancelling listing:", error);
    } finally {
      setIsLoadingAction(false);
      setActionType("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <FaSpinner className="animate-spin text-4xl text-teal-400" />
      </div>
    );
  }

  if (isError) {
    console.error("Error fetching NFTs:", error);
    if (error.status === 404) {
      return (
        <div className="text-center text-gray-400 py-12">
          <p className="text-2xl font-semibold">No NFTs found.</p>
          <p className="mt-2">Please mint some NFTs to see them here.</p>
        </div>
      );
    }
    return (
      <div className="text-center p-4 text-red-400">
        <p>Error: {error.message || "Failed to fetch NFTs"}</p>
      </div>
    );
  }

  console.log("data", data);
  console.log("data", data.data);

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center uppercase tracking-wider mb-10">
        Buy NFTs
      </h1>
      {isLoadingAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center p-8 rounded-lg shadow-2xl animate-pulse">
            <FaSpinner className="text-6xl text-teal-500 animate-spin mb-4" />
            <p className="text-xl font-semibold text-gray-100">
              {actionType === "buy" ? "Buying NFT..." : "cancel Listing..."}
            </p>
            <p className="text-sm text-gray-100 mt-2">
              This may take a moment.
            </p>
          </div>
        </div>
      )}

      {data?.pages[0]?.data?.nfts.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-2xl font-semibold">No NFTs found.</p>
          <p className="mt-2">Please mint some NFTs to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {data.pages.map((page) =>
            page.data.nfts.filter((nft) => nft.isApprovedForSale != null).map((nft) => (
              <div
                key={nft._id}
                className="relative bg-gray-800/80 rounded-2xl overflow-hidden shadow-lg border border-gray-700 transform transition-transform duration-300 hover:scale-105 hover:border-teal-500"
              >
                <div className="absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:skew-x-12 before:-translate-x-full before:animate-auto-shine"></div>

                <div className="w-full h-56 bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={nft.sImageUrl}
                    alt={nft.sNftName}
                    className="w-full h-full object-cover cursor-pointer transition-opacity duration-300 hover:opacity-80"
                    onClick={() => navigate(`/nft-detail/${nft._id}`)}
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-bold text-gray-200 truncate">
                    {nft.sNftName}{" "}
                    <span className="text-sm text-gray-400">
                      #{nft.nTokenId}
                    </span>
                  </h3>
                  <h3 className="text-lg font-bold text-gray-200 truncate">
                    Price: {nft.nNftPrice}{" "}
                    <span className="text-sm text-gray-400">ETH</span>
                  </h3>
                  <p className="text-sm font-medium text-gray-400 truncate">
                    Creator:{" "}
                    {nft.sFirstMInterAddress
                      ? `${nft.sFirstMInterAddress.slice(
                          0,
                          4
                        )}...${nft.sFirstMInterAddress.slice(-4)}`
                      : "Unknown"}
                  </p>
                  {nft.sCurrentOwner !== user.sWalletAddress ? (
                    <button
                      onClick={() => handleBuyBtnNFt(nft)}
                      className="w-full mt-2 px-4 py-2 bg-teal-600 text-white rounded-full font-semibold shadow-lg transition duration-300 hover:bg-teal-700 hover:shadow-xl disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
                      disabled={isLoadingAction}
                    >
                      Buy for {nft.nNftPrice} ETH
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCancelListing(nft)}
                      className="w-full mt-2 px-4 py-2 bg-red-400 text-white rounded-full font-semibold shadow-lg transition duration-300 hover:bg-red-600 hover:shadow-xl disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
                      disabled={isLoadingAction}
                    >
                      {isLoadingAction && actionType === "cancel"
                        ? "Cancelling..."
                        : "Cancel Listing"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage || isLoadingAction}
            className="px-8 py-3 bg-teal-600 text-white rounded-full font-semibold shadow-lg transition duration-300 hover:bg-teal-700 hover:shadow-xl disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default BuySell;
