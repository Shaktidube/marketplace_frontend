import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";

let signClient;

export const initSignClient = async () => {
  signClient = await SignClient.init({
    projectId: import.meta.env.VITE_PROJECT_ID,
    metadata: {
      name: "Demo Dapp",
      description: "Dapp using WalletConnect",
      url: "https://yourapp.com",
      icons: [],
    },
  });
  return signClient;
};