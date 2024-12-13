from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from google.cloud import storage
import json
import os

app = FastAPI()

# CORS-Middleware konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://getraenke-app-2023.ew.r.appspot.com",  # Production frontend
        "https://default-dot-getraenke-app-2023.ew.r.appspot.com",  # Production frontend (default service)
        "http://localhost:5173",                    # Local development
        "http://localhost:8000",                    # Local development
        "http://localhost:3001",                     # Local development React
        "https://getraenke-app-2023.web.app"        # Frontend domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Google Cloud Storage Setup
BUCKET_NAME = "getraenke-app-2023-data"
storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)

# Hilfsfunktionen für Google Cloud Storage
def save_to_gcs(blob_name: str, data: dict):
    blob = bucket.blob(blob_name)
    blob.upload_from_string(json.dumps(data))

def load_from_gcs(blob_name: str, default_data=None):
    blob = bucket.blob(blob_name)
    try:
        return json.loads(blob.download_as_string())
    except Exception:
        return default_data if default_data is not None else []

# Standardgetränke
DEFAULT_DRINKS = [
    {"id": 2, "name": "Wasser", "price": 6.0, "description": "ohne Kohlensäure"},
    {"id": 4, "name": "Siroup", "price": 2.0, "description": "Cola Geschmack"},
    {"id": 5, "name": "Cola", "price": 4.0, "description": "4dl"},
    {"id": 6, "name": "Schlumpf", "price": 10.0, "description": ""}
]

# Initialisiere JSON-Dateien, falls sie nicht existieren
if not load_from_gcs("drinks.json"):
    save_to_gcs("drinks.json", DEFAULT_DRINKS)

if not load_from_gcs("orders.json"):
    save_to_gcs("orders.json", [])

if not load_from_gcs("statistics.json"):
    save_to_gcs("statistics.json", [])

# Modelle
class Drink(BaseModel):
    id: int
    name: str
    price: float
    description: str

class DrinkCreate(BaseModel):
    name: str
    price: float
    description: str

class OrderItem(BaseModel):
    drink_id: int
    quantity: int

class Order(BaseModel):
    id: int
    customer_name: str
    items: List[OrderItem]
    total_price: float
    status: str
    created_at: str

class OrderCreate(BaseModel):
    customer_name: str
    items: List[OrderItem]

class DrinkStatistics(BaseModel):
    drink_id: int
    name: str
    total_quantity: int
    total_revenue: float

class Statistics(BaseModel):
    drink_id: int
    total_quantity: int = 0
    total_revenue: float = 0.0

class StatisticsResponse(BaseModel):
    drinks: List[DrinkStatistics]
    total_orders: int
    open_orders: int

class LoginRequest(BaseModel):
    password: str

# Hilfsfunktionen für Datenpersistenz
def save_drinks():
    save_to_gcs("drinks.json", [drink.dict() for drink in DRINKS])

def load_drinks():
    return [Drink(**drink) for drink in load_from_gcs("drinks.json", DEFAULT_DRINKS)]

def save_orders():
    save_to_gcs("orders.json", [order.dict() for order in ORDERS])

def load_orders():
    return [Order(**order) for order in load_from_gcs("orders.json", [])]

def save_statistics(stats):
    save_to_gcs("statistics.json", [stat.dict() for stat in stats])

def load_statistics():
    return [Statistics(**stat) for stat in load_from_gcs("statistics.json", [])]

# Lade gespeicherte Daten beim Start
DRINKS = load_drinks()
ORDERS = load_orders()
STATISTICS = load_statistics()

# Initialisiere order_counter mit der höchsten vorhandenen ID + 1
order_counter = max([order.id for order in ORDERS], default=-1) + 1
drink_counter = max([d.id for d in DRINKS], default=0) + 1

# Hilfsfunktion
def calculate_total_price(items: List[OrderItem]) -> float:
    total = 0.0
    for item in items:
        drink = next((d for d in DRINKS if d.id == item.drink_id), None)
        if drink:
            total += drink.price * item.quantity
    return total

def update_statistics(order: Order):
    for item in order.items:
        stat = next((s for s in STATISTICS if s.drink_id == item.drink_id), None)
        if stat is None:
            stat = Statistics(drink_id=item.drink_id)
            STATISTICS.append(stat)
        
        drink = next((d for d in DRINKS if d.id == item.drink_id), None)
        if drink:
            stat.total_quantity += item.quantity
            stat.total_revenue += item.quantity * drink.price
    
    save_statistics(STATISTICS)

