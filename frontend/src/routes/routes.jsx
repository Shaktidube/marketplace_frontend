import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ConnectWallet from "../pages/ConnectWallet.jsx";
import MintNft from "../pages/MintNft.jsx";
import Profile from "../pages/Profile.jsx";
import Home from "../pages/Home.jsx";
import { getItemFromLocalStorage } from "../utils/helper.js";
import PageNotFound from "../components/PageNotFound.jsx";
import { useSelector } from "react-redux";
import UserEmail from "../components/UserEmail.jsx";
import NFtDetail from "../pages/NFtDetail.jsx";
import BuySell from "../pages/BuySell.jsx";
import ListForSell from "../pages/ListForSell.jsx";

const ProtectedRoute = ({ children }) => {
  const sToken = getItemFromLocalStorage("userToken");
  const user = useSelector((state) => state.auth.user);

  console.log("ProtectedRoute : sToken from storage:", sToken);
  console.log("ProtectedRoute : user from redux:", user);

  if (!sToken) {
    console.log("User is not authenticated : redirecting to login");
    return <Navigate to="/" />;
  }
  
  if (!user?.isVerified) {
    console.log("User is not verified : redirecting to verification page");
    return <UserEmail sWalletAddress={user.sWalletAddress} />;
  }

  if (!user.sUsername){
    console.log("User does not have a username : redirecting to username setup");
    return <UserEmail sWalletAddress={user.sWalletAddress} />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const sToken = getItemFromLocalStorage("userToken");

  console.log("PublicRoute : sToken from storage:", sToken);

  if (sToken) {
    console.log("User is already authenticated : redirecting to home");
    return <Navigate to="/profile" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <ConnectWallet />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mint-nft"
        element={
          <ProtectedRoute>
            <MintNft />
          </ProtectedRoute>
        }
      />
      <Route
        path="/list-for-sell"
        element={
          <ProtectedRoute>
            <ListForSell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buy-sell"
        element={
          <ProtectedRoute>
            <BuySell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nft-detail/:nftId"
        element={
          <ProtectedRoute>
            <NFtDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <PageNotFound/>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
