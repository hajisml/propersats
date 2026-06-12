# Project: ProperSats

## Project Overview
ProperSats is a mobile-first web application engineered to revolutionize physical land acquisition (shamba buying) by eliminating counterparty risk, fraud, and payment delays. It serves as an end-to-end decentralized real estate solution where sellers list verified plots and buyers browse them interactively.

### Key Features
- **Decentralized Escrow:** Multi-signature architecture for securing transactions.
- **Lightning Settlement:** Uses the Bitcoin Lightning Network for instant, low-fee payments.
- **Automated Payouts:** Conditional distribution of funds to all stakeholders (Sellers, Surveyors, Lawyers, and Arbitrators) simultaneously.
- **Verification:** Focus on fraud prevention through verified listings.

## Technical Stack
- **Network:** Bitcoin & Lightning Network.
- **Platform:** Mobile-first Web Application.
- **Architecture:** Decentralized multi-sig escrow system.

## Directory Structure
- `spec/`: Contains core software specification documents.
    - `srs.txt`: Software Requirements Specification.
    - `sds.txt`: Software Design Specification.
- `.gitignore`: Configured to ignore the `spec/` directory (ensure these are committed or shared securely if they contain private IP).

## Stakeholders
- **Sellers:** List and advertise land.
- **Buyers:** Browse and purchase land.
- **Surveyors:** Provide verification and land details.
- **Lawyers:** Legal oversight and transaction validation.
- **Arbitrators:** Resolve disputes within the escrow system.

## Building and Running
*Commands will be added as the codebase matures.*
- **TODO:** Initialize web frontend (React/Angular) and backend/Lightning integration.

## Development Conventions
- **GitHub Flow:** All development must follow the GitHub Flow (branching, pull requests, and merging into main).
- **Security First:** Given the financial nature of the app (Bitcoin/Lightning), security and multi-sig integrity are paramount.
- **Documentation Driven:** Project started with formal SRS and SDS placeholders.
- **Mobile-First:** UI/UX must prioritize mobile accessibility.
- **Offline Context:** `GEMINI.md` is for offline reference only and should not be tracked by Git or added to `.gitignore`.
