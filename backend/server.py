from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'fantasy_football_secret_key_2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

security = HTTPBearer()

# Enums
class PlayerPosition(str, Enum):
    GK = "GK"  # Portiere
    DEF = "DEF"  # Difensore
    MID = "MID"  # Centrocampista
    ATT = "ATT"  # Attaccante

class AuctionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    PENDING = "PENDING"

# Models
class Manager(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    team_name: str
    budget: float = 100.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ManagerCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    team_name: str

class ManagerLogin(BaseModel):
    email: EmailStr
    password: str

class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: PlayerPosition
    team: str
    base_price: float
    current_owner: Optional[str] = None
    goals: int = 0
    assists: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlayerCreate(BaseModel):
    name: str
    position: PlayerPosition
    team: str
    base_price: float

class Auction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    current_bid: float
    current_bidder: Optional[str] = None
    status: AuctionStatus = AuctionStatus.ACTIVE
    end_time: datetime
    participants: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuctionCreate(BaseModel):
    player_id: str
    starting_bid: float
    duration_minutes: int = 5

class Bid(BaseModel):
    auction_id: str
    bidder_id: str
    amount: float

class Squad(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    manager_id: str
    players: List[str] = []  # player IDs
    formation: str = "4-3-3"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_manager(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        manager_id: str = payload.get("sub")
        if manager_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return manager_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes - Authentication
@api_router.post("/register")
async def register_manager(manager_data: ManagerCreate):
    # Check if manager exists
    existing = await db.managers.find_one({"email": manager_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(manager_data.password)
    
    # Create manager
    manager_dict = manager_data.dict()
    del manager_dict["password"]
    manager = Manager(**manager_dict)
    
    # Store in DB
    manager_doc = manager.dict()
    manager_doc["password"] = hashed_password
    await db.managers.insert_one(manager_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": manager.id})
    
    return {"access_token": access_token, "token_type": "bearer", "manager": manager}

@api_router.post("/login")
async def login_manager(login_data: ManagerLogin):
    # Find manager
    manager_doc = await db.managers.find_one({"email": login_data.email})
    if not manager_doc or not verify_password(login_data.password, manager_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": manager_doc["id"]})
    
    # Return manager without password
    del manager_doc["password"]
    manager = Manager(**manager_doc)
    
    return {"access_token": access_token, "token_type": "bearer", "manager": manager}

# Routes - Players
@api_router.get("/players", response_model=List[Player])
async def get_players():
    players = await db.players.find().to_list(None)
    return [Player(**player) for player in players]

@api_router.post("/players", response_model=Player)
async def create_player(player_data: PlayerCreate, manager_id: str = Depends(get_current_manager)):
    player = Player(**player_data.dict())
    await db.players.insert_one(player.dict())
    return player

# Routes - Auctions
@api_router.get("/auctions", response_model=List[Auction])
async def get_auctions():
    auctions = await db.auctions.find().to_list(None)
    return [Auction(**auction) for auction in auctions]

@api_router.post("/auctions", response_model=Auction)
async def create_auction(auction_data: AuctionCreate, manager_id: str = Depends(get_current_manager)):
    # Check if player exists
    player = await db.players.find_one({"id": auction_data.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if player is already owned
    if player.get("current_owner"):
        raise HTTPException(status_code=400, detail="Player already owned")
    
    # Create auction
    end_time = datetime.now(timezone.utc) + timedelta(minutes=auction_data.duration_minutes)
    auction = Auction(
        player_id=auction_data.player_id,
        current_bid=auction_data.starting_bid,
        end_time=end_time
    )
    
    await db.auctions.insert_one(auction.dict())
    return auction

@api_router.post("/auctions/{auction_id}/bid")
async def place_bid(auction_id: str, bid_data: Bid, manager_id: str = Depends(get_current_manager)):
    # Get auction
    auction_doc = await db.auctions.find_one({"id": auction_id})
    if not auction_doc:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    auction = Auction(**auction_doc)
    
    # Check if auction is active
    current_time = datetime.now(timezone.utc)
    # Ensure auction.end_time is timezone-aware
    if auction.end_time.tzinfo is None:
        auction_end_time = auction.end_time.replace(tzinfo=timezone.utc)
    else:
        auction_end_time = auction.end_time
    
    if auction.status != AuctionStatus.ACTIVE or auction_end_time < current_time:
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    # Check if bid is higher than current
    if bid_data.amount <= auction.current_bid:
        raise HTTPException(status_code=400, detail="Bid must be higher than current bid")
    
    # Get manager budget
    manager_doc = await db.managers.find_one({"id": manager_id})
    if not manager_doc or manager_doc["budget"] < bid_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient budget")
    
    # Update auction
    await db.auctions.update_one(
        {"id": auction_id},
        {
            "$set": {
                "current_bid": bid_data.amount,
                "current_bidder": manager_id
            },
            "$addToSet": {"participants": manager_id}
        }
    )
    
    return {"message": "Bid placed successfully", "amount": bid_data.amount}

# Routes - Squad Management
@api_router.get("/my-squad")
async def get_my_squad(manager_id: str = Depends(get_current_manager)):
    # Get manager's players
    players = await db.players.find({"current_owner": manager_id}).to_list(None)
    return [Player(**player) for player in players]

@api_router.get("/managers/{manager_id}")
async def get_manager_profile(manager_id: str):
    manager_doc = await db.managers.find_one({"id": manager_id})
    if not manager_doc:
        raise HTTPException(status_code=404, detail="Manager not found")
    
    # Remove password from response
    if "password" in manager_doc:
        del manager_doc["password"]
    
    return Manager(**manager_doc)

# Seed initial players
@api_router.post("/seed-players")
async def seed_initial_players(manager_id: str = Depends(get_current_manager)):
    # Check if players already exist
    existing_count = await db.players.count_documents({})
    if existing_count > 0:
        return {"message": "Players already seeded"}
    
    # Sample players for different teams
    sample_players = [
        {"name": "Gianluigi Donnarumma", "position": PlayerPosition.GK, "team": "Paris SG", "base_price": 15.0},
        {"name": "Virgil van Dijk", "position": PlayerPosition.DEF, "team": "Liverpool", "base_price": 25.0},
        {"name": "Sergio Ramos", "position": PlayerPosition.DEF, "team": "PSG", "base_price": 20.0},
        {"name": "Kevin De Bruyne", "position": PlayerPosition.MID, "team": "Man City", "base_price": 30.0},
        {"name": "Luka Modrić", "position": PlayerPosition.MID, "team": "Real Madrid", "base_price": 22.0},
        {"name": "Kylian Mbappé", "position": PlayerPosition.ATT, "team": "Real Madrid", "base_price": 40.0},
        {"name": "Erling Haaland", "position": PlayerPosition.ATT, "team": "Man City", "base_price": 35.0},
        {"name": "Lionel Messi", "position": PlayerPosition.ATT, "team": "Inter Miami", "base_price": 38.0},
        {"name": "Pedri", "position": PlayerPosition.MID, "team": "Barcelona", "base_price": 18.0},
        {"name": "Jamal Musiala", "position": PlayerPosition.MID, "team": "Bayern", "base_price": 20.0},
        {"name": "Alphonso Davies", "position": PlayerPosition.DEF, "team": "Bayern", "base_price": 16.0},
        {"name": "Thibaut Courtois", "position": PlayerPosition.GK, "team": "Real Madrid", "base_price": 12.0},
    ]
    
    players_to_insert = []
    for player_data in sample_players:
        player = Player(**player_data)
        players_to_insert.append(player.dict())
    
    await db.players.insert_many(players_to_insert)
    return {"message": f"Seeded {len(players_to_insert)} players successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()