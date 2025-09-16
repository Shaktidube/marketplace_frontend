import React, { useState } from 'react';
import { erc721Abi, getContractInstance, showToast } from '../utils/helper';
import { FaSpinner } from 'react-icons/fa';
import { useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const ListForSell = () => {
  const [isListing, setIsListing] = useState(false);

  const [formData, setFormData] = useState({
    sTokenAddress: '',
    nTokenId: '',
    nPrice: '',
  });

  const [errors, setErrors] = useState({});
  const { walletProvider } = useAppKitProvider('eip155');
  const navigate = useNavigate();

  const validatePrice = (value) => {
    if (!value.trim()) {
      return 'NFT Price is required';
    }
    const parsedPrice = parseFloat(value);
    if (isNaN(parsedPrice)) {
      return 'Invalid price. Please enter a valid number.';
    }
    if (parsedPrice <= 0) {
      return 'Price must be greater than zero.';
    }
    const decimalIndex = value.indexOf('.');
    if (decimalIndex !== -1) {
      const decimalPart = value.slice(decimalIndex + 1);
      if (decimalPart.length > 3) {
        return 'Price can have at most 3 decimal places (e.g., 0.123 ETH).';
      }
    }
    return '';
  };

  // Full form validation
  const validateForm = () => {
    const newErrors = {};

    // Token Address validation
    if (!formData.sTokenAddress.trim()) {
      newErrors.sTokenAddress = 'Token Address is required';
    } else if (!ethers.isAddress(formData.sTokenAddress)) {
      newErrors.sTokenAddress =
        'Invalid Ethereum address (must start with 0x and be 42 characters)';
    }

    // Token ID validation
    if (!formData.nTokenId.trim()) {
      newErrors.nTokenId = 'Token ID is required';
    } else {
      const parsedTokenId = parseInt(formData.nTokenId);
      if (isNaN(parsedTokenId)) {
        newErrors.nTokenId = 'Token ID must be a valid number';
      } else if (parsedTokenId < 0) {
        newErrors.nTokenId = 'Token ID must be greater than 0';
      }
    }

    // Price validation
    newErrors.nPrice = validatePrice(formData.nPrice);

    // Set errors and return if valid
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    // Validate form before proceeding
    if (!validateForm()) {
      showToast('Please correct the errors in the form.', 'error');
      return;
    }

    setIsListing(true);
    try {
      // Marketplace contract
      const { contract: marketplace } =
        await getContractInstance(walletProvider);
      const nftContract = new Contract(
        formData.sTokenAddress,
        erc721Abi,
        (await getContractInstance(walletProvider)).signer
      );

      const priceInWei = ethers.parseEther(formData.nPrice.trim());
      const tokenId = parseInt(formData.nTokenId);

      console.log('Approving marketplace...');
      const tx = await nftContract.approve(
        import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
        tokenId
      );
      await tx.wait();
      console.log('NFT APPROVED');

      console.log('Listing on marketplace...');
      const sellTx = await marketplace.createSale(
        formData.sTokenAddress,
        tokenId,
        priceInWei
      );
      await sellTx.wait();
      console.log('NFT LISTED FOR SALE');

      showToast('NFT listed for sale successfully!', 'success');
      setIsListing(false);
      setFormData({
        sTokenAddress: '',
        nTokenId: '',
        nPrice: '',
      });
      navigate('/buy-sell');

      // await delay(10000);

      // setisListing(false);
      // showToast("NFT listed for sale successfully!", "success");
      // navigate('/buy-sell');
    } catch (error) {
      console.error('Error listing NFT for sale:', error);
      let errorMessage =
        'Failed to list NFT for sale. Please check inputs and try again.';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user.';
      } else if (error.reason === 'Market: Token Already Listed') {
        errorMessage = 'Token is already listed for sale.';
      } else if (error.code === 'CALL_EXCEPTION') {
        errorMessage = 'CALL_EXCEPTION!! Contract error occurred.';
      }
      showToast(errorMessage, 'error');
      setIsListing(false);
    } finally {
      setFormData({
        sTokenAddress: '',
        nTokenId: '',
        nPrice: '',
      });
      setIsListing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let cleanedValue = value;
    if (name === 'nPrice') {
      if (cleanedValue.toLowerCase().includes('e')) {
        cleanedValue = cleanedValue.replace(/e/gi, '');
      }

      cleanedValue = cleanedValue.replace(/[^0-9.]/g, '');

      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts.length === 2 && parts[1].length > 3) {
        cleanedValue = parts[0] + '.' + parts[1].slice(0, 3);
      }
    }

    setFormData((prevFormData) => ({ ...prevFormData, [name]: cleanedValue }));

    const newErrors = { ...errors, [name]: '' };
    switch (name) {
      case 'sTokenAddress':
        if (!cleanedValue.trim()) {
          newErrors.sTokenAddress = 'Token Address is required';
        } else if (!ethers.isAddress(cleanedValue)) {
          newErrors.sTokenAddress =
            'Invalid Ethereum address (must start with 0x and be 42 characters)';
        }
        break;

      case 'nTokenId':
        if (!cleanedValue.trim()) {
          newErrors.nTokenId = 'Token ID is required';
        } else {
          const parsedTokenId = parseInt(cleanedValue);
          if (isNaN(parsedTokenId)) {
            newErrors.nTokenId = 'Token ID must be a valid number';
          } else if (parsedTokenId < 0) {
            newErrors.nTokenId = 'Token ID must be greater than 0';
          }
        }
        break;

      case 'nPrice':
        newErrors.nPrice = validatePrice(cleanedValue);
        break;

      default:
        newErrors[name] = '';
        break;
    }

    setErrors(newErrors);
  };

  return (
    <div className='flex flex-col items-center justify-center p-6 bg-gradient-to-br'>
      {isListing && (
        <div className='fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50'>
          <div className='flex flex-col items-center p-8 rounded-lg shadow-2xl animate-pulse'>
            <FaSpinner className='text-6xl text-teal-500 animate-spin mb-4' />
            <p className='text-xl font-semibold text-gray-100'>
              Listing NFT...
            </p>
            <p className='text-sm text-gray-100 mt-2'>
              This may take a moment.
            </p>
          </div>
        </div>
      )}

      <div className='w-[500px] p-8 rounded-xl shadow-2xl bg-gray-950/60 backdrop-blur-lg border border-white/20'>
        <h2 className='text-3xl font-extrabold text-gray-300 mb-6 text-center'>
          List NFT for Sale
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Token Address */}
          <div>
            <label
              htmlFor='sTokenAddress'
              className='block text-sm font-medium text-gray-200'
            >
              Token Address (NFT Contract)
            </label>
            <input
              type='text'
              id='sTokenAddress'
              name='sTokenAddress'
              value={formData.sTokenAddress}
              onChange={handleChange}
              className={`w-full px-4 py-3 mt-1 bg-gray-700/50 border rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-200 placeholder-gray-500 ${
                errors.sTokenAddress ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder='0x... (Enter NFT contract address)'
            />
            {errors.sTokenAddress && (
              <p className='text-red-400 text-xs mt-2'>
                {errors.sTokenAddress}
              </p>
            )}
          </div>

          {/* Token ID */}
          <div>
            <label
              htmlFor='nTokenId'
              className='block text-sm font-medium text-gray-200'
            >
              Token ID
            </label>
            <input
              type='number'
              id='nTokenId'
              name='nTokenId'
              value={formData.nTokenId}
              onChange={handleChange}
              min='0'
              className={`w-full px-4 py-3 mt-1 bg-gray-700/50 border rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-200 placeholder-gray-500 ${
                errors.nTokenId ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder='Enter NFT Token ID (e.g., 1)'
            />
            {errors.nTokenId && (
              <p className='text-red-400 text-xs mt-2'>{errors.nTokenId}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor='nPrice'
              className='block text-sm font-medium text-gray-200'
            >
              Price (in ETH)
            </label>
            <input
              type='number'
              id='nPrice'
              name='nPrice'
              value={formData.nPrice}
              onChange={handleChange}
              step='0.001'
              min='0.001'
              className={`w-full px-4 py-3 mt-1 bg-gray-700/50 border rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-200 placeholder-gray-500 ${
                errors.nPrice ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder='e.g., 0.123 ETH (max 3 decimals)'
            />
            {errors.nPrice && (
              <p className='text-red-400 text-xs mt-2'>{errors.nPrice}</p>
            )}
            <p className='text-gray-500 text-xs mt-1'>
              Max 3 decimal places (e.g., 0.123 ETH)
            </p>
          </div>

          <button
            type='submit'
            disabled={isListing || Object.values(errors).some(Boolean)}
            className='w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-700 text-white font-bold rounded-lg shadow-lg hover:from-teal-700 hover:to-blue-800 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isListing && <FaSpinner className='animate-spin' />}
            {isListing ? 'Listing...' : 'List NFT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListForSell;
