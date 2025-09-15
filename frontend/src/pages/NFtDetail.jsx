import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { getNftById } from "../api/user";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdContentCopy } from "react-icons/md";
import {
  cancelListing,
  getContractInstance,
  handleBuyNFt,
  handleCopyToClipboard,
  showToast,
} from "../utils/helper";
import SellModal from "../components/SellModal";
import { BrowserProvider, Contract } from "ethers";
import { useAppKitProvider } from "@reown/appkit/react";
import { FaSpinner } from "react-icons/fa";
import tokenAbi from "../../tokenAbi.json";

const queryKey = {
  nftDetail : (nftId) => ["nftDetail", nftId], 
}

const NFtDetail = () => {
  const { nftId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const { walletProvider } = useAppKitProvider("eip155");
  const [selectedNft, setSelectedNft] = useState(null);
  const [isListing, setIsListing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const navigate = useNavigate();

  console.log("nftId from params:", nftId);

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

  const onConfirmSell = async (nft, price) => {
    try {
      setIsSellModalOpen(true);
      console.log("sell modal is open ");
      console.log("NFT to sell:", nft);
      console.log("Selling price:", price);

      const { contract } = await getContractInstance(walletProvider);

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();

      console.log("Creating mintContract instance for NFT approval:", nft);

      const mintContract = new Contract(
        data.data.nft.sTokenAddress,
        tokenAbi,
        signer
      );
      // const setPlatform = await contract.setPlatform(import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS);
      // await setPlatform.wait();
      // console.log("Platform set in marketplace contract" , setPlatform);

      console.log("Approving NFT for sale...", nft);

      const tx = await mintContract.approve(
        import.meta.env.VITE_MEDIA_CONTRACT_ADDRESS,
        data.data.nft.nTokenId
      );
      setIsListing(true);
      await tx.wait();
      console.log("NFT APPROVED");

      const sellTx = await contract.createSale(
        data.data.nft.sTokenAddress,
        data.data.nft.nTokenId,
        price
      );
      const rTx = await sellTx.wait();
      // showToast("success! We will notify you when it's available", "success");
      console.log("NFT LISTED FOR SALE" , rTx);

      setIsListing(false);
      setIsSellModalOpen(false);
      navigate("/buy-sell");
      
      const nPriceInEth = parseFloat(price);
      console.log("Price in ETH:", nPriceInEth);

      // await delay(10000);
      // setIsListing(false);
      // setIsSellModalOpen(false);

      // navigate('/buy-sell');
    } catch (error) {
      setIsListing(false);
      setIsSellModalOpen(false);
      console.error("Error listing NFT for sale:", error);
      if (error.code === "ACTION_REJECTED") {
        showToast("Transaction rejected by user.", "error");
      } else if (error.reason === null) {
        showToast("Insufficient funds!! NFt is blocked!", "error");
      }
      console.log("error code : ", error.code);
    }
  };

  const handleBuyBtnNFt = async () => {
    try {
      setIsBuying(true);
      const result = await handleBuyNFt(data.data.nft, walletProvider);
      if (result && result.success) {
        console.log("Buying transaction successful");
        // await delay(10000);
        // setIsBuying(false);
        // navigate('/profile');
        return;
      }
    } catch (error) {
      console.log(error, "error in buying nft");
    } finally {
      setIsBuying(false);
    }
  };

  const handleCancelListing = async (nft) => {
    try {
      setIsCancelling(true);
      const result = await cancelListing(nft, walletProvider);
      if (result && result.success) {
        console.log("Cancel listing transaction successful");
        setIsCancelling(false);
        // await delay(10000);
        // navigate('/profile');
        return;
      }
    } catch (error) {
      console.log(error, "error in cancelling nft listing");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!data) return null;

  const nft = data.data.nft;
  const nftDataForModal = {
    image: nft.sImageUrl,
    name: nft.sNftName,
    symbol: "",
    mintAddress: nft.sToAddress,
    tokenId: nft.nTokenId,
  };

  return (
    <div className="p-8 space-y-8">
      {(isBuying || isListing || isCancelling) && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center p-8 rounded-lg shadow-2xl animate-pulse">
            <FaSpinner className="text-6xl text-teal-500 animate-spin mb-4" />
            <p className="text-xl font-semibold text-gray-100">
              {isBuying
                ? "Buying NFT..."
                : isListing
                ? "Listing NFT..."
                : "Cancel Listing..."}
            </p>
            <p className="text-sm text-gray-100 mt-2">
              This may take a moment.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center uppercase tracking-wider">
        <div className="absolute inset-0 pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:skew-y-1 before:-translate-x-screen before:animate-auto-shine-screen"></div>
        <div className="relative text-gray-200">NFT Detail</div>
      </h1>

      <div className="flex space-y-8 mt-8 border-2 border-gray-700 p-8 rounded-lg shadow-lg bg-gray-800/60 backdrop-blur-lg">
        <div className="flex flex-col items-center space-y-6">
          <img
            src={nft.sImageUrl}
            alt={nft.sNftName}
            className="w-96 h-108 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        <div className="flex flex-col space-y-2 ml-10 mt-10">
          <p className="text-gray-100">
            Token address: {nft.sTokenAddress}
            <button
              className="ml-1 hover:text-teal-400"
              onClick={() => {
                handleCopyToClipboard(nft.sFirstMInterAddress);
                showToast("Address Copied!");
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className="text-gray-100 mt-10">
            Name: {nft.sNftName} #{nft.nTokenId}
          </p>
          <p className="text-gray-400 mt-10">
            Creator: {nft.sFirstMInterAddress}
            <button
              className="ml-1 hover:text-teal-400"
              onClick={() => {
                handleCopyToClipboard(nft.sFirstMInterAddress);
                showToast("Address Copied!");
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className="text-gray-100 mt-10">
            Current owner: {nft.sCurrentOwner}
            <button
              className="ml-1 hover:text-teal-400"
              onClick={() => {
                handleCopyToClipboard(nft.sCurrentOwner);
                showToast("Address Copied!");
              }}
            >
              <MdContentCopy />
            </button>
          </p>
          <p className="text-gray-400 mt-10">Description: {nft.sDescription}</p>

          {user.sWalletAddress === nft.sCurrentOwner ? (
            !nft.isApprovedForSale ? (
              <button
                onClick={handleSellClick}
                className="w-full mt-10 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
                disabled={isListing || isBuying}
              >
                Sell
              </button>
            ) : (
              <button
                onClick={() => handleCancelListing(nft)}
                className="w-full mt-10 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                disabled={isCancelling || isBuying || isListing}
              >
                {isCancelling ? "Cancelling..." : "Cancel Listing"}
              </button>
            )
          ) :
          nft.isApprovedForSale ? (
            <button
              onClick={handleBuyBtnNFt}
              className="w-full mt-10 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
              disabled={isListing || isBuying}
            >
              Buy
            </button>
          ) : (
            <div className="w-full mt-10 px-4 py-2 bg-gray-600 text-gray-300 rounded cursor-not-allowed opacity-70">
              This NFT is not listed yet
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative">
            <button
              className="absolute top-2 right-2 text-white px-3 py-1 rounded"
              onClick={() => setIsModalOpen(false)}
            >
              <span className="text-2xl font-bold">&times;</span>
            </button>
            <img
              src={nft.sImageUrl}
              alt={nft.sNftName}
              className="max-w-3xl max-h-[90vh] rounded-lg shadow-xl"
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
    </div>
  );
};

export default NFtDetail;
