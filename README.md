# Marketplace Frontend

🚀 A modern **NFT Marketplace Frontend** built with **React + Vite**, styled using **Tailwind CSS**, and powered by **React Query** for data fetching.  

---

## ⚡ Tech Stack

- [Vite](https://vitejs.dev/) – Next-generation frontend tooling
- [React](https://react.dev/) – Component-based UI library
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [React Query](https://tanstack.com/query/latest) – Data fetching & caching
- [React Router](https://reactrouter.com/) – Client-side routing
- [React Icons](https://react-icons.github.io/react-icons/) – Icon library

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/your-username/marketplace_frontend.git
cd frontend/marketplace_frontend
```
1.**⚙️ Environment Variables**

This project uses environment variables for configuration.

Copy .env.example into a new .env file:
  ```bash
    cp .env.example .env
  ```

Update the variables inside .env as per your setup.

Example:
```bash
  VITE_API_BASE_URL = YOUR_VITE_API_BASE_URL
  VITE_PROJECT_ID = YOUR_VITE_PROJECT_ID
  VITE_MINT_CONTRACT_ADDRESS = YOUR_VITE_MINT_CONTRACT_ADDRESS
  VITE_MARKET_CONTRACT_ADDRESS = YOUR_VITE_MARKET_CONTRACT_ADDRESS
  VITE_MEDIA_CONTRACT_ADDRESS = YOUR_VITE_MEDIA_CONTRACT_ADDRESS
  VITE_BACKEND_URL = YOUR_VITE_BACKEND_URL
```


2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **🚀 Running the Project
Start the development server:**
  ```bash
  npm run dev
```

4. **Then open your browser at:**
  ```bash
  http://localhost:5173
```

5. **🛠️ Project Structure**
```bash
frontend/
  marketplace_frontend/
  │── public/              # Static assets
  │── src/
  │   ├── api/             # API calls (e.g. getAllNfts)
  │   ├── components/      # Reusable UI components
  │   ├── pages/           # Page-level components (Home, NFT Detail, etc.)
  |   ├── redux/           # for storing user state
  │   ├── routes/          # React Router configuration
  │   ├── App.jsx          # Root component
  │   └── main.jsx         # Entry point
  │
  ├── .env                 # enviroment variables
  ├── package.json         # Project config & dependencies
  ├── tailwind.config.js   # Tailwind CSS config
  └── vite.config.js       # Vite config
```
