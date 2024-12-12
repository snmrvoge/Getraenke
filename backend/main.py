from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os

app = FastAPI()

# CORS-Middleware konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Erlaubt Zugriff von allen Ursprüngen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Datei-Pfade
DATA_DIR = "data"
DRINKS_FILE = os.path.join(DATA_DIR, "drinks.json")
ORDERS_FILE = os.path.join(DATA_DIR, "orders.json")
STATS_FILE = os.path.join(DATA_DIR, "statistics.json")

# Erstelle data-Verzeichnis, falls es nicht existiert
os.makedirs(DATA_DIR, exist_ok=True)

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

class LoginRequest(BaseModel):
    password: str

# Hilfsfunktionen für Datenpersistenz
def save_drinks():
    with open(DRINKS_FILE, 'w', encoding='utf-8') as f:
        json.dump([drink.dict() for drink in DRINKS], f, ensure_ascii=False, indent=2)

def load_drinks():
    if os.path.exists(DRINKS_FILE):
        with open(DRINKS_FILE, 'r', encoding='utf-8') as f:
            drinks_data = json.load(f)
            return [Drink(**drink) for drink in drinks_data]
    return [
        Drink(id=1, name="Cappuccino", price=5.00, description="Italienischer Kaffee-Klassiker"),
        Drink(id=2, name="Latte Macchiato", price=6.00, description="Espresso mit viel Milch"),
        Drink(id=3, name="Espresso", price=3.00, description="Starker italienischer Espresso")
    ]

def save_orders():
    with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
        json.dump([order.dict() for order in ORDERS], f, ensure_ascii=False, indent=2)

def load_orders():
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
            orders_data = json.load(f)
            return [Order(**order) for order in orders_data]
    return []

def save_statistics(stats):
    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump([stat.dict() for stat in stats], f, ensure_ascii=False, indent=2)

def load_statistics():
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, 'r', encoding='utf-8') as f:
            stats_data = json.load(f)
            return [Statistics(**stat) for stat in stats_data]
    return []

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

# Routen
@app.get("/drinks", response_model=List[Drink])
async def get_drinks():
    return DRINKS

@app.post("/drinks", response_model=Drink)
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

@app.get("/statistics")
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
        
        stats.append({
            'drink_id': drink.id,
            'name': drink.name,
            'total_quantity': drink_orders,
            'total_revenue': drink_revenue
        })
    
    return {
        'drinks': stats,
        'total_orders': total_orders,
        'open_orders': open_orders
    }

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

@app.post("/verify-admin")
async def verify_admin(login: LoginRequest):
    if login.password == "12122424":
        return {"valid": True}
    return {"valid": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
