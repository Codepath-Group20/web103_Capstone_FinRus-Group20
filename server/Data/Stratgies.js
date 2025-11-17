const strategies = [
    {
            "id": "moving_average_crossover",
            "name": "Moving Average Crossover",
            "description": "Buy when short-term MA crosses above long-term MA, sell when it crosses below",
            "category": "trend_following",
            "riskLevel": "medium",
            "timeFrame": ["1h", "4h", "1d"],
            // Parameters will be filled in dynamically
            "parameters": {
                "shortPeriod": null,
                "longPeriod": null,
                "stopLoss": null,
                "takeProfit": null
            },
            "indicators": ["SMA", "EMA"],
            "code": {
                "entry": "short_ma > long_ma AND previous_short_ma <= previous_long_ma",
                "exit": "short_ma < long_ma OR stop_loss_triggered OR take_profit_triggered"
            },
            // Backtest results will update after running backtests
            "backtestResults": {
                "winRate": 0.00,
                "averageReturn": 0.00,
                "maxDrawdown": 0.0
            }
        },
        {
            "id": "rsi_oversold_overbought",
            "name": "RSI Oversold/Overbought",
            "description": "Buy when RSI is oversold (<30), sell when overbought (>70)",
            "category": "momentum",
            "riskLevel": "low",
            "timeFrame": ["15m", "1h", "4h"],
            "parameters": {
                "rsiPeriod": 14,
                "oversoldThreshold": 30,
                "overboughtThreshold": 70,
                "stopLoss": 1.5,
                "takeProfit": 3.0
            },
            "indicators": ["RSI"],
            "code": {
                "entry": "rsi <= oversoldThreshold",
                "exit": "rsi >= overboughtThreshold OR stop_loss_triggered OR take_profit_triggered"
            },
            "backtestResults": {
                "winRate": 0.58,
                "averageReturn": 0.08,
                "maxDrawdown": 0.05
            }
        },
        {
            "id": "bollinger_bands_bounce",
            "name": "Bollinger Bands Bounce",
            "description": "Buy at lower band, sell at upper band",
            "category": "mean_reversion",
            "riskLevel": "medium",
            "timeFrame": ["1h", "4h"],
            "parameters": {
                "period": 20,
                "standardDeviations": 2,
                "stopLoss": 2.5,
                "takeProfit": 5.0
            },
            "indicators": ["Bollinger Bands", "SMA"],
            "code": {
                "entry": "price <= lower_band",
                "exit": "price >= upper_band OR stop_loss_triggered OR take_profit_triggered"
            },
            "backtestResults": {
                "winRate": 0.62,
                "averageReturn": 0.15,
                "maxDrawdown": 0.12
            }
        },
        {
            "id": "macd_signal",
            "name": "MACD Signal",
            "description": "Buy when MACD crosses above signal line, sell when crosses below",
            "category": "momentum",
            "riskLevel": "medium",
            "timeFrame": ["4h", "1d"],
            "parameters": {
                "fastPeriod": 12,
                "slowPeriod": 26,
                "signalPeriod": 9,
                "stopLoss": 3.0,
                "takeProfit": 6.0
            },
            "indicators": ["MACD"],
            "code": {
                "entry": "macd > signal_line AND previous_macd <= previous_signal_line",
                "exit": "macd < signal_line OR stop_loss_triggered OR take_profit_triggered"
            },
            "backtestResults": {
                "winRate": 0.60,
                "averageReturn": 0.18,
                "maxDrawdown": 0.15
            }
        },
        {
            "id": "support_resistance_breakout",
            "name": "Support/Resistance Breakout",
            "description": "Buy on resistance breakout, sell on support breakdown",
            "category": "breakout",
            "riskLevel": "high",
            "timeFrame": ["4h", "1d"],
            "parameters": {
                "lookbackPeriod": 50,
                "volumeConfirmation": true,
                "stopLoss": 2.0,
                "takeProfit": 8.0
            },
            "indicators": ["Support/Resistance", "Volume"],
            "code": {
                "entry": "price > resistance_level AND volume > average_volume",
                "exit": "price < support_level OR stop_loss_triggered OR take_profit_triggered"
            },
            "backtestResults": {
                "winRate": 0.55,
                "averageReturn": 0.25,
                "maxDrawdown": 0.20
            }
        }
    ],
    "metadata": {
        "version": "1.0",
        "lastUpdated": "2024-01-15",
        "totalStrategies": 5,
        "categories": ["trend_following", "momentum", "mean_reversion", "breakout"],
        "riskLevels": ["low", "medium", "high"]
    }
}