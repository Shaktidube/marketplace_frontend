import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { use, useCallback, useEffect, useState } from 'react';
import { getNftById } from '../api/user';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MdContentCopy } from 'react-icons/md';
import {
  cancelListing,
  getContractInstance,
  handleBuyNFt,
  handleCopyToClipboard,
  showToast,
} from '../utils/helper';
import SellModal from '../components/SellModal';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { useAppKitProvider } from '@reown/appkit/react';
import { FaSpinner } from 'react-icons/fa';
import tokenAbi from '../utils/abis/tokenAbi.json';
import AuctionModal from '../components/AuctionModal';
import { motion, AnimatePresence } from 'framer-motion';

const queryKey = {
  nftDetail: (nftId) => ['nftDetail', nftId],
};

const NFtDetail = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { nftId } = useParams();
  const { walletProvider } = useAppKitProvider('eip155');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);
  const [isListing, setIsListing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedNftForBid, setSelectedNftForBid] = useState(null);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [minimumBidRequiredEth, setMinimumBidRequiredEth] = useState(0);
  const [status, setStatus] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [isClaimingNft, setIsClaimingNft] = useState(false);
  const [isSettle , setIsSettle] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log('nftId from params:', nftId);

  const { data } = useQuery({
    queryKey: queryKey.nftDetail(nftId),
    queryFn: () => getNftById(nftId),
    staleTime: 5000,
    cacheTime: 10 * 60 * 1000,
  });

  const handleSellClick = useCallback((nft) => {
    setSelectedNft(nft);
    setIsSellModalOpen(true);
  }, []);

  const handleAuctionClick = useCallback((nft) => {
    setSelectedNft(nft);
    setIsAuctionModalOpen(true);
  }, []);

  const handlePlaceBidClick = useCallback((nft) => {
    try {
      
      setSelectedNftForBid(nft);
      setIsBidModalOpen(true);
  
      const minimumREquiredBid =
        nft.oAuctionDetails.nHighestBid > 0
          ? parseFloat(nft.oAuctionDetails.nHighestBid) * 1.0001
          : parseFloat(nft.oAuctionDetails.nBasePrice);
      setMinimumBidRequiredEth(minimumREquiredBid);
    } catch (error) {
      setSelectedNftForBid("");
      setIsBidModalOpen(false);
      
    }
  }, []);

  const onConfirmSell = async (nft, price) => {
    try {
      setIsSellModalOpen(true);
      console.log('sell modal is open ');
      console.log('NFT to sell:', nft);
      console.log('Selling price:', price);

      const { contract } = await getContractInstance(walletProvider);

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();

      console.log('Creating mintContract instance for NFT approval:', nft);

      const mintContract = new Contract(
        data.data.nft.sTokenAddress,
        tokenAbi,
        signer
      );
      // const setPlatform = await contract.setPlatform(import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS);
      // await setPlatform.wait();
      // console.log("Platform set in marketplace contract" , setPlatform);

      console.log('Approving NFT for sale...', nft);

      const tx = await mintContract.approve(
        import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
        data.data.nft.nTokenId
      );
      setIsListing(true);
      await tx.wait();
      console.log('NFT APPROVED');

      const sellTx = await contract.createSale(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        price
      );
      const rTx = await sellTx.wait();
      // showToast("success! We will notify you when it's available", "success");
      console.log('NFT LISTED FOR SALE', rTx);

      setIsListing(false);
      setIsSellModalOpen(false);
      navigate('/buy-sell');

      // await delay(10000);
      // setIsListing(false);
      // setIsSellModalOpen(false);

      // navigate('/buy-sell');
    } catch (error) {
      setIsListing(false);
      setIsSellModalOpen(false);
      console.error('Error listing NFT for sale:', error);
      if (error.code === 'ACTION_REJECTED') {
        showToast('Transaction rejected by user.', 'error');
      } else if (error.reason === null) {
        showToast('Insufficient funds!! NFt is blocked!', 'error');
      }
      console.log('error code : ', error.code);
    }
  };

  const handleBuyBtnNFt = async () => {
    try {
      setIsBuying(true);
      const result = await handleBuyNFt(data.data.nft, walletProvider);
      if (result && result.success) {
        console.log('Buying transaction successful');
        // await delay(10000);
        // setIsBuying(false);
        // navigate('/profile');
        return;
      }
    } catch (error) {
      console.log(error, 'error in buying nft');
    } finally {
      setIsBuying(false);
    }
  };

  const handleCancelListing = async (nft) => {
    try {
      setIsCancelling(true);
      const result = await cancelListing(nft, walletProvider);
      if (result && result.success) {
        console.log('Cancel listing transaction successful');
        setIsCancelling(false);
        // await delay(10000);
        // navigate('/profile');
        return;
      }
    } catch (error) {
      console.log(error, 'error in cancelling nft listing');
    } finally {
      setIsCancelling(false);
    }
  };

  const onConfirmAuction = async (nft, startingPrice, startTime, endTime) => {
    try {
      setIsAuctionModalOpen(true);
      console.log('Auction modal is open ');
      console.log('NFT to auction:', nft);
      console.log('Starting price:', startingPrice);
      console.log('End time (timestamp):', endTime);

      const { contract } = await getContractInstance(walletProvider);

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();

      console.log('Creating mintContract instance for NFT approval:', nft);

      const mintContract = new Contract(
        data.data.nft.sTokenAddress,
        tokenAbi,
        signer
      );

      console.log('Approving NFT for auction...', nft);

      const tx = await mintContract.approve(
        import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
        data.data.nft.nTokenId
      );
      setIsListing(true);
      await tx.wait();
      console.log('NFT APPROVED');

      console.log('Creating auction...');
      console.log(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        startTime,
        endTime,
        typeof startingPrice
      );

      const auctionTx = await contract.createAuction(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        startTime,
        endTime,
        startingPrice
      );
      const rTx = await auctionTx.wait();
      console.log('NFT LISTED FOR AUCTION', rTx);

      setIsListing(false);
      setIsAuctionModalOpen(false);
      navigate('/buy-sell');

      const nPriceInEth = parseFloat(startingPrice);
      console.log('Starting Price in ETH:', nPriceInEth);

      setIsListing(false);
      setIsSellModalOpen(false);

      navigate('/home');
    } catch (error) {
      setIsListing(false);
      setIsAuctionModalOpen(false);
      console.error('Error listing NFT for auction:', error);
      if (error.code === 'ACTION_REJECTED') {
        showToast('Transaction rejected by user.', 'error');
      } else if (error.reason === null) {
        showToast('Insufficient funds!! NFt is blocked!', 'error');
      } else if (error.reason === 'Market : Token already listed') {
        showToast('NFT is already listed in auction or sale', 'error');
      }
      console.log('error code : ', error.code);
    }
  };

  const handlePlaceBid = async (nft) => {
    try {
      setSelectedNftForBid(nft);
      setIsBidModalOpen(true);
      setIsBidding(true);
      setIsProcessing(true);

      console.log('handlePlaceBid called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('Place bid:', nft);
      console.log('Bid amount input:', bidAmountInput);

      const priceInWei = ethers.parseEther(bidAmountInput);
      console.log('price in wei', priceInWei.toString());

      const bidTx = await contract.PlaceBid(
        // import.meta.env.VITE_MINT_CONTRACT_ADDRESS,
        // "0x5A2481Ff023A4E4Bc3899Aaba142AA8d8ca18Fe4",
        nft.sTokenAddress,
        nft.nTokenId,
        { value: priceInWei }
      );

      await bidTx.wait();
      setIsBidModalOpen(false);
      setSelectedNftForBid('');
      setIsBidding(false);

      console.log('BID PLACED');

      const txHash = bidTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error placing bid:', error);
      if (error.code === 'ACTION_REJECTED') {
        showToast('Transaction rejected by user.', 'error');
        throw new Error('Transaction rejected by user');
      }
      if (error.code === 'INSUFFICIENT_FUNDS') {
        showToast('Insufficient funds', 'error');
        throw new Error('Insufficient funds');
      }
      throw error;
    } finally {
      setIsBidding(false);
      setIsProcessing(true);

    }
  };

  const handleSettleAuction = async (nft) => {
    console.log('handleSettleAuction called with nft:', nft);
    try {
      setIsSettle(true);
      console.log('handleSettleAuction called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('auction settlement', nft);

      const NftClaimTx = await contract.WinnerNFT(
        nft.sTokenAddress,
        nft.nTokenId
      );

      await NftClaimTx.wait();

      console.log('NFT CLAIMED');

      const txHash = NftClaimTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error claiming NFT:', error);
      if (error.code === 'ACTION_REJECTED') {
        showToast('Transaction rejected by user.', 'error');
        throw new Error('Transaction rejected by user');
      }
      if (error.code === 'INSUFFICIENT_FUNDS') {
        showToast('Insufficient funds', 'error');
        throw new Error('Insufficient funds');
      }
      throw error;
    } finally {
      setIsSettle(false);
    }
  };

  const handleWinnerNft = async (nft) => {
    try {
      setIsClaimingNft(true);
      console.log('handleBuyNFt called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('winner claim nft', nft);

      const NftClaimTx = await contract.WinnerNFT(
        nft.sTokenAddress,
        nft.nTokenId
      );

      await NftClaimTx.wait();

      console.log('NFT CLAIMED');

      const txHash = NftClaimTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error claiming NFT:', error);
      if (error.code === 'ACTION_REJECTED') {
        showToast('Transaction rejected by user.', 'error');
        throw new Error('Transaction rejected by user');
      }
      if (error.code === 'INSUFFICIENT_FUNDS') {
        showToast('Insufficient funds', 'error');
        throw new Error('Insufficient funds');
      }
      throw error;
    } finally {
      setIsClaimingNft(false);
    }
  };

  const handleReclaimNft = async (nft) => {
    try {
      setIsReclaiming(true);
      console.log('handleReclaimNft called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('winner claim nft', nft);

      const NftReClaimTx = await contract.ReclaimNft(
        nft.sTokenAddress,
        nft.nTokenId
      );

      await NftReClaimTx.wait();

      console.log('NFT RECLAIMED');

      const txHash = NftReClaimTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error reclaiming NFT:', error);
      if (error.code === 'ACTION_REJECTED') {
        showToast('Transaction rejected by user.', 'error');
        throw new Error('Transaction rejected by user');
      }
      if (error.code === 'INSUFFICIENT_FUNDS') {
        showToast('Insufficient funds', 'error');
        throw new Error('Insufficient funds');
      }
      throw error;
    } finally {
      setIsReclaiming(false);
    }
  };

  if (!data) return null;

  const nft = data.data.nft;

  const nftDataForModal = {
    image: nft.sImageUrl,
    name: nft.sNftName,
    symbol: '',
    mintAddress: nft.sToAddress,
    tokenId: nft.nTokenId,
  };

  const { dStartTime, dEndTime, sSettlementTime, nHighestBid, sHighestBidder } = nft.oAuctionDetails;
  const now = Math.floor(Date.now() / 1000);
  
  const isAuctionActive = nft.isApprovedForAuction &&
  parseInt(dStartTime) < now &&
  parseInt(dEndTime) > now;
  
  const isAuctionEnded = nft.isApprovedForAuction && parseInt(dEndTime) <= now;
  const hasBids = nft.oAuctionDetails.nHighestBid > 0;
  const isSettlementPeriod = isAuctionEnded && now > parseInt(sSettlementTime);
  const isOwner = user.sWalletAddress === nft.sCurrentOwner;
  const isHighestBidder = sHighestBidder === user.sWalletAddress;

  // console.log(isSettlementPeriod , 'isSettlementPeriod');
  // console.log(
  //   'nft details:',
  //   nft,
  //   isOwner,
  //   isAuctionActive,
  //   isAuctionPending,
  //   isAuctionSettling,
  //   isAuctionEnded,
  //   now,
  //   dStartTime,
  //   dEndTime,
  //   sSettlementTime
  // );

  const renderTimer = () => (
    <CountdownTimer
      startTime={parseInt(dStartTime)}
      endTime={parseInt(dEndTime)}
      settlementTime={parseInt(sSettlementTime)}
      handleSettleAuction={handleSettleAuction}
      nft={nft}
    />
  );

  const renderOwnerActions = () => (
    <div className='flex space-x-4 mt-8'>
      <button
        onClick={handleSellClick}
        className='w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition'
        disabled={isListing || isBuying}
        aria-label='Put on sale'
      >
        Put on Sell
      </button>
      <button
        onClick={handleAuctionClick}
        className='w-full px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition'
        disabled={isListing || isBuying}
        aria-label='Put on auction'
      >
        Put on Auction
      </button>
    </div>
  );

  const CountdownTimer = ({ startTime, endTime, settlementTime }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      if (!startTime || !endTime || !settlementTime) return;

      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const startDiff = startTime - now;
        const endDiff = endTime - now;
        const settlementDiff = settlementTime - now;

        if (startDiff > 0) {
          const hours = Math.floor(startDiff / 3600);
          const minutes = Math.floor((startDiff % 3600) / 60);
          const seconds = startDiff % 60;
          setTimeLeft(`⏳ Auction Starts in: ${hours}h ${minutes}m ${seconds}s ⏳`);
        } else if (endDiff > 0) {
          const hours = Math.floor(endDiff / 3600);
          const minutes = Math.floor((endDiff % 3600) / 60);
          const seconds = endDiff % 60;
          setTimeLeft(`⏳ Auction Ends in: ${hours}h ${minutes}m ${seconds}s ⏳`);
        } else if (settlementDiff > 0 && isOwner) {
          const hours = Math.floor(settlementDiff / 3600);
          const minutes = Math.floor((settlementDiff % 3600) / 60);
          const seconds = settlementDiff % 60;
          setTimeLeft(
            `⏳ Auction settlement available in: ${hours}h ${minutes}m ${seconds}s ⏳`
          );
        } else {
          setTimeLeft(`Auction Ended. settlement is now available.`);
          clearInterval(interval);
          setStatus('settlement');
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [startTime, endTime, settlementTime]);

    return (
      <>
        {timeLeft && (
          <div className=''>
            <p className='text-green-400'>{timeLeft}</p>
            {status === 'settlement' && isOwner && nft.oAuctionDetails.nHighestBid > 0 ? (
              <button
                className='mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition'
                onClick={() => handleSettleAuction(nft)}
              >
                Settle Auction
              </button>
            ) : !isOwner && isAuctionEnded && isHighestBidder ? (
              <div className='mt-4'>
                <button
                  className='mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition'
                  onClick={() => handleSettleAuction(nft)}
                >
                 Claim Nft
                </button>
              </div>
            ) : (
              null
              // <div>
              //   <p className='text-red-500 '>Auction Ended</p>
              // </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className='p-8 space-y-8'>
      {(isBuying || isListing || isCancelling || isBidding || isReclaiming || isClaimingNft || isSettle) && (
        <div className='fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50'>
          <div className='flex flex-col items-center p-8 rounded-lg shadow-2xl animate-pulse'>
            <FaSpinner className='text-6xl text-teal-500 animate-spin mb-4' />
            <p className='text-xl font-semibold text-gray-100'>
              {isBuying
                ? 'Processing Purchase...'
                : isListing
                ? 'Listing NFT...'
                : isCancelling
                ? 'Cancelling Listing...'
                : isBidding
                ? 'Placing your bid...'
                : isReclaiming
                ? 'Reclaiming your NFT...'
                : isClaimingNft
                ? 'Claiming your NFT...'
                : isSettle
                ? 'Settling the auction...'
                : ''}
            </p>
            <p className='text-sm text-gray-100 mt-2'>
              This may take a moment.
            </p>
          </div>
        </div>
      )}

      <h1 className='text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center uppercase tracking-wider'>
        <div className='absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:skew-y-1 before:-translate-x-screen before:animate-auto-shine-screen'></div>
        <div className='relative text-gray-200'>NFT Detail</div>
      </h1>

      <div className='flex space-y-8 mt-8 border-2 border-gray-700 p-8 rounded-lg shadow-lg bg-gray-800/60 backdrop-blur-lg'>
        <div className='flex flex-col items-center space-y-6'>
          <img
            src={nft.sImageUrl}
            alt={nft.sNftName}
            className='w-96 h-108 object-cover rounded-lg cursor-pointer hover:opacity-80 transition'
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        <div className='flex flex-col space-y-2 ml-10 '>
          <p className='text-gray-100'>
            Token address: {nft.sTokenAddress}
            <button
              className='ml-1 hover:text-teal-400'
              onClick={() => {
                handleCopyToClipboard(nft.sTokenAddress);
                showToast('Address Copied!');
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className='text-gray-100 mt-7'>
            Name: {nft.sNftName} #{nft.nTokenId}
          </p>
          <p className='text-gray-400 mt-7'>
            Creator: {nft.sFirstMInterAddress}
            <button
              className='ml-1 hover:text-teal-400'
              onClick={() => {
                handleCopyToClipboard(nft.sFirstMInterAddress);
                showToast('Address Copied!');
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className='text-gray-100 mt-7'>
            Current owner: {nft.sCurrentOwner}
            <button
              className='ml-1 hover:text-teal-400'
              onClick={() => {
                handleCopyToClipboard(nft.sCurrentOwner);
                showToast('Address Copied!');
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className='text-gray-400 mt-7'>Description: {nft.sDescription}</p>

          {nft.isApprovedForSale && (
            <p className='text-teal-400 mt-10 font-semibold'>
              On Sale: Price: {nft.nNftPrice} ETH
            </p>
          )}

          {isOwner && !nft.isApprovedForSale && !nft.isApprovedForAuction ? (
              renderOwnerActions()
          ) : nft.isApprovedForSale ? (
            <div >
              {isOwner ? (
                <button
                  onClick={() => handleCancelListing(nft)}
                  className={`w-full mt-6 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r ${
                    isCancelling
                      ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  } focus:ring-2 focus:ring-purple-400 focus:outline-none`}
                  aria-disabled={isCancelling}
                  aria-label="Cancel Listing"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Listing'}
                </button>
              ) : (
                <button
                  onClick={handleBuyBtnNFt}
                  className="w-full mt-6 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                  aria-label="Buy NFT"
                >
                  Buy
                </button>
              )}
            </div>
          ) : isAuctionActive ? (
            <div>
              {isHighestBidder ? (
                <div className="flex flex-col gap-4">
                  <div className='mt-7'>
                    {renderTimer()}
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 mt-7 rounded-lg font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed focus:ring-2 focus:ring-gray-300 focus:outline-none"
                    aria-disabled="true"
                    aria-label="Not Allowed for Next Bid"
                  >
                    Not Allowed for Next Bid
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {hasBids ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-600 mt-7">
                        Current Bid: {nHighestBid} ETH
                      </p>
                      <p className="text-gray-200 mt-7">
                        Previous Bidder:{' '}
                        {sHighestBidder
                          ? `${sHighestBidder.slice(0, 4)}...${sHighestBidder.slice(-4)}`
                          : 'None'}
                      <button
                        className='ml-1 hover:text-teal-400'
                        onClick={() => {
                          handleCopyToClipboard(sHighestBidder);
                          showToast('Address Copied!');
                        }}
                      >
                        <MdContentCopy className='w-4 h-4 text-res-500' />
                      </button>
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-200 mt-7">
                      🎬 Bidding Starts from: {nft.oAuctionDetails.nBasePrice} ETH 🎬
                    </p>
                  )}
                  <div className='mt-7'>
                    {renderTimer()}
                  </div>
                  {!isOwner && (
                    <button
                      onClick={() => handlePlaceBidClick(nft)}
                      className="px-4 mt-7 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                      aria-label="Place Bid"
                    >
                      👨‍⚖️ Place Bid 👨‍⚖️
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : isAuctionEnded ? (
            <div >
              {hasBids ? (
                isHighestBidder ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600 mt-6">
                      🎉 Congratulations! You are the winner.
                    </p>
                    <p className="text-gray-100 mt-6">
                      🎉 Your winning bid: {nft.oAuctionDetails.nHighestBid} ETH 🎉 
                    </p>
                    <button
                      onClick={() => handleWinnerNft(nft)}
                      className="px-4 mt-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                      aria-label="Claim Your NFT"
                    >
                      Claim Your NFT
                    </button>
                  </div>
                ) : isOwner ? (
                  isSettlementPeriod ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-gray-200 mt-7">
                        🎉 Please settle the auction to transfer NFT.
                      </p>
                      <p className="text-gray-200 mt-6">
                        🏆 Highest Bidder:{' '}
                        {sHighestBidder
                          ? `${sHighestBidder.slice(0, 4)}...${sHighestBidder.slice(-4)}`
                          : 'None'}
                      <button
                        className='ml-1 hover:text-teal-400'
                        onClick={() => {
                          handleCopyToClipboard(sHighestBidder);
                          showToast('Address Copied!');
                        }}
                      >
                        <MdContentCopy />
                      </button> 
                      </p>
                      <p className="text-gray-200 mt-7">🏆 Winning Bid: {nHighestBid} ETH</p>
                      <button
                        onClick={() => handleSettleAuction(nft)}
                        className="px-4 py-2 mt-6 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                        aria-label="Settle Your Auction"
                      >
                        🎉 Settle Your Auction
                      </button>
                    </div>
                  ) : (
                    <div className='mt-7'>
                      {renderTimer()}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-100 mt-10">🎉 Winner: {`${sHighestBidder.slice(0, 4)}...${sHighestBidder.slice(-4)}`}</p>
                    <p className="text-gray-100 mt-10">🎉 Winning Bid: {nHighestBid} ETH</p>
                  </div>
                )
              ) : (
                isOwner ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-gray-100 mt-7">🥺 No bids were placed in your auction. 🥹</p>
                    <button
                      onClick={() => handleReclaimNft(nft)}
                      className="px-4 mt-7 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                      aria-label="Re-Claim Your NFT"
                    >
                      Re-Claim Your NFT 🥲
                    </button>
                  </div>
                ) : (
                  <p className="text-red-400 mt-10">⌛️ Auction ended. No bids were placed ⌛️</p>
                )
              )}
            </div>
          ) : (
            <div className='mt-7'>
              {renderTimer()}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg'
          onClick={() => setIsModalOpen(false)}
        >
          <div className='relative'>
            <button
              className='absolute top-2 right-2 text-white px-3 py-1 rounded'
              onClick={() => setIsModalOpen(false)}
            >
              <span className='text-2xl font-bold'>&times;</span>
            </button>
            <img
              src={nft.sImageUrl}
              alt={nft.sNftName}
              className='max-w-3xl max-h-[90vh] rounded-lg shadow-xl'
            />
          </div>
        </div>
      )}

      {selectedNft && (
        <SellModal
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          nft={nftDataForModal}
          onConfirmSell={onConfirmSell}
        />
      )}
      {selectedNft && (
        <AuctionModal
          isOpen={isAuctionModalOpen}
          onClose={() => setIsAuctionModalOpen(false)}
          nft={nftDataForModal}
          onConfirmAuction={onConfirmAuction}
        />
      )}

      <AnimatePresence>
        {isBidModalOpen && selectedNftForBid && (
          <motion.div
            className='fixed inset-0 bg-transparent bg-opacity-75 backdrop-blur-lg flex justify-center items-center z-50 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-2xl border border-purple-600 text-white relative overflow-hidden' // Increased padding, stronger shadow, border
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Decorative background element */}
              <div className='absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500 rounded-full opacity-20 blur-xl'></div>
              <div className='absolute bottom-0 right-0 w-32 h-32 bg-blue-500 rounded-full opacity-15 blur-xl'></div>

              <h2 className='text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 relative z-10'>
                {' '}
                {/* Larger heading */}
                Place Your Bid
              </h2>

              <div className='flex flex-col items-center mb-6 relative z-10'>
                {selectedNftForBid.sImageUrl ? (
                  <div className='w-36 h-36 rounded-xl overflow-hidden border-2 border-purple-500 shadow-lg'>
                    {' '}
                    {/* Slightly larger image, border */}
                    <img
                      src={selectedNftForBid.sImageUrl}
                      alt={selectedNftForBid.sNftName}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-36 h-36 bg-gray-700 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-lg border-2 border-purple-500 shadow-lg'>
                    No Image
                  </div>
                )}
                <h3 className='text-2xl font-semibold mt-4 mb-1 text-teal-300 text-center'>
                  {selectedNftForBid.sNftName}
                </h3>{' '}
                {/* More prominent name */}
              </div>

              <div className='mb-6 pb-6 border-b border-gray-700/50 relative z-10'>
                {' '}
                {/* Added border-b */}
                <p className='text-lg text-gray-300 mb-2'>
                  Initial Price:{' '}
                  <span className='font-bold text-gray-400'>
                    {selectedNftForBid.oAuctionDetails.nBasePrice} ETH
                  </span>
                </p>
                <p className='text-xl font-semibold text-blue-300 mb-2'>
                  Current Highest Bid:{' '}
                  <span className='font-bold text-blue-200'>
                    {selectedNftForBid.oAuctionDetails.nHighestBid} ETH
                  </span>
                </p>
                <p className='text-lg text-yellow-300 mt-2'>
                  Minimum Bid Required:{' '}
                  <span className='font-bold text-yellow-200'>
                    {minimumBidRequiredEth} ETH
                  </span>
                </p>
                {/* Auction Ends In Time */}
                <CountdownTimer
                  endTime={parseInt(selectedNftForBid.oAuctionDetails.dEndTime)}
                  startTime={parseInt(
                    selectedNftForBid.oAuctionDetails.dStartTime
                  )}
                />
              </div>

              <div className='mb-8 relative z-10'>
                {' '}
                {/* Increased margin-bottom */}
                <label
                  htmlFor='bidAmount'
                  className='block text-gray-300 text-sm font-bold mb-2'
                >
                  Your Bid (ETH)
                </label>
                <input
                  type='number'
                  id='bidAmount'
                  value={bidAmountInput}
                  onChange={(e) => setBidAmountInput(e.target.value)}
                  placeholder={
                    minimumBidRequiredEth
                      ? `Minimum ${minimumBidRequiredEth} ETH`
                      : 'Enter your bid'
                  }
                  step='0.000001'
                  min={minimumBidRequiredEth}
                  className='shadow appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 focus:border-transparent transition-all duration-200' // Rounded corners for input
                />
              </div>

              <div className='flex justify-end gap-4 relative z-10'>
                <button
                  onClick={() => {
                    setIsBidModalOpen(false);
                    setBidAmountInput('');
                    setSelectedNftForBid(null);
                    setIsBidding(false);
                  }}
                  className='bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 text-lg' // Increased padding, text size
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePlaceBid(selectedNftForBid)}
                  disabled={
                    !bidAmountInput ||
                    parseFloat(bidAmountInput) < minimumBidRequiredEth
                  }
                  className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg' // Increased padding, text size
                >
                  {isProcessing ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </div>
            </motion.div>
          </motion.div> 
        )}
      </AnimatePresence>
    </div>
  );
};

export default NFtDetail;




