# ProperSats ⚡️🏰

ProperSats is a mobile-first web application designed to revolutionize physical land acquisition (shamba buying) by eliminating counterparty risk, fraud, and payment delays. It leverages the **Bitcoin Lightning Network** and a **Decentralized Escrow** architecture to ensure secure, instant, and transparent real estate transactions.

## 🌟 Key Features

- **Lightning Fast Payments:** Instant settlement via the Bitcoin Lightning Network.
- **Decentralized Escrow:** 2-of-2 multi-signature style logic (Buyer pays -> Surveyor/Lawyer verifies -> Funds released).
- **Automated Payouts:** Funds are automatically split between the Seller, Surveyor, Lawyer, and Platform upon escrow approval.
- **Stakeholder Dashboard:** Dedicated views for Buyers, Surveyors, and Lawyers to manage their parts of the transaction.
- **WebLN Integration:** Seamless payment experience for users with WebLN-compatible wallets (like Alby or Mutiny).
- **Mobile-First Design:** A sleek, responsive UI built for modern web browsers.

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Testing:** Playwright

### Backend
- **Framework:** FastAPI (Python 3.13+)
- **Server:** Uvicorn
- **Dependency Management:** `uv`
- **Lightning Integration:** Custom client interfacing with LND (REST API)

## 🚀 Getting Started

### Prerequisites
- **Python 3.13+**
- **Node.js 20+**
- **Polar** (or a local LND node) for Lightning Network simulation.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies (using `uv` is recommended):
   ```bash
   uv sync
   ```
3. Create a `.env` file (see `.env.example` or use the provided defaults):
   ```bash
   LND_URL=https://127.0.0.1:8081  # Your LND REST Host
   LND_MACAROON=your_hex_macaroon  # Your Admin Macaroon
   ```
4. Start the FastAPI server:
   ```bash
   uv run uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing

### Backend Tests
Run the pytest suite:
```bash
cd backend
uv run pytest
```

### Frontend Tests
Run the Playwright E2E tests:
```bash
cd frontend
npx playwright test
```

## 📐 Architecture

ProperSats follows a decoupled architecture:

1. **Marketplace:** Buyers browse verified plots.
2. **Payment Phase:** Buyer triggers a purchase, generating a Lightning invoice via the backend.
3. **Escrow Phase:** Once paid, the plot status moves to `pending_escrow`. Funds are held (conceptually) until stakeholders approve.
4. **Settlement Phase:** Both the Surveyor (verifying physical land) and Lawyer (verifying title deeds) must approve the transaction in the dashboard.
5. **Payout Phase:** Upon dual approval, the backend triggers automated payouts to all parties involved.

## 🤝 Stakeholders

- **Sellers:** List and advertise land.
- **Buyers:** Securely purchase land using Bitcoin.
- **Surveyors:** Physical verification and boundary validation.
- **Lawyers:** Legal oversight and title deed validation.
- **Arbitrators:** (Future) Resolution of disputes within the escrow system.

---

Built for the future of Bitcoin. 🌍⚡️
