import { createSlice } from '@reduxjs/toolkit';
import {
  removeItemFromLocalStorage,
  setItemFromLocalStorage,
} from '../utils/helper';
import Cookies from 'js-cookie';
import socket from '../utils/socket';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: {},
    provider: {},
  },
  reducers: {
    setProvider: (state, action) => {
      state.provider.provider = action.payload;
    },
    setWalletAddress: (state, action) => {
      const {
        sWalletAddress,
        sToken,
        isVerified,
        sEmail,
        sUsername,
        sUserProfileImage,
      } = action.payload;
      state.user.sWalletAddress = sWalletAddress;
      state.user.sToken = sToken;
      state.user.isVerified = isVerified;
      state.user.sEmail = sEmail;
      state.user.sUsername = sUsername;
      state.user.sUserProfileImage = sUserProfileImage;
      // console.log("sToken ", sToken);
      // console.log("sWalletAddress ", sWalletAddress);
      // console.log("isVerified ", isVerified);
      // console.log("sEmail ", sEmail);
      // console.log("sUsername ", sUsername);
      // console.log("userProfileImage ", sUserProfileImage);
      if (socket && !socket.connected) {
        socket.on('connect', () => {
          console.log('Socket connected with id:', socket.id);
        });
      }
      if (sToken) {
        setItemFromLocalStorage('userToken', sToken);
        Cookies.set('userToken', sToken, {
          expires: 7,
          secure: true,
          sameSite: 'strict',
        });
      }
    },
    disconnectWallet: (state) => {
      state.user = {};
      state.provider = {};
      removeItemFromLocalStorage('userToken');
      Cookies.remove('userToken');
      socket.disconnect();
      console.log('User disconnected, token removed from local storage');
    },
  },
});

export const { setUser, setProvider, setWalletAddress, disconnectWallet } =
  authSlice.actions;
export default authSlice.reducer;
