import React, { useState } from 'react';
import UserEmail from '../components/UserEmail';
import { useMutation } from '@tanstack/react-query';
import { connectWalletApi } from '../api/user';
import { useDispatch } from 'react-redux';
import { setProvider, setWalletAddress } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { setItemFromLocalStorage, showToast } from '../utils/helper';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';

const ConnectWallet = () => {
  const { sWalletAddress: address, isConnected, open } = useAppKit();

  const [existingUser, setExistingUser] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { mutate: mutateConnectWallet, isPending } = useMutation({
    mutationFn: (payload) => connectWalletApi(payload),
    onSuccess: (data) => {
      const {
        sWalletAddress,
        sToken,
        isVerified,
        sUsername,
        sUserProfileImage,
      } = data.data;
      dispatch(
        setWalletAddress({
          sWalletAddress,
          sToken,
          isVerified,
          sUsername,
          sUserProfileImage,
        })
      );
      navigate('/home');
      showToast('Wallet connected successfully!', 'success');
    },
    onError: (error) => {
      if (error.status === 409) {
        const {
          sWalletAddress,
          sToken,
          isVerified,
          sEmail,
          sUsername,
          sUserProfileImage,
        } = error.data.data;
        setItemFromLocalStorage('userToken', sToken);
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
        if (!isVerified) {
          setExistingUser(sWalletAddress);
        } else {
          showToast('User already exists, redirecting to home', 'success');
          navigate('/home');
        }
      }
    },
  });

  const handleConnect = async () => {
    try {
      await open();
      if (address) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        dispatch(setProvider(provider));

        console.log('Wallet connected with address:', address);
        const sWalletAddress = address;

        console.log(
          'Triggering wallet connection mutation with address:',
          sWalletAddress
        );
        mutateConnectWallet(sWalletAddress);
      }
    } catch (err) {
      console.error('Wallet connection failed', err);
    }
  };

  return (
    <div>
      {!isConnected && !existingUser && (
        <button onClick={handleConnect} disabled={isPending}>
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      {isConnected && !existingUser && <UserEmail sWalletAddress={address} />}

      {existingUser && <UserEmail sWalletAddress={existingUser} />}
    </div>
  );
};

export default ConnectWallet;
