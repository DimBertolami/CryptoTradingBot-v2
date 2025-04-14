# Crypto Trading Bot v2

A modern cryptocurrency trading bot built with TypeScript, FastAPI, and comprehensive risk management.

## Project Structure

```
├── backend/              # FastAPI backend service
│   ├── app/             # Main application code
│   ├── tests/           # Backend tests
│   └── requirements.txt # Python dependencies
├── frontend/            # React + TypeScript frontend
│   ├── src/            # Source code
│   ├── tests/          # Frontend tests
│   └── package.json    # Frontend dependencies
├── scripts/            # Utility scripts
│   ├── startup.sh      # Start all services
│   └── shutdown.sh     # Clean shutdown
└── docs/              # Documentation
```

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DimBertolami/CryptoTradingBot-v2.git
cd CryptoTradingBot-v2
```

2. Install backend dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Start the services:
```bash
./scripts/startup.sh
```

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.