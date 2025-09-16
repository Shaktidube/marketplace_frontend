import { BrowserProvider, Contract, ethers } from 'ethers';
import toast from 'react-hot-toast';
import abi from './abis/abi.json';
import tokenAbi from './abis/tokenAbi.json';
import { useQueryClient } from '@tanstack/react-query';

export const getItemFromLocalStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    // console.log(`Retrieved  from localStorage:`, value);
    return value;
  } catch (error) {
    console.error(`Error getting  from localStorage:`, error);
    return null;
  }
};

export const setItemFromLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting  in localStorage:`, error);
    throw new Error(
      'Unable to store data. Please disable private browsing or check browser settings.'
    );
  }
};

export const removeItemFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    console.log(`Removed from localStorage`);
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
  }
};

export const handle409Error = (error) => {
  if (error.data.message && error.status === 409) {
    toast.error(error.data.message);
  }
};

export const handle422Error = (error) => {
  if (error.data.message && error.status === 422) {
    toast.error(error.data.message);
  }
};

export const handleCopyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const showToast = (message, type = 'success') => {
  switch (type) {
    case 'success':
      toast.remove();
      toast.success(message);
      break;
    case 'error':
      toast.remove();
      toast.error(message);
      break;
    case 'loading':
      toast.remove();
      toast.loading(message);
      break;
    default:
      toast.remove();
      toast(message);
      break;
  }
};

export const getContractInstance = async (walletProvider) => {
  if (!walletProvider) throw new Error('Wallet provider not found');

  const ethersProvider = new BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();

  const contract = new Contract(
    import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
    abi,
    signer
  );
  const mintContract = new Contract(
    import.meta.env.VITE_MINT_CONTRACT_ADDRESS,
    // "0x5f7a2BE4AF497Ce147180810DC03FED676542F7f",
    tokenAbi,
    signer
  );

  return { contract, signer, mintContract };
};

export const handleBuyNFt = async (nft, walletProvider) => {
  try {
    console.log('handleBuyNFt called with nft:', nft);
    const { contract } = await getContractInstance(walletProvider);

    const priceInEth = nft.nNftPrice.toString();

    const priceInWei = ethers.parseEther(priceInEth);

    console.log('Buying NFT:', nft);

    const buyTx = await contract.buyToken(
      // import.meta.env.VITE_MINT_CONTRACT_ADDRESS,
      // "0x5A2481Ff023A4E4Bc3899Aaba142AA8d8ca18Fe4",
      nft.sTokenAddress,
      nft.nTokenId,
      { value: priceInWei }
    );

    await buyTx.wait();

    console.log('NFT BOUGHT');

    const txHash = buyTx.hash;
    console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

    return { success: true };
  } catch (error) {
    console.error('Error buying NFT:', error);
    if (error.code === 'ACTION_REJECTED') {
      showToast('Transaction rejected by user.', 'error');
      throw new Error('Transaction rejected by user');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      showToast('Insufficient funds', 'error');
      throw new Error('Insufficient funds');
    }
    throw error;
  }
};

export const cancelListing = async (nft, walletProvider) => {
  try {
    const { contract } = await getContractInstance(walletProvider);

    console.log('Cancelling listing for NFT:', nft);

    // const ethersProvider = new BrowserProvider(walletProvider);
    // const signer = await ethersProvider.getSigner();

    console.log('Creating mintContract instance for NFT approval:', nft);

    // const mintContract = new Contract(
    //   nft.sTokenAddress,
    //   tokenAbi,
    //   signer
    // );

    // const tx = await mintContract.approve(ethers.ZeroAddress, nft.nTokenId);
    // await tx.wait();
    // console.log("NFT approval to zero address done");

    const cancelTx = await contract.cancelSale(
      // import.meta.env.VITE_MINT_CONTRACT_ADDRESS,
      // "0x5A2481Ff023A4E4Bc3899Aaba142AA8d8ca18Fe4",
      nft.sTokenAddress,
      nft.nTokenId
    );

    await cancelTx.wait();

    console.log('NFT listing cancelled');

    return { success: true };
  } catch (error) {
    console.error('Error cancelling NFT listing:', error);
    if (error.code === 'ACTION_REJECTED') {
      showToast('Transaction rejected by user.', 'error');
      throw new Error('Transaction rejected by user');
    }
    throw error;
  }
};

export const erc721Abi = [
  // Approve another address to transfer the given token ID
  'function approve(address to, uint256 tokenId) external',

  // Get the approved address for a token
  'function getApproved(uint256 tokenId) external view returns (address)',

  // Return the owner of a token
  'function ownerOf(uint256 tokenId) external view returns (address)',

  // Return the name of the token
  'function name() external view returns (string)',

  // Return the symbol
  'function symbol() external view returns (string)',
];

export const useSocket = (socket, user, navigate) => {
  useEffect(() => {
    console.log('socket connected?', socket.connected, socket);
    if (!socket.connected) {
      socket.connect();
      console.log('socket connected', socket);
    }

    socket.on('connect', () => {
      console.log('socket connected', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log(`Connection error: ${err}`);
    });

    socket.on('TransferEventDetected', (data) => {
      console.log('TransferEventDetected received:', data);
      showToast('NFT transferred successfully!', 'success');
      navigate('/profile');
    });

    socket.on('ListedEventDetected', (data) => {
      console.log('ListedEventDetected received:', data);
      showToast('NFT listed for sale successfully!', 'success');
      navigate('/buy-sell');
    });

    socket.on('BuySuccessEventDetected', (data) => {
      console.log('BuySuccessEventDetected received:', data);
      showToast('NFT bought successfully!', 'success');
      navigate('/profile');
    });

    socket.on('CancelListingEventDetected', (data) => {
      console.log('CancelListingEventDetected received:', data);
      showToast('NFT listing cancelled successfully!', 'success');
      navigate('/profile');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('connection_success');
    };
  }, [user.sWalletAddress, navigate]);
};

export const invalidateQueries = (queryClient) => {
  queryClient.invalidateQueries(['profile']);
  queryClient.invalidateQueries(['buy-nfts']);
  queryClient.invalidateQueries(['nfts']);
  queryClient.invalidateQueries(['nftDetail']);
};
