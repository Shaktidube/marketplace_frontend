import { useMutation } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { addUsername, resendOtp, verifyEmail, verifyOtp } from '../api/user';
import { useNavigate } from 'react-router-dom';
import { setWalletAddress } from '../redux/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { handle409Error, showToast } from '../utils/helper';

const UserEmail = ({ sWalletAddress }) => {
  const [sEmail, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sUsername, setUsername] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const { mutate: mutateVerifyEmail, isPending: isPendingVerifyingEmail } =
    useMutation({
      mutationFn: (payload) => verifyEmail(payload),
      onSuccess: (data) => {
        showToast('OTP sent to your email!', 'success');
        console.log('OTP sent:', data);
        setIsOtpSent(true);
        setCountdown(30);
      },
      onError: (error) => {
        handle409Error(error);
        if (error.status === 422) {
          console.log(error.data.data.errors[0].msg);
          showToast(error.data.data.errors[0].msg, 'error');
        }
      },
    });

  const { mutate: mutateVerifyOtp, isPending: isPendingVerifyingOtp } =
    useMutation({
      mutationFn: (payload) => verifyOtp(payload),
      onSuccess: (data) => {
        console.log(' otp response data.data ', data.data);
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
        showToast('OTP verified successfully!', 'success');
        // navigate("/profile");
        console.log('OTP verified:', data);
      },
      onError: (error) => {
        console.error('Error verifying OTP:', error);
        if (error.status === 406) {
          showToast('Invalid otp', 'error');
        }
      },
    });

  const { mutate: mutateResendOtp, isPending: isResendPending } = useMutation({
    mutationFn: (payload) => resendOtp(payload),
    onSuccess: (data) => {
      showToast('OTP resent successfully!', 'success');
      console.log('OTP resent:', data);
      setCountdown(30);
    },
    onError: (error) => {
      showToast('Failed to resend OTP: ' + error.message, 'error');
      console.error('Error resending OTP:', error);
    },
  });
  const { mutate: mutateSetUsername } = useMutation({
    mutationFn: (payload) => addUsername(payload),
    onSuccess: (data) => {
      showToast('Username add successfully!', 'success');
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
      navigate('/profile');
      console.log('Username set:', data);
    },
    onError: (error) => {
      handle409Error(error);
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyEmail = () => {
    if (!sEmail) {
      showToast('Please enter your email', 'error');
      return;
    }

    mutateVerifyEmail({ sEmail, sWalletAddress: user.sWalletAddress });
  };

  const handleVerifyOtp = () => {
    if (!otp) {
      showToast('Please enter the OTP', 'error');
      return;
    }
    console.log('Verifying OTP:', {
      sWalletAddress: user.sWalletAddress,
      sEmail,
      otp,
    });
    mutateVerifyOtp({ sWalletAddress, sEmail, nOtp: otp });
    setOtp('');
  };

  const handleResendOtp = () => {
    if (isResendPending || countdown > 0) {
      return;
    }
    mutateResendOtp({
      sWalletAddress: user.sWalletAddress || sWalletAddress,
      sEmail,
    });
  };

  const handleChangeEmail = () => {
    setIsOtpSent(false);
    setOtp('');
  };

  const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail.length > 0 && !emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  const handleSaveUsername = async () => {
    if (!sUsername) {
      showToast('Please enter a username', 'error');
      return;
    }
    try {
      mutateSetUsername({ sWalletAddress: user.sWalletAddress, sUsername });
      setUsername('');
    } catch (err) {
      showToast('Failed to save username', 'error');
      console.error(err);
    }
  };
  const handleUsernameChange = (e) => {
  const value = e.target.value;

  const usernameRegex = /^(?!.*\s)[a-zA-Z][a-zA-Z0-9_]{1,28}[a-zA-Z0-9]$/;

  if (!usernameRegex.test(value)) {
    setUsernameError('Username is not valid.');
  } else {
    setUsernameError('');
  }

  setUsername(value);
};

  return (
    <div className='text-white max-w-md mx-auto bg-gray-800 backdrop-blur-lg p-6 rounded-lg shadow-lg'>
      <p>Wallet Address: {user.sWalletAddress}</p>

      {!isOtpSent && !user?.isVerified ? (
        <>
          <label className='block mt-4'>
            Email:
            <input
              type='email'
              value={sEmail}
              onChange={handleEmailChange}
              className='mt-2 p-2 w-full bg-gray-700 text-white rounded'
              placeholder='Enter your email'
            />
          </label>
          {emailError && (
            <p className='text-red-500 text-sm mt-1'>{emailError}</p>
          )}
          <button
            onClick={handleVerifyEmail}
            disabled={isPendingVerifyingEmail}
            className='mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition'
          >
            {isPendingVerifyingEmail ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </>
      ) : null}

      {isOtpSent && !user?.isVerified && (
        <>
          <label className='block mt-4'>
            OTP:
            <input
              type='text'
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className='mt-2 p-2 w-full bg-gray-700 text-white rounded'
              placeholder='Enter 6-digit OTP'
              maxLength={6}
            />
          </label>
          <button
            onClick={handleVerifyOtp}
            disabled={isPendingVerifyingOtp || otp.length !== 6}
            className='mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition'
          >
            {isPendingVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}
          </button>
          <button
            onClick={handleChangeEmail}
            className='px-4 py-2 ml-5 bg-blue-600 text-white rounded hover:bg-blue-700 transition'
          >
            Change Email
          </button>

          {countdown > 0 ? (
            <p className='mt-4 text-gray-400'>
              Resend OTP in 00:{countdown < 10 ? `0${countdown}` : countdown}{' '}
              seconds
            </p>
          ) : (
            <div className='mt-4 flex gap-4'>
              <button
                onClick={handleResendOtp}
                disabled={isResendPending}
                className='px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition'
              >
                {isResendPending ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          )}
        </>
      )}

      {user?.isVerified && !user?.sUsername && (
        <>
          <label className='block mt-6'>
            Username:
            <input
              type='text'
              value={sUsername}
              maxLength={12}
              onChange={handleUsernameChange}
              className='mt-2 p-2 w-full bg-gray-700 text-white rounded'
              placeholder='Choose a username'
            />
          </label>
          {usernameError && (
            <p className='text-red-500 text-sm mt-2'>{usernameError}</p>
          )}
          <button
            onClick={handleSaveUsername}
            disabled={!sUsername || usernameError}
            className='mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition'
          >
            Save Username
          </button>
        </>
      )}
    </div>
  );
};

export default UserEmail;