# Login endpoint
@app.post("/verify-admin")
async def verify_admin(login: LoginRequest):
    print(f"Received login request with password: {login.password}")  # Debug log
    # Replace this with a secure password check in production
    if login.password == "12122424":
        print("Login successful")  # Debug log
        return {"valid": True}
    print("Login failed")  # Debug log
    return {"valid": False}

# Routen
@app.get("/drinks", response_model=List[Drink])
async def get_drinks():
    return DRINKS

@app.post("/drinks")
async def create_drink(drink: DrinkCreate):
    global drink_counter
    new_drink = Drink(
        id=drink_counter,
        name=drink.name,
        price=drink.price,
        description=drink.description
    )
    DRINKS.append(new_drink)
    drink_counter += 1
    save_drinks()
    return new_drink

@app.put("/drinks/{drink_id}", response_model=Drink)
async def update_drink(drink_id: int, drink: DrinkCreate):
    drink_idx = next((i for i, d in enumerate(DRINKS) if d.id == drink_id), None)
    if drink_idx is None:
        raise HTTPException(status_code=404, detail="Getränk nicht gefunden")
    
    DRINKS[drink_idx] = Drink(
        id=drink_id,
        name=drink.name,
        price=drink.price,
        description=drink.description
    )
    save_drinks()
    return DRINKS[drink_idx]

@app.delete("/drinks/{drink_id}")
async def delete_drink(drink_id: int):
    drink_idx = next((i for i, d in enumerate(DRINKS) if d.id == drink_id), None)
    if drink_idx is None:
        raise HTTPException(status_code=404, detail="Getränk nicht gefunden")
    
    DRINKS.pop(drink_idx)
    save_drinks()
    return {"message": "Getränk gelöscht"}

@app.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    global order_counter
    
    # Überprüfe, ob alle Getränke existieren
    for item in order.items:
        if not any(drink.id == item.drink_id for drink in DRINKS):
            raise HTTPException(status_code=404, detail=f"Getränk mit ID {item.drink_id} nicht gefunden")
    
    total_price = calculate_total_price(order.items)
    
    new_order = Order(
        id=order_counter,
        customer_name=order.customer_name,
        items=order.items,
        total_price=total_price,
        status="offen",
        created_at=datetime.now().isoformat()
    )
    ORDERS.append(new_order)
    order_counter += 1
    save_orders()
    
    # Aktualisiere Statistiken
    update_statistics(new_order)
    
    return new_order

@app.get("/orders", response_model=List[Order])
async def get_orders():
    return ORDERS

@app.put("/orders/{order_id}/complete", response_model=Order)
async def complete_order(order_id: int):
    order = next((o for o in ORDERS if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    order.status = "fertig"
    save_orders()
    return order

@app.put("/orders/{order_id}/paid")
async def mark_order_as_paid(order_id: int):
    order = next((o for o in ORDERS if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    order.status = "bezahlt"
    save_orders()
    return {"message": "Bestellung als bezahlt markiert"}

@app.put("/orders/{order_id}/prepared")
async def mark_order_as_prepared(order_id: int):
    order = next((o for o in ORDERS if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    order.status = "zubereitet"
    save_orders()
    return {"message": "Bestellung als zubereitet markiert"}

@app.get("/statistics", response_model=StatisticsResponse)
async def get_statistics():
    stats = []
    total_orders = len(ORDERS)
    open_orders = len([order for order in ORDERS if order.status == 'offen'])
    
    for drink in DRINKS:
        drink_orders = 0
        drink_revenue = 0.0
        for order in ORDERS:
            for item in order.items:
                if item.drink_id == drink.id:
                    drink_orders += item.quantity
                    drink_revenue += item.quantity * drink.price
        
        stats.append(DrinkStatistics(
            drink_id=drink.id,
            name=drink.name,
            total_quantity=drink_orders,
            total_revenue=drink_revenue
        ))
    
    return StatisticsResponse(
        drinks=stats,
        total_orders=total_orders,
        open_orders=open_orders
    )

@app.post("/statistics/reset")
async def reset_stats():
    global ORDERS
    global order_counter
    global STATISTICS
    ORDERS = []  # Lösche alle Bestellungen
    order_counter = 0  # Setze den Bestellungszähler zurück
    STATISTICS = []  # Lösche alle Statistiken
    save_orders()
    save_statistics(STATISTICS)
    return {"message": "Statistiken und Bestellungen wurden zurückgesetzt"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
