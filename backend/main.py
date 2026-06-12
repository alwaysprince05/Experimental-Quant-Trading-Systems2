from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sys
import os

# Add parent directory to path so we can import the bot modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Statistical_Arbitrage_Bot.main import run_simulation

app = FastAPI(title="Quant Dashboard API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/bots/stat-arb/simulate")
def get_stat_arb_simulation(num_days: int = 100):
    """
    Run the statistical arbitrage simulation and return the results.
    """
    data = run_simulation(num_days)
    return {"status": "success", "data": data}

# Serve React frontend static files
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    def catch_all(full_path: str):
        path_to_file = os.path.join(frontend_dist, full_path)
        if os.path.exists(path_to_file) and os.path.isfile(path_to_file):
            return FileResponse(path_to_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    # Hugging Face spaces use port 7860
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
