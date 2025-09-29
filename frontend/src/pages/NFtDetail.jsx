import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { use, useCallback, useEffect, useState } from 'react';
import { getNftById } from '../api/user';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MdContentCopy } from 'react-icons/md';
import {
  cancelListing,
  checkAndApproveNFT,
  formatTimeDiff,
  getContractInstance,
  handleBuyNFt,
  handleCopyToClipboard,
  handleUserRejection,
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
  const { nftId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const { walletProvider } = useAppKitProvider('eip155');
  const [status, setStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedNftForBid, setSelectedNftForBid] = useState(null);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [minimumBidRequiredEth, setMinimumBidRequiredEth] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [auctionStatus, setAuctionStatus] = useState('upcoming');

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
          ? parseFloat(nft.oAuctionDetails.nHighestBid) * 1.01
          : parseFloat(nft.oAuctionDetails.nBasePrice);
      setMinimumBidRequiredEth(minimumREquiredBid);
    } catch (error) {
      setSelectedNftForBid('');
      setIsBidModalOpen(false);
    }
  }, []);

  const onConfirmSell = async (nft, price) => {
    try {
      setIsSellModalOpen(true);

      console.log('nft to sell:', nft);

      const approvalDone = await checkAndApproveNFT(
        walletProvider,
        nft.sTokenAddress,
        nft.nTokenId
      );

      if (approvalDone) {
        console.log("Approval transaction completed. Proceeding with sale...");
      } else {
        console.log("NFT already approved. Proceeding with sale...");
      }

      // const ethersProvider = new BrowserProvider(walletProvider);
      // const signer = await ethersProvider.getSigner();

      // const mintContract = new Contract(
      //   data.data.nft.sTokenAddress,
      //   tokenAbi,
      //   signer
      // );

      // const gasEstimateApprove = await mintContract.approve.estimateGas(
      //   import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
      //   data.data.nft.nTokenId
      // );

      // const tx = await mintContract.approve(
      //   import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
      //   data.data.nft.nTokenId,
      //   {
      //     gasLimit: gasEstimateApprove,
      //   }
      // );
      // await tx.wait();

      const { contract } = await getContractInstance(walletProvider);

      const gasEstimateSale = await contract.createSale.estimateGas(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        price
      );


      const sellTx = await contract.createSale(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        price,
        {
          gasLimit: gasEstimateSale,
        }
      );
      const rTx = await sellTx.wait();

      setStatus(null);
      setIsSellModalOpen(false);
      navigate('/buy-sell');

      // await delay(10000);
      // setIsListing(false);
      // setIsSellModalOpen(false);

      // navigate('/buy-sell');
    } catch (error) {
      setStatus(null);
      setIsSellModalOpen(false);
      handleUserRejection(error);
    }
  };

  const handleBuyBtnNFt = async () => {
    try {
      setStatus("buying");
      const result = await handleBuyNFt(data.data.nft, walletProvider);
      if (result && result.success) {
        // await delay(10000);
        // setIsBuying(false);
        // navigate('/profile');
        return;
      }
    } catch (error) {
      console.log(error, 'error in buying nft');
    } finally {
      setStatus(null);
    }
  };

  const handleCancelListing = async (nft) => {
    try {
      setStatus("cancelling");
      const result = await cancelListing(nft, walletProvider);
      if (result && result.success) {
        setStatus(null);
        // await delay(10000);
        // navigate('/profile');
        return;
      }
    } catch (error) {
      console.log(error, 'error in cancelling nft listing');
    } finally {
      setStatus(null);
    }
  };

  const onConfirmAuction = async (nft, startingPrice, startTime, endTime) => {
    try {
      setIsAuctionModalOpen(true);


      console.log('nft to auction:', nft);

      const approvalDone = await checkAndApproveNFT(
        walletProvider,
        nft.sTokenAddress,
        nft.nTokenId
      );

      if (approvalDone) {
        console.log("Approval transaction completed. Proceeding with sale...");
      } else {
        console.log("NFT already approved. Proceeding with sale...");
      }
      console.log('Auction modal is open ');
      console.log('NFT to auction:', nft);
      console.log('Starting price:', startingPrice);
      console.log('End time (timestamp):', endTime);

      const { contract } = await getContractInstance(walletProvider);

      // const ethersProvider = new BrowserProvider(walletProvider);
      // const signer = await ethersProvider.getSigner();

      // console.log('Creating mintContract instance for NFT approval:', nft);

      // const mintContract = new Contract(
      //   data.data.nft.sTokenAddress,
      //   tokenAbi,
      //   signer
      // );

      // console.log('Approving NFT for auction...', nft);

      // const gasEstimateApprove = await mintContract.approve.estimateGas(
      //   import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
      //   data.data.nft.nTokenId
      // );

      // const tx = await mintContract.approve(
      //   import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
      //   data.data.nft.nTokenId,
      //   {
      //     gasLimit: gasEstimateApprove,
      //   }
      // );
      setStatus("listing");
      // await tx.wait();
      console.log('NFT APPROVED');

      // console.log('Creating auction...');
      // console.log(
      //   data.data.nft.sTokenAddress,
      //   data.data.nft.nTokenId,
      //   startTime,
      //   endTime,
      //   typeof startingPrice
      // );

      const gasEstimateAuction = await contract.createAuction.estimateGas(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        startTime,
        endTime,
        startingPrice
      );

      const auctionTx = await contract.createAuction(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        startTime,
        endTime,
        startingPrice,
        {
          gasLimit: gasEstimateAuction,
        }
      );
      const rTx = await auctionTx.wait();
      console.log('NFT LISTED FOR AUCTION', rTx);

      setStatus(null);
      setIsAuctionModalOpen(false);
      navigate('/buy-sell');

      const nPriceInEth = parseFloat(startingPrice);
      console.log('Starting Price in ETH:', nPriceInEth);

      setStatus(null);

      setIsSellModalOpen(false);

      navigate('/home');
    } catch (error) {
      setStatus(null);
      setIsAuctionModalOpen(false);
      console.error('Error listing NFT for auction:', error);
      handleUserRejection(error);
      console.log('error code : ', error.code);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceBid = async (nft) => {
    try {
      setSelectedNftForBid(nft);
      setIsBidModalOpen(true);
      setStatus("bidding");
      setIsProcessing(true);

      console.log('handlePlaceBid called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('Place bid:', nft);
      console.log('Bid amount input:', bidAmountInput);

      const priceInWei = ethers.parseEther(bidAmountInput);
      console.log('price in wei', priceInWei.toString());

      const gasEstimateBid = await contract.PlaceBid.estimateGas(
        nft.sTokenAddress,
        nft.nTokenId,
        { value: priceInWei }
      );

      const bidTx = await contract.PlaceBid(
        // import.meta.env.VITE_MINT_CONTRACT_ADDRESS,
        // "0x5A2481Ff023A4E4Bc3899Aaba142AA8d8ca18Fe4",
        nft.sTokenAddress,
        nft.nTokenId,
        { value: priceInWei },
        { gasLimit: gasEstimateBid }
      );

      await bidTx.wait();
      setIsBidModalOpen(false);
      setSelectedNftForBid('');
      setStatus(null);

      console.log('BID PLACED');

      const txHash = bidTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error placing bid:', error);
      handleUserRejection(error);
      if(error == "RangeError: too many decimals for format "){
        showToast("Please enter a valid bid amount.", "error");
      }
      throw error;
    } finally {
      setIsBidModalOpen(false);
      setSelectedNftForBid('');
      setStatus(null);
      setIsProcessing(false);
    }
  };

  const handleSettleAuction = async (nft) => {
    console.log('handleSettleAuction called with nft:', nft);
    try {
      setStatus("settling");
      console.log('handleSettleAuction called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('auction settlement', nft);

      const gasEstimateSettlement = await contract.WinnerNFT.estimateGas(
        nft.sTokenAddress,
        nft.nTokenId
      );

      const NftClaimTx = await contract.WinnerNFT(
        nft.sTokenAddress,
        nft.nTokenId,
        { gasLimit: gasEstimateSettlement }
      );

      await NftClaimTx.wait();

      console.log('NFT CLAIMED');

      const txHash = NftClaimTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error claiming NFT:', error);
      handleUserRejection(error);
      throw error;
    } finally {
      setStatus(null);
    }
  };

  const handleWinnerNft = async (nft) => {
    try {
      setStatus("claiming");
      console.log('handleBuyNFt called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('winner claim nft', nft);
      const gasEstimateClaim = await contract.WinnerNFT.estimateGas(
        nft.sTokenAddress,
        nft.nTokenId
      );

      const NftClaimTx = await contract.WinnerNFT(
        nft.sTokenAddress,
        nft.nTokenId,
        { gasLimit: gasEstimateClaim }
      );

      await NftClaimTx.wait();

      console.log('NFT CLAIMED');

      const txHash = NftClaimTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error claiming NFT:', error);
      handleUserRejection(error);
      throw error;
    } finally {
      setStatus(null);
    }
  };

  const handleReclaimNft = async (nft) => {
    try {
      setStatus("reclaiming");
      console.log('handleReclaimNft called with nft:', nft);
      const { contract } = await getContractInstance(walletProvider);

      console.log('winner claim nft', nft);

      const gasEstimateReclaim = await contract.ReclaimNft.estimateGas(
        nft.sTokenAddress,
        nft.nTokenId
      );

      const NftReClaimTx = await contract.ReclaimNft(
        nft.sTokenAddress,
        nft.nTokenId,
        { gasLimit: gasEstimateReclaim }
      );

      await NftReClaimTx.wait();

      console.log('NFT RECLAIMED');

      const txHash = NftReClaimTx.hash;
      console.log(`https://sepolia.etherscan.io/tx/${txHash}`);

      return { success: true };
    } catch (error) {
      console.error('Error reclaiming NFT:', error);
      handleUserRejection(error);
      throw error;
    } finally {
      setStatus(null);
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

  const getStatusMessage = () => {
    switch (status) {
      case "buying": return "Processing Purchase...";
      case "listing": return "Listing NFT...";
      case "cancelling": return "Cancelling Listing...";
      case "bidding": return "Placing your bid...";
      case "reclaiming": return "Reclaiming your NFT...";
      case "claiming": return "Claiming your NFT...";
      case "settling": return "Settling the auction...";
      default: return "";
    }
  };

  const { dStartTime, dEndTime, sSettlementTime, nHighestBid, sHighestBidder } = nft.oAuctionDetails;
  const now = Math.floor(Date.now() / 1000);

  const isAuctionEnded = nft.isApprovedForAuction && parseInt(dEndTime) <= now;
  const hasBids = nft.oAuctionDetails.nHighestBid > 0;
  const isSettlementPeriod = isAuctionEnded && now > parseInt(sSettlementTime);
  const isOwner = user.sWalletAddress === nft.sCurrentOwner;
  const isHighestBidder = sHighestBidder === user.sWalletAddress;

  const renderOwnerActions = () => (
    <div className='flex space-x-4'>
      <button
        onClick={handleSellClick}
        className='w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition'
        disabled={status === "listing"}
        aria-label='Put on sale'
      >
        Put on Sell
      </button>
      <button
        onClick={handleAuctionClick}
        className='w-full px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition'
        disabled={status === "listing"}
        aria-label='Put on auction'
      >
        Put on Auction
      </button>
    </div>
  );

  const CountdownTimer = ({
    startTime,
    endTime,
    settlementTime,
    onAuctionStatusChange,
    isOwner,
    nft,
    handleSettleAuction,
  }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [status, setStatus] = useState('upcoming');

    useEffect(() => {
      if (!startTime || !endTime || !settlementTime) return;

      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const startDiff = startTime - now;
        const endDiff = endTime - now;
        const settlementDiff = settlementTime - now;

        if (startDiff > 0) {
          const { days, hours, minutes, seconds } = formatTimeDiff(startDiff);
          setTimeLeft(
            `⏳ Auction Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s ⏳`
          );
          if (status !== 'upcoming') {
            setStatus('upcoming');
            onAuctionStatusChange('upcoming');
          }
        } else if (endDiff > 0) {
          const { days, hours, minutes, seconds } = formatTimeDiff(endDiff);
          setTimeLeft(
            `⏳ Auction Ends in: ${days}d ${hours}h ${minutes}m ${seconds}s ⏳`
          );
          if (status !== 'active') {
            setStatus('active');
            onAuctionStatusChange('active');
          }
        } else if (settlementDiff > 0 && isOwner) {
          const { days, hours, minutes, seconds } = formatTimeDiff(settlementDiff);
          setTimeLeft(
            `⏳ Auction settlement available in: ${days}d ${hours}h ${minutes}m ${seconds}s ⏳`
          );
          if (status !== 'settlement') {
            setStatus('settlement');
            onAuctionStatusChange('settlement');
          }
        } else {
          setTimeLeft(`Auction Ended. settlement is now available.`);
          clearInterval(interval);
          if (status !== 'ended') {
            setStatus('ended');
            onAuctionStatusChange('ended');
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [
      startTime,
      endTime,
      settlementTime,
      isOwner,
      status,
      onAuctionStatusChange,
    ]);

    return (
      <>
        {timeLeft && (
          <div>
            <p className='text-green-400'>{timeLeft}</p>
            {status === 'ended' &&
              isOwner &&
              nft.oAuctionDetails.nHighestBid > 0 && (
                <div className='flex flex-col gap-4'>
                  <p className='text-2xl font-bold mt-2'>
                    🎉{' '}
                    <span className='bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600 animate-pulse'>
                      Settle the auction to transfer NFT.
                    </span>
                  </p>
                  <p className='text-gray-200 mt-2'>
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
                  <p className='text-gray-200 mt-2'>
                    🏆 Winning Bid: {nHighestBid} ETH
                  </p>
                  <button
                    onClick={() => handleSettleAuction(nft)}
                    className='px-4 py-2  rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                    aria-label='Settle Your Auction'
                  >
                    🎉 Settle Your Auction
                  </button>
                </div>
              )}
            {status === 'ended' && !isOwner && isHighestBidder && (
              <div className='flex flex-col gap-4'>
                <p className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600 animate-pulse'>
                  🎉 Congratulations! You are the winner.
                </p>
                <p className='text-gray-100 font-semibold'>
                  🎉 Your winning bid: {nft.oAuctionDetails.nHighestBid} ETH 🎉
                </p>
                <button
                  onClick={() => handleWinnerNft(nft)}
                  className='px-4 mt-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                  aria-label='Claim Your NFT'
                >
                  Claim Your NFT
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  const handleAuctionStatusChange = (newStatus) => {
    setAuctionStatus(newStatus);
  };

  const renderTimer = () => (
    <CountdownTimer
      startTime={parseInt(dStartTime)}
      endTime={parseInt(dEndTime)}
      settlementTime={parseInt(sSettlementTime)}
      handleSettleAuction={handleSettleAuction}
      isOwner={isOwner}
      nft={nft}
      onAuctionStatusChange={handleAuctionStatusChange}
    />
  );  

  return (
    <div className='p-8 space-y-8'>
      {(status != null) && (
        <div className='fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50'>
          <div className='flex flex-col items-center p-8 rounded-lg shadow-2xl animate-pulse'>
            <FaSpinner className='text-6xl text-teal-500 animate-spin mb-4' />
            <p className='text-xl font-semibold text-gray-100'>
              {getStatusMessage()}
            </p>
            <p className='text-sm text-gray-100 mt-2'>
              This may take a moment.
            </p>
          </div>
        </div>
      )}

      <h1 className='text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center uppercase tracking-wider'>
        {/* <div className='absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:skew-y-1 before:-translate-x-screen before:animate-auto-shine-screen'></div> */}
        <div className='relative text-gray-200'>NFT Detail</div>
      </h1>

      <div className='flex space-y-8 mt-8 border-2 border-gray-700 p-8 rounded-lg shadow-lg bg-gray-800/60 backdrop-blur-lg'>
        <div className='flex flex-col items-center space-y-6'>
          <motion.img
            onClick={() => {
              setIsModalOpen(true);
            }}
            src={nft.sImageUrl}
            alt={nft.sNftName}
            className='w-96 h-102 rounded-lg object-cover cursor-pointer transition-all duration-300'
            initial={{ y: 20, opacity: 0, rotate: -5 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1, rotate: -3, speed: 0.5 }}
          />
        </div>

        <div className='flex flex-col space-y-2 ml-10 '>
          <p className='text-gray-100 mt-5 text-sm font-mono'>
            Token address: {''}
            <br />
            <span className='font-semibold text-gray-100 mt-3'>
              {nft.sTokenAddress}
            </span>
            <button
              className='ml-2 hover:text-teal-400'
              onClick={() => {
                handleCopyToClipboard(nft.sTokenAddress);
                showToast('Address Copied!');
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className='text-3xl font-extrabold text-white leading-tight mt-4'>
            {nft.sNftName} #{nft.nTokenId}
          </p>
          <p className='text-gray-200 mt-4'>
            Creator: <br />
            <span className='font-semibold text-gray-300'>
              {nft.sFirstMInterAddress}
            </span>
            <button
              className='ml-2 hover:text-teal-400'
              onClick={() => {
                handleCopyToClipboard(nft.sFirstMInterAddress);
                showToast('Address Copied!');
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className='text-gray-200 mt-4'>
            Royalty:
            <span className='font-bold text-gray-100 font-italic text-xl'>
              &nbsp;{nft.nRoyalty}%
            </span>
          </p>
          <p className='text-gray-100 mt-4'>
            Current owner: <br />
            <span className='font-semibold text-gray-300 '>
              {nft.sCurrentOwner}
            </span>
            <button
              className='ml-2 hover:text-teal-400'
              onClick={() => {
                handleCopyToClipboard(nft.sCurrentOwner);
                showToast('Address Copied!');
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className='text-gray-300 mt-4 italic'>
            Description: {nft.sDescription}
          </p>

          <motion.div
            className='mt-6 pt-6 border-t border-gray-700/80'
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
          ></motion.div>

          {nft.isApprovedForSale && (
            <p className='text-teal-400 font-semibold'>
              On Sale: Price: {nft.nNftPrice} ETH
            </p>
          )}

          {isOwner && !nft.isApprovedForSale && !nft.isApprovedForAuction ? (
            renderOwnerActions()
          ) : nft.isApprovedForSale ? (
            <div>
              {isOwner ? (
                <button
                  onClick={() => handleCancelListing(nft)}
                  className={`w-full mt-6 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r ${
                    status === "cancelling"
                      ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'from-pink-400 to-red-600 hover:from-pink-600 hover:to-red-700'
                  } focus:ring-2 focus:ring-purple-400 focus:outline-none`}
                  aria-disabled={status === "cancelling"}
                  aria-label='Cancel Listing'
                >
                  {(status === "cancelling") ? 'Cancelling...' : 'Cancel Listing'}
                </button>
              ) : (
                <button
                  onClick={handleBuyBtnNFt}
                  className='w-full mt-6 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                  aria-label='Buy NFT'
                >
                  Buy
                </button>
              )}
            </div>
          ) : auctionStatus === 'active' ? (
            <div>
              {isHighestBidder ? (
                <div className='flex flex-col gap-4'>
                  <div className='mt-2'>{renderTimer()}</div>
                  <p className='text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-600'>
                    Current Bid: {nHighestBid} ETH
                  </p>
                  <p className='text-gray-400 text-sm mt-1'>
                    Current Bidder:{' '}
                    {sHighestBidder
                      ? `${sHighestBidder.slice(0, 6)}...${sHighestBidder.slice(-4)}`
                      : 'None'}
                    <button
                      className='ml-2 hover:text-teal-400'
                      onClick={() => {
                        handleCopyToClipboard(sHighestBidder);
                        showToast('Address Copied!');
                      }}
                    >
                      <MdContentCopy />
                    </button>
                  </p>
                  <button
                    disabled
                    className='px-4 py-2 mt-2 rounded-lg font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed focus:ring-2 focus:ring-gray-300 focus:outline-none'
                    aria-disabled='true'
                    aria-label='Not Allowed for Next Bid'
                  >
                    Not Allowed for Next Bid
                  </button>
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
                  {hasBids ? (
                    <div className='flex flex-col gap-2'>
                      <p className='text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-600'>
                        Current Bid: {nHighestBid} ETH
                      </p>
                      <p className='text-gray-400 text-sm mt-1'>
                        Current Bidder:{' '}
                        {sHighestBidder
                          ? `${sHighestBidder.slice(0, 6)}...${sHighestBidder.slice(-4)}`
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
                    <div className='mt-2'>
                      <p className='font-semibold text-gray-200 mb-3'>
                        Base Price : {nft.oAuctionDetails.nBasePrice} ETH
                      </p>
                    </div>
                  )}
                  {renderTimer()}

                  {!isOwner && auctionStatus === 'active' && (
                    <button
                      onClick={() => handlePlaceBidClick(nft)}
                      className='px-4 mt-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                      aria-label='Place Bid'
                    >
                      👨‍⚖️ Place Bid 👨‍⚖️
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : isAuctionEnded ? (
            <div>
              {hasBids ? (
                isHighestBidder ? (
                  <div className='flex flex-col gap-4'>
                    <p className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600 animate-pulse'>
                      🎉 Congratulations! You are the winner.
                    </p>
                    <p className='text-gray-100 font-semibold'>
                      🎉 Your winning bid: {nft.oAuctionDetails.nHighestBid} ETH
                      🎉
                    </p>
                    <button
                      onClick={() => handleWinnerNft(nft)}
                      className='px-4 mt-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                      aria-label='Claim Your NFT'
                    >
                      Claim Your NFT
                    </button>
                  </div>
                ) : isOwner ? (
                  isSettlementPeriod ? (
                    <div className='flex flex-col gap-4'>
                      <p className='text-2xl font-bold '>
                        🎉{' '}
                        <span className='bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600 animate-pulse'>
                          Settle the auction to transfer NFT.
                        </span>
                      </p>
                      <p className='text-gray-200 mt-2'>
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
                      <p className='text-gray-200 mt-2'>
                        🏆 Winning Bid: {nHighestBid} ETH
                      </p>
                      <button
                        onClick={() => handleSettleAuction(nft)}
                        className='px-4 py-2  rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                        aria-label='Settle Your Auction'
                      >
                        🎉 Settle Your Auction
                      </button>
                    </div>
                  ) : (
                    <div className='mt-2'>{renderTimer()}</div>
                  )
                ) : (
                  <div className='flex flex-col gap-2'>
                    <p className='text-gray-100 text-lg font-semibold'>
                      🎉 Winner:{' '}
                      {`${sHighestBidder.slice(0, 4)}...${sHighestBidder.slice(-4)}`}
                      <button
                        className='ml-1 hover:text-teal-400'
                        onClick={() => {
                          handleCopyToClipboard(sHighestBidder);
                          showToast('Address Copied!');
                        }}
                      >
                        <MdContentCopy className=' mt-1 h-4 w-4' />
                      </button>
                    </p>
                    <p className='text-gray-100 text-lg font-semibold'>
                      🎉 Winning Bid: {nHighestBid} ETH
                    </p>
                  </div>
                )
              ) : isOwner ? (
                <div className='flex flex-col gap-4'>
                  <p className='text-lg  font-semibold'>
                    🥺{' '}
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600'>
                      No bids were placed in your auction.
                    </span>{' '}
                    🥹
                  </p>
                  <button
                    onClick={() => handleReclaimNft(nft)}
                    className='px-4 mt-7 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300'
                    aria-label='Re-Claim Your NFT'
                  >
                    Re-Claim Your NFT 🥲
                  </button>
                </div>
              ) : (
                <p className='text-lg text-red-400 font-semibold'>
                  ⌛️ Auction ended. No bids were placed ⌛️
                </p>
              )}
            </div>
          ) : (
            renderTimer()
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
          nft={nft}
          onConfirmSell={onConfirmSell}
        />
      )}
      {selectedNft && (
        <AuctionModal
          isOpen={isAuctionModalOpen}
          onClose={() => setIsAuctionModalOpen(false)}
          nft={nft}
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
                    {selectedNftForBid.oAuctionDetails.nHighestBid > 0
                      ? selectedNftForBid.oAuctionDetails.nHighestBid + ' ETH'
                      : 'No Bids Yet'}{' '}
                    
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
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit decimal places to 18
                    if (value.includes('.')) {
                      const [integer, decimal] = value.split('.');
                      if (decimal && decimal.length > 18) {
                        return; // Don't update if more than 18 decimal places
                      }
                    }
                    setBidAmountInput(value);
                  }}
                  placeholder={
                    minimumBidRequiredEth
                      ? `Minimum ${minimumBidRequiredEth} ETH`
                      : 'Enter your bid'
                  }
                  step='0.000000000000000001' // Smallest ETH unit (1 wei in ETH)
                  min={minimumBidRequiredEth}
                  className='shadow appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 focus:border-transparent transition-all duration-200'
                />
              </div>

              <div className='flex justify-end gap-4 relative z-10'>
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setIsBidModalOpen(false);
                    setBidAmountInput('');
                    setSelectedNftForBid(null);
                    setStatus(null);
                  }}
                  className='bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 text-lg'
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePlaceBid(selectedNftForBid)}
                  disabled={
                    !bidAmountInput ||
                    parseFloat(bidAmountInput) < minimumBidRequiredEth || isProcessing
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
