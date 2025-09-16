import { apiClient } from "./axiosClient";

export const connectWalletApi = async (sWalletAddress) => {
  console.log("Sending to API:", { sWalletAddress }, typeof sWalletAddress);
  const response = await apiClient({
    method: "POST",
    url: "/connect-wallet",
    data: { sWalletAddress },
  });
  console.log("Response from API:", response);
  return response.data;
};

export const verifyEmail = async (payload) => {
  console.log("sending to api ", payload.sWalletAddress, payload.sEmail);
  const response = await apiClient({
    method: "PUT",
    url: "/verify-email",
    data: {sWalletAddress: payload.sWalletAddress, sEmail: payload.sEmail},
  });
  return response.data;
};

export const verifyOtp = async (payload) => {
  console.log("sending to api ", payload.sWalletAddress, payload.sEmail, payload.nOtp);
  const response = await apiClient({
    method: "PUT",
    url: "/verify-otp",
    data: { sWalletAddress: payload.sWalletAddress, sEmail: payload.sEmail, nOtp: payload.nOtp },
  });
  return response.data;
};

export const resendOtp = async (payload) => {
  console.log("Resending OTP for wallet address:", payload.sWalletAddress);
  console.log("Resending OTP for email:", payload.sEmail);
  const response = await apiClient({
    method: "PATCH",
    url: "/resend-otp",
    data: { sWalletAddress: payload.sWalletAddress, sEmail: payload.sEmail },
  });
  return response.data;
};

export const addUsername = async (payload) => {
  const response = await apiClient({
    method: "PATCH",
    url: "/set-username",
    data: payload,
  });
  return response.data;
};

export const getProfile = async () => {
  console.log("Fetching user profile with token:");
  const response = await apiClient({
    method: "GET",
    url: "/get-profile",
    // headers: {
    //   Authorization: `Bearer ${sToken}`,
    // },
  });
  return response.data;
};

export const uploadFile = async (sFile, sNftName, sDescription , nRoyalty , sTokenAddress) => {
  const formData = new FormData();
  formData.append("sFile", sFile);
  formData.append("sNftName", sNftName);
  formData.append("sDescription", sDescription);
  formData.append("nRoyalty", nRoyalty);
  formData.append("sTokenAddress", sTokenAddress);

  console.log("Uploading file:", sFile);
  const response = await apiClient({
    method: "POST",
    url: "/upload-nft-file",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      // Authorization: `Bearer ${sToken}`,
    },
  });
  return response.data;
};

export const updateUserProfileImage = async (sFile) => {
  const formData = new FormData();
  formData.append("sFile", sFile);
  // console.log("Updating user profile image with token:", sToken);
  const response = await apiClient({
    method: "PATCH",
    url: "/update-profile-image",
    data: formData,
    headers: {
      // Authorization: `Bearer ${sToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getYourNfts = async ( page) => {
  // console.log("Fetching user's NFTs with token:", sToken);
  const response = await apiClient({
    method: "GET",
    url: `/get-your-nfts?page=${page}&limit=4`,
    // headers: {
    //   Authorization: `Bearer ${sToken}`,
    // },
  });

  return response.data;
};

export const getAllNfts = async (page , search , sortField , sortOrder) => {
  console.log("Fetching all NFTs");
  const response = await apiClient({
    method: "GET",
    url: `/get-all-nfts?page=${page}&limit=8&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
  });

  return response.data;
};

export const getNftById = async (nftId) => {
  console.log("Fetching NFT by ID:", nftId);
  const response = await apiClient({
    method: "GET",
    url: `/nft-detail?id=${nftId}`,
    // headers: {
    //   Authorization: `Bearer ${sToken}`,
    // },
  });
  return response.data;
};

export const liveSellNfts = async (page) => {
  console.log("Fetching live sell NFTs");
  const response = await apiClient({
    method: "GET",
    url: `/buy-sell?page=${page}&limit=8`,
    // headers: {
    //   Authorization: `Bearer ${sToken}`,
    // },
  });
  return response.data;
};

export const updateNftById = async (payload) => {
  console.log("Updating NFT with payload:", payload);
  const response = await apiClient({
    method: "PATCH",
    url: `/update-nft`,
    data: {_id:payload},
  });
  return response.data;
}