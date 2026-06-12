import numpy as np
import pandas as pd

def run_simulation(num_days: int = 100):
    """
    Runs a synthetic statistical arbitrage simulation.
    Generates two cointegrated assets and calculates spread, z-score, and signals.
    """
    np.random.seed(42) # For reproducibility in the dashboard

    # Generate Asset A (Random Walk)
    returns_A = np.random.normal(0, 0.01, num_days)
    price_A = 100 * np.exp(np.cumsum(returns_A))

    # Generate an Orstein-Uhlenbeck process for the spread (mean-reverting)
    theta = 0.1  # speed of mean reversion
    mu = 0.0     # long-term mean
    sigma = 0.5  # volatility of the spread
    
    spread = np.zeros(num_days)
    spread[0] = 0
    for t in range(1, num_days):
        dt = 1
        dW = np.random.normal(0, np.sqrt(dt))
        # OU process: dS_t = theta * (mu - S_t) * dt + sigma * dW
        spread[t] = spread[t-1] + theta * (mu - spread[t-1]) * dt + sigma * dW

    # Asset B is cointegrated with Asset A
    price_B = price_A + spread

    df = pd.DataFrame({
        'day': range(num_days),
        'asset_A': price_A,
        'asset_B': price_B,
        'spread': spread
    })

    # Calculate rolling Z-score
    window = 20
    df['spread_mean'] = df['spread'].rolling(window=window).mean()
    df['spread_std'] = df['spread'].rolling(window=window).std()
    df['z_score'] = (df['spread'] - df['spread_mean']) / df['spread_std']

    # Generate Signals
    df['signal'] = 0  # 0: hold, 1: buy spread, -1: sell spread
    
    # Fill NA for initial window
    df['z_score'] = df['z_score'].fillna(0)
    
    # We use a simple threshold
    entry_threshold = 2.0
    exit_threshold = 0.5
    
    current_position = 0
    signals = []
    
    for i in range(num_days):
        z = df.iloc[i]['z_score']
        if current_position == 0:
            if z > entry_threshold:
                current_position = -1 # Sell spread
            elif z < -entry_threshold:
                current_position = 1  # Buy spread
        elif current_position == -1:
            if z < exit_threshold:
                current_position = 0  # Close short
        elif current_position == 1:
            if z > -exit_threshold:
                current_position = 0  # Close long
        
        signals.append(current_position)
        
    df['position'] = signals

    # Convert to list of dicts for JSON serialization
    # Replace NaN with None
    df = df.replace({np.nan: None})
    return df.to_dict(orient='records')

if __name__ == "__main__":
    # If run directly, just test it
    data = run_simulation(10)
    for row in data:
        print(row)
