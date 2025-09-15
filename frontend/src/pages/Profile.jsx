import React, { useState, useRef, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  FaUserCircle,
  FaEnvelope,
  FaWallet,
  FaCamera,
  FaPencilAlt,
  FaCheck,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { addUsername, getYourNfts, updateUserProfileImage } from "../api/user";
import { setWalletAddress } from "../redux/authSlice";
import { Link } from "react-router-dom";
import { handle409Error, showToast } from "../utils/helper";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user.sUsername || "");
  const [usernameError, setUsernameError] = useState("");

  const { mutate: mutateUpdateImage, isLoading: isImageUpdating } = useMutation(
    {
      mutationFn: (file) =>
      updateUserProfileImage(file),
      onSuccess: (data) => {
        showToast("Profile image updated successfully!", "success");
        const {
          sUserProfileImage,
          sUsername,
          sEmail,
          sWalletAddress,
          isVerified,
        } = data.data;
        dispatch(
          setWalletAddress({
            sUserProfileImage,
            sUsername,
            sEmail,
            sWalletAddress,
            isVerified,
          })
        );
        queryClient.invalidateQueries(["profile"]);
      },
      onError: (error) => {
        showToast("Failed to update profile image: " + error.message, "error");
        console.error("Error updating profile image:", error);
      },
    }
  );

  const { mutate: mutateSetUsername, isLoading: isUsernameUpdating } =
    useMutation({
      mutationFn: (payload) => addUsername(payload),
      onSuccess: (data) => {
        showToast("Username updated successfully!", "success");
        const {
          sWalletAddress,
          sToken,
          isVerified,
          sEmail,
          sUsername,
          sUserProfileImage,
        } = data.data;
        dispatch(
          setWalletAddress({
            sWalletAddress,
            sToken,
            isVerified,
            sEmail,
            sUsername,
            sUserProfileImage,
          })
        );
        setIsEditingUsername(false);
        console.log("Username set:", data);
      },
      onError: (error) => {
        handle409Error(error);
      },
    });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["nft"],
    queryFn: ({ pageParam = 1 }) =>
    getYourNfts(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.page < lastPage.data.totalPages) {
        return lastPage.data.page + 1;
      }
      return undefined;
    },
    gcTime: 6000,
    staleTime: 5000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <FaSpinner className="animate-spin text-4xl text-teal-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-4 text-red-400">
        <p>Error: {error.message || "Failed to fetch NFTs"}</p>
      </div>
    );
  }

  const handleChangePhoto = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      mutateUpdateImage(file);
    }
  };

  const handleEditUsername = () => {
    setIsEditingUsername(true);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    if (/\s/.test(value)) {
      setUsernameError("Username cannot contain spaces.");
    } else {
      setUsernameError("");
    }
    setNewUsername(value);
  };

  const handleSaveUsername = () => {
    if (newUsername.trim() === "") {
      setUsernameError("Username cannot be empty.");
      showToast("Username cannot be empty.", "error");
      return;
    }
    if (usernameError) {
      showToast("Please fix the username before saving.", "error");
      return;
    }
    mutateSetUsername({
      sWalletAddress: user.sWalletAddress,
      sUsername: newUsername,
    });
  };

  const handleCancelEdit = () => {
    setNewUsername(user.sUsername || "");
    setUsernameError("");
    setIsEditingUsername(false);
  };

  return (
    <div className=" mt-10  text-center text-gray-300">
      <div className="flex flex-col items-center">
        <div className="relative animate-bounce slow ">
          
          {user.sUserProfileImage ? (
            <img
              src={user.sUserProfileImage}
              alt="Profile"
              className="w-30 h-30 rounded-full object-cover border-4 border-teal-500 shadow-lg mb-4"
            />
          ) : (
            <FaUserCircle className="w-30 h-30 text-teal-400 border-4 border-teal-500 rounded-full p-2 shadow-lg mb-4" />

          )}
          <button
            onClick={handleChangePhoto}
            disabled={isImageUpdating}
            className="absolute bottom-6 right-0 bg-gray-700 p-2 rounded-full text-white border border-gray-500 hover:border-teal-400 shadow-md hover:bg-gray-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed animate-spin slow"
            aria-label="Change profile photo"
          >
            {isImageUpdating ? (
              <FaSpinner className="text-xs animate-spin" />
            ) : (
              <FaCamera className="text-xs hover:text-gray-400" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="flex flex-col items-center gap-2 mb-2">
          {isEditingUsername ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={handleUsernameChange}
                  className={`text-white bg-gray-700/50 rounded-lg p-2 text-xl font-bold w-full max-w-[200px] text-center ${usernameError ? 'border-2 border-red-500' : ''}`}
                  disabled={isUsernameUpdating}
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={isUsernameUpdating || !!usernameError}
                  className="text-green-400 hover:text-green-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUsernameUpdating ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheck />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUsernameUpdating}
                  className="text-red-400 hover:text-red-500 transition duration-200"
                >
                  <FaTimes />
                </button>
              </div>
              {usernameError && <p className="text-red-500 mr-10 text-[11px]">{usernameError}</p>}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-white">
                {newUsername || user.sUsername || "User Profile"}
              </h2>
              <button
                onClick={handleEditUsername}
                className="text-gray-400 hover:text-teal-400 transition duration-200"
                aria-label="Edit username"
              >
                <FaPencilAlt  className="animate-pulse"/>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 text-left max-w-md mx-auto mt-5">
        <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg shadow-inner border border-gray-600">
          <FaWallet className="text-blue-400 text-2xl" />
          <div className="flex-1">
            <p className="text-sm text-gray-400">Wallet Address</p>
            <p className="break-all font-mono text-white text-sm">
              {user.sWalletAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg shadow-inner border border-gray-600">
          <FaEnvelope className="text-yellow-400 text-2xl" />
          <div className="flex-1">
            <p className="text-sm text-gray-400">Email</p>
            {user.sEmail ? (
              <p className="text-white break-all">{user.sEmail}</p>
            ) : (
              <p className="text-red-400">Email not provided</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 w-full max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center uppercase tracking-wider mb-10">
              {/* <div className="absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:skew-x-12 before:-translate-x-screen before:animate-auto-shine-screen"></div> */}
              NFTs
            </h1>
      
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
    </div>
  );
};

export default Profile;
