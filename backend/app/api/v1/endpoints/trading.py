from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.core.config import get_settings
from datetime import datetime

router = APIRouter()

@router.get("/positions")
async def get_positions():
    """
    Get current trading positions
    """
    return {
        "positions": [
            {
                "symbol": "BTCUSDT",
                "quantity": 0.1,
                "entry_price": 45000.0,
                "current_price": 45500.0,
                "pnl": 500.0,
                "status": "active"
            }
        ]
    }

@router.get("/orders")
async def get_orders():
    """
    Get trading orders history
    """
    return {
        "orders": [
            {
                "id": "ord_123",
                "symbol": "BTCUSDT",
                "side": "buy",
                "quantity": 0.1,
                "price": 45000.0,
                "status": "filled",
                "timestamp": "2025-04-14T01:43:00Z"
            }
        ]
    }

@router.get("/performance")
async def get_performance():
    """
    Get trading performance metrics
    """
    return {
        "total_pnl": 500.0,
        "win_rate": 0.6,
        "average_trade_duration": "2h",
        "largest_win": 1000.0,
        "largest_loss": -500.0,
        "current_balance": 10000.0,
        "initial_balance": 10000.0
    }

@router.get("/status")
async def get_trading_status():
    """
    Get current trading status
    """
    return {
        "is_trading": True,
        "mode": "live",
        "strategy": "moving_average",
        "last_trade": "2025-04-14T01:43:00Z",
        "next_signal": "2025-04-14T01:44:00Z"
    }
