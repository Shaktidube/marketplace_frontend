import React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { disconnectWallet, setWalletAddress } from '../redux/authSlice';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile } from '../api/user.js';
import {
  getItemFromLocalStorage,
  invalidateQueries,
  showToast,
} from '../utils/helper';
import {
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
} from '@reown/appkit/react';
import socket from '../utils/socket.js';

const NavBar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const sToken = getItemFromLocalStorage('userToken');
  const { disconnect } = useDisconnect();
  const { walletProvider } = useAppKitProvider('eip155');
  const { address } = useAppKitAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, error, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
    enabled: !!sToken && !user.sToken,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    console.log('socket connected?', socket.connected, socket);

    if (!socket.connected) {
      socket.connect();
      console.log('socket connected', socket);
    }

    socket.on('TransferEventDetected', (data) => {
      console.log('TransferEventDetected received:', data);
      invalidateQueries(queryClient);
      showToast('Newly minted NFT is now available!', 'success');
      navigate('/profile');
    });

    socket.on('ListedEventDetected', (data) => {
      console.log('ListedEventDetected received:', data);
      console.log('ListedEventDetected');
      invalidateQueries(queryClient);
      showToast('listed nft is now available!', 'success');
    });

    socket.on('BuySuccessEventDetected', (data) => {
      console.log('BuySuccessEventDetected received:', data);
      invalidateQueries(queryClient);
      showToast('newly bought nft is now available', 'success');
      navigate('/profile');
    });

    socket.on('NftTransferFromContract', (data) => {
      console.log('NftTransferFromContract received:', data);
      invalidateQueries(queryClient);
      showToast('NFT Minted successfully!', 'success');
      navigate('/profile');
    });

    socket.on('CancelListingEventDetected', (data) => {
      console.log('CancelListingEventDetected received:', data);
      invalidateQueries(queryClient);
      showToast('NFT listing cancelled successfully!', 'success');
      navigate('/profile');
    });

    socket.on('BurnEventDetected', (data) => {
      console.log('BurnEventDetected received:', data);
      invalidateQueries(queryClient);
      showToast('NFT burned and removed from your profile!', 'success');
    });

    socket.on("AuctionStartedEventDetected", (data) => {
      console.log("AuctionStartedEventDetected received:", data);
      invalidateQueries(queryClient);
      showToast("Auction started successfully!", "success");
      navigate("/home");
    });

    socket.on("NewBidPlacedEventDetected" , (data) => {
      console.log("NewBidPlacedEventDetected received:", data);
      invalidateQueries(queryClient);
      showToast("Bid placed successfully!", "success");
    });

    socket.on("ClaimNftEventDetected" , (data) => {
      console.log("ClaimNft received:", data);
      invalidateQueries(queryClient);
      showToast("NFT Owner claimed successfully!", "success");
      navigate("/profile");
    });

    socket.on("ReClaimNftEventDetected" , (data) => {
      console.log("ReClaimNft received:", data);
      invalidateQueries(queryClient);
      showToast("NFT reclaimed successfully!", "success");
      navigate("/profile");
    });

    return () => {
      socket.off('TransferEventDetected');
      socket.off('ListedEventDetected');
      socket.off('NftTransferFromContract');
      socket.off('BuySuccessEventDetected');
      socket.off('CancelListingEventDetected');
      socket.off('BurnEventDetected');
      socket.off('AuctionStartedEventDetected');
      socket.off('NewBidPlacedEventDetected');
      socket.off('ClaimNftEventDetected');
      socket.off('ReClaimNftEventDetected');
    };
  }, [user.sWalletAddress, navigate]);

  useEffect(() => {
    const handleStorage = async (event) => {
      if (event.key === 'userToken') {
        if (!event.newValue) {
          console.log('......User logged out from another tab');
          dispatch(disconnectWallet());
        } else if (event.oldValue && event.oldValue !== event.newValue) {
          console.log('......User another tab');
          dispatch(disconnectWallet());
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [sToken]);

  useEffect(() => {
    if (data) {
      console.log('Profile data fetched:', data.data);
      const {
        sWalletAddress,
        isVerified,
        sToken,
        sEmail,
        sUsername,
        sUserProfileImage,
      } = data.data;

      dispatch(
        setWalletAddress({
          sWalletAddress,
          isVerified,
          sToken,
          sEmail,
          sUsername,
          sUserProfileImage,
        })
      );
    }
    if (isError) {
      console.log('profile error:', error);
      dispatch(disconnectWallet());
    }
  }, [data, isError, error]);

  const handleDisconnect = async () => {
    await disconnect();
    dispatch(disconnectWallet());
  };

  useEffect(() => {
    console.log('wallet provider', walletProvider);
    console.log('window etherewum0', window.ethereum);

    if (
      window.ethereum &&
      user.sWalletAddress &&
      address &&
      user.sWalletAddress !== address
    ) {
      console.log('address changed', address);
      handleDisconnect();
    }

    if (window.ethereum) {
      const handleAccountsChanged = async () => {
        if (user.sWalletAddress && address && user.sWalletAddress !== address) {
          console.log('address changed', address);
          handleDisconnect();
        }
        handleDisconnect();
      };

      const handleChainChanged = (chainId) => {
        console.log('Chain changed:', chainId);
        if (chainId !== '0xaa36a7') {
          window.ethereum.request(
            {
              method: 'wallet_switchEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                },
              ],
            },
            []
          );
          showToast('Switched to Sepolia Testnet', 'success');
        } else {
          window.ethereum.request(
            {
              method: 'wallet_switchEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                },
              ],
            },
            []
          );
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged
        );
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  if (!sToken || user?.isVerified === false || !user?.sUsername) return;

  return (
    <nav className=' backdrop-blur-lg p-4 border-2 border-b  shadow-lg ml-50 w-[80%] flex justify-around items-center mb-6 border-t-0 border-white/20'>
      <NavLink
        to='/home'
        className='font-medium px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-gray-300 hover:text-teal-400 hover:bg-teal-900/20'
      >
        Gallery
      </NavLink>
      <NavLink
        to='/mint-nft'
        className='font-medium px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-gray-300 hover:text-teal-400 hover:bg-teal-900/20'
      >
        Mint NFT
      </NavLink>
      <NavLink
        to='/list-for-sell'
        className='font-medium px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-gray-300 hover:text-teal-400 hover:bg-teal-900/20'
      >
        List NFT
      </NavLink>
      <NavLink
        to='/buy-sell'
        className='font-medium px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-gray-300 hover:text-teal-400 hover:bg-teal-900/20'
      >
        Listed Nfts
      </NavLink>
      <NavLink
        to='/profile'
        className='font-medium px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-gray-300 hover:text-teal-400 hover:bg-teal-900/20'
      >
        Profile
      </NavLink>
      <div>
        <appkit-button />
      </div>
      {/* <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleDisConnect}
        className="font-medium border-2 border-gray-300 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-gray-300 hover:text-red-400 hover:bg-red-900/20"
      >
        {hovered
          ? "Disconnect"
          : user.sWalletAddress
          ? `${user.sWalletAddress.slice(0, 4)}...${user.sWalletAddress.slice(
              -4
            )}`
          : "Connected"}
      </button> */}
    </nav>
  );
};

export default NavBar;
