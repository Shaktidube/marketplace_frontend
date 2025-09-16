import React, { useEffect, useState } from "react";
import UserEmail from "../components/UserEmail";
import { useMutation } from "@tanstack/react-query";
import { connectWalletApi } from "../api/user";
import { useDispatch } from "react-redux";
import { setProvider, setWalletAddress } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { setItemFromLocalStorage, showToast } from "../utils/helper";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";

const ConnectWallet = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [existingUser, setExistingUser] = useState(null);


  const dispatch = useDispatch();
  const navigate = useNavigate();

  const name = "MyNFT";
  const singleQue = 'shakti';

  // useEffect(() => {
  //     console.log("socket connected?", socket.connected, socket);
  //     if(!socket.connected){
  //        socket.connect();
  //        console.log("socket connected", socket);
  //     }
  
  //     socket.on("connect" , () => {
  //         console.log("socket connected", socket.id);
  //     })
  
  //     socket.on("disconnect" , () => {
  //         console.log("socket disconnected", socket.id);
  //     })
  
  //     socket.on("connect_error", (err) => {
  //         console.log(`Connection error: ${err}`);
  //     });
  
  //     return () => {
  //       socket.off("connect");
  //       socket.off("disconnect");
  //       socket.off("connect_error");
  //       socket.off("connection_success");
  //     };
  // }, [user.sWalletAddress])

  const { mutate: mutateConnectWallet, isPending } = useMutation({
    mutationFn: (payload) => connectWalletApi(payload),
    onSuccess: (data) => {
      const { sWalletAddress, sToken, isVerified, sEmail, sUsername, sUserProfileImage } = data.data;
      dispatch(setWalletAddress({ sWalletAddress, sToken, sEmail, isVerified, sUsername, sUserProfileImage }));
      navigate("/buy-sell");
      showToast("Wallet connected successfully!", "success");
    },
    onError: (error) => {
      if (error.status === 409) {
        const { sWalletAddress, sToken, isVerified, sEmail, sUsername, sUserProfileImage } = error.data.data;
        setItemFromLocalStorage("userToken", sToken);
        dispatch(setWalletAddress({ sWalletAddress, sToken, isVerified, sEmail, sUsername, sUserProfileImage }));
        if (!isVerified) {
          setExistingUser(sWalletAddress);  
        } else {
          navigate("/home");
        }
      }
    },
  });

  useEffect(() => {
    if (isConnected && address) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      dispatch(setProvider(provider));
      mutateConnectWallet(address);
    }
  }, [isConnected, address]);
    

  const handleConnect = async () => {
    try {
      await open({ view: "Connect", namespace: "eip155" });
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[100%] h-[100vh] bg-slate-950 text-white p-6 overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-blue-900/60 animate-[glow_20s_ease-in-out_infinite] opacity-60"></div>
        <div className="absolute inset-0 stars-1"></div>
        <div className="absolute inset-0 stars-2"></div>
      </div>

      
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={handleConnect}
            disabled={isPending}
            className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 ease-in-out
                       bg-blue-600/80 backdrop-blur-sm border border-blue-500/50 hover:bg-blue-700/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isPending ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-slate-900/60 p-10 shadow-2xl border border-white/20 backdrop-blur-lg transition-all duration-300 transform hover:scale-[1.02]">
        
        <div className="flex justify-center mb-6">
          <svg className="h-14 w-14 text-blue-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-1-8v2H9v-2h2zm4 0v2h-2v-2h2z" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-2 text-center">
          Welcome
        </h1>
        <p className="text-gray-300 text-lg text-center font-light mb-8">
          Enter the world of digital assets.
        </p>

        {isConnected && !existingUser && (
          <p className="text-red-400 text-center mb-4">server not started yet!!</p>
        )}
        {existingUser && (
          <UserEmail sWalletAddress={existingUser} />
        )}
      </div>

      <style>
        {`
          @keyframes glow {
            0%, 100% { filter: hue-rotate(0deg) blur(2px); }
            50% { filter: hue-rotate(360deg) blur(4px); }
          }
          
          .stars-1 {
            background-image: radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px);
            background-size: 50px 50px;
            background-position: 0 0, 25px 25px;
            animation: stars-move 180s linear infinite;
            position: absolute;
            width: 300%;
            height: 300%;
            opacity: 0.7;
          }
          
          .stars-2 {
            background-image: radial-gradient(#aaa 0.5px, transparent 0.5px), radial-gradient(#aaa 0.5px, transparent 0.5px);
            background-size: 30px 30px;
            background-position: 0 0, 15px 15px;
            animation: stars-move 120s linear infinite;
            position: absolute;
            width: 300%;
            height: 300%;
            opacity: 0.6;
          }

          @keyframes stars-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-100%, -50%); }
          }
        `}
      </style>
    </div>
  );
};

export default ConnectWallet;
