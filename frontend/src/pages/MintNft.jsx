import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  getContractInstance,
  getItemFromLocalStorage,
  handle409Error,
  showToast,
} from '../utils/helper';
import { FaSpinner } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { uploadFile } from '../api/user';
import { useAppKitProvider } from '@reown/appkit/react';
import { Contract, BrowserProvider } from 'ethers';
import { Navigate, useNavigate } from 'react-router-dom';

const MintNft = () => {
  const sToken = getItemFromLocalStorage('userToken');
  const user = useSelector((state) => state.auth.user);
  const [errors, setErrors] = useState({});
  const [isMinting, setIsMinting] = useState(false);
  const { walletProvider } = useAppKitProvider('eip155');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sNftName: '',
    sImageUrl: '',
    nNftDescription: '',
    nRoyalty: '',
  });

  const { mutate: mutateUploadFile, isLoading: isUploading } = useMutation({
    mutationFn: (file) =>
      uploadFile(
        file,
        formData.sNftName,
        formData.nNftDescription,
        formData.nRoyalty,
        import.meta.env.VITE_MINT_CONTRACT_ADDRESS
      ),
    onSuccess: (data) => {
      const { sMetadataUrl } = data.data;
      mintNft(sMetadataUrl, formData.nRoyalty);
      console.log('nft minting...');
    },
    onError: (error) => {
      handle409Error(error);
      setIsMinting(false);
    },
  });

  const validateRoyalty = (value) => {
    if (!value.trim()) {
      return 'NFT Royalty is required';
    }
    const parsedRoyalty = parseFloat(value);
    if (isNaN(parsedRoyalty)) {
      return 'Royalty must be a valid number.';
    }
    if (parsedRoyalty < 0 || parsedRoyalty > 99) {
      return 'NFT Royalty must be a number between 0 and 100';
    }
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      return 'Royalty can have only one decimal point.';
    }

    const decimalIndex = value.indexOf('.');
    if (decimalIndex !== -1) {
      const decimalPart = value.slice(decimalIndex + 1);
      if (decimalPart.length > 1) {
        return 'Royalty can have at most 1 decimal place (e.g., 10.5).';
      }
    }
    return '';
  };

  // Full form validation
  const validateForm = () => {
    const newErrors = {};

    // NFT Name validation
    if (!formData.sNftName.trim()) {
      newErrors.sNftName = 'NFT Name is required';
    } else if (
      formData.sNftName.trim().length < 1 ||
      formData.sNftName.trim().length > 12
    ) {
      newErrors.sNftName = 'NFT Name must be between 1 and 12 characters';
    } else if(!/^[a-zA-Z0-9 ]+$/.test(formData.sNftName.trim())) {
      newErrors.sNftName = 'NFT Name can only contain letters, numbers, and spaces';
    }

    // Royalty validation
    newErrors.nRoyalty = validateRoyalty(formData.nRoyalty);

    // Image validation
    if (!formData.sImageUrl) {
      newErrors.sImageUrl = 'NFT Image is required';
    }

    if (!formData.nNftDescription.trim()) {
      newErrors.nNftDescription = 'NFT Description is required';
    } else if (formData.nNftDescription.trim().length > 500) {
      newErrors.nNftDescription =
        'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please correct the errors in the form.', 'error');
      return;
    }

    if (!sToken) {
      showToast('Please log in to mint an NFT', 'error');
      return;
    }

    if (!formData.sImageUrl) {
      showToast('Please select an image file to upload.', 'error');
      return;
    }

    setIsMinting(true);
    mutateUploadFile(formData.sImageUrl);
  };

  const mintNft = async (ipfsurl, Royalty) => {
    try {
      console.log('royalty is:', Royalty);
      const parsedRoyalty = parseFloat(Royalty) * 100;
      console.log('parsedRoyalty', parsedRoyalty);

      const { mintContract } = await getContractInstance(walletProvider);
      console.log('mint contract instance', mintContract);

      const tx = await mintContract.safeMint(
        user.sWalletAddress,
        ipfsurl,
        parsedRoyalty
      );

      const rTX = await tx.wait();
      console.log('Transaction successful with hash:', rTX);

      setIsMinting(false);
      showToast('NFT minted successfully! will notify soon!!', 'success');
      navigate('/profile', { replace: true });
      console.log('data:', tx);

      setFormData({
        sNftName: '',
        nRoyalty: '',
        sImageUrl: '',
        nNftDescription: '',
      });
      console.log(isMinting, 'MInt status');
      // showToast("NFT minted successfully!", "success");

      // await delay(10000);
      // socket.emit("TransferEventDetected", { message: "New NFT minted" });

      // navigate("/profile", { replace: true });
    } catch (error) {
      console.log('error', error);
      setIsMinting(false);
      setFormData({
        sNftName: '',
        nRoyalty: '',
        sImageUrl: '',
        nNftDescription: '',
      });
      let errorMessage = 'An error occurred while minting the NFT.';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by you. Please try again';
      } else if (error.data) {
        errorMessage =
          error.reason || error.message || 'Contract error occurred.';
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let cleanedValue = value;
    if (name === 'nRoyalty') {
      cleanedValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts.length === 2 && parts[1].length > 2) {
        cleanedValue = parts[0] + '.' + parts[1].slice(0, 2);
      }
      if (cleanedValue.startsWith('.')) {
        cleanedValue = '0' + cleanedValue;
      }
    }

    setFormData((prevFormData) => ({ ...prevFormData, [name]: cleanedValue }));

    const newErrors = { ...errors, [name]: '' };
    switch (name) {
      case 'sNftName':
        if (!cleanedValue.trim()) {
          newErrors.sNftName = 'NFT Name is required';
        } else if (
          cleanedValue.trim().length < 1 ||
          cleanedValue.trim().length > 100
        ) {
          newErrors.sNftName = 'NFT Name must be between 1 and 100 characters';
        } else if(!/^[A-Za-z](?:[A-Za-z0-9]|(?<![_\-.\s])[_\-.\s](?![_\-.\s])){0,48}[A-Za-z0-9]$|^[A-Za-z]$/.test(cleanedValue.trim())) {
          newErrors.sNftName = 'NFT Name can only contain letters, numbers, and spaces';
        }
        break;

      case 'nRoyalty':
        newErrors.nRoyalty = validateRoyalty(cleanedValue);
        break;

      case 'nNftDescription':
        if (!cleanedValue.trim()) {
          newErrors.nNftDescription = 'NFT Description is required';
        } else if (cleanedValue.trim().length > 500) {
          newErrors.nNftDescription =
            'Description must be less than 500 characters';
        }
        break;

      default:
        newErrors[name] = '';
        break;
    }

    setErrors(newErrors);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, sImageUrl: file }));
      setErrors((prev) => ({ ...prev, sImageUrl: '' }));
    }
  };

  return (
    <div className='flex flex-col items-center justify-center p-6 bg-gradient-to-br'>
      {isMinting && (
        <div className='fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50'>
          <div className='flex flex-col items-center p-8 rounded-lg shadow-2xl animate-pulse'>
            <FaSpinner className='text-6xl text-teal-500 animate-spin mb-4' />
            <p className='text-xl font-semibold text-gray-100'>
              {isUploading ? 'Uploading...' : 'Minting NFT...'}
            </p>
            <p className='text-sm text-gray-100 mt-2'>
              This may take a moment.
            </p>
          </div>
        </div>
      )}

      <div className='w-[500px] p-8 rounded-xl shadow-2xl bg-gray-950/60 backdrop-blur-lg border border-white/20'>
        <h2 className='text-3xl font-extrabold text-gray-300 mb-6 text-center'>
          Mint New NFT
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* NFT Name */}
          <div>
            <label
              htmlFor='sNftName'
              className='block text-sm font-medium text-gray-200'
            >
              NFT Name
            </label>
            <input
              type='text'
              id='sNftName'
              name='sNftName'
              value={formData.sNftName}
              onChange={handleChange}
              className={`w-full px-4 py-3 mt-1 bg-gray-700/50 border rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-200 placeholder-gray-500 ${
                errors.sNftName ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder='Enter NFT name (1-12 characters)'
              maxLength='12'
            />
            {errors.sNftName && (
              <p className='text-red-400 text-xs mt-2'>{errors.sNftName}</p>
            )}
          </div>

          {/* NFT Royalty */}
          <div>
            <label
              htmlFor='nRoyalty'
              className='block text-sm font-medium text-gray-200'
            >
              NFT Royalty (%)
            </label>
            <input
              type='number'
              id='nRoyalty'
              name='nRoyalty'
              value={formData.nRoyalty}
              onChange={handleChange}
              step='0.01'
              min='0'
              max='100'
              className={`w-full px-4 py-3 mt-1 bg-gray-700/50 border rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-200 placeholder-gray-500 ${
                errors.nRoyalty ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder='e.g., 10.5 (0-100, one decimal point)'
            />
            {errors.nRoyalty && (
              <p className='text-red-400 text-xs mt-2'>{errors.nRoyalty}</p>
            )}
            <p className='text-gray-500 text-xs mt-1'>
              Enter royalty percentage (0-100, e.g., 10.5)
            </p>
          </div>

          {/* Image */}
          <div>
            <label
              htmlFor='sImageUrl'
              className='block text-sm font-medium text-gray-300'
            >
              Image
            </label>
            <input
              type='file'
              id='sImageUrl'
              name='sImageUrl'
              onChange={handleFileChange}
              accept='image/*'
              className={`w-full text-sm mt-1 text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition duration-300 ${
                  errors.sImageUrl
                    ? 'border-red-500 file:bg-red-500 file:text-gray-100 hover:file:text-gray-900'
                    : 'border-gray-300'
                }`}
            />
            {errors.sImageUrl && (
              <p className='text-red-400 text-xs mt-2'>{errors.sImageUrl}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor='nNftDescription'
              className='block text-sm font-medium text-gray-300'
            >
              Description
            </label>
            <textarea
              id='nNftDescription'
              name='nNftDescription'
              value={formData.nNftDescription}
              onChange={handleChange}
              rows='3'
              maxLength='500'
              className={`w-full px-4 py-3 mt-1 bg-gray-700/50 border rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-200 placeholder-gray-500 ${
                errors.nNftDescription ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder='Enter NFT description (max 500 characters)'
            />
            {errors.nNftDescription && (
              <p className='text-red-400 text-xs mt-2'>
                {errors.nNftDescription}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={
              isUploading || isMinting || Object.values(errors).some(Boolean)
            } // Disable on errors
            className='w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-700 text-white font-bold rounded-lg shadow-lg hover:from-teal-700 hover:to-blue-800 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {(isUploading || isMinting) && (
              <FaSpinner className='animate-spin' />
            )}
            {isUploading
              ? 'Uploading...'
              : isMinting
                ? 'Minting...'
                : 'Mint NFT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MintNft;
