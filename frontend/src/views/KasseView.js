import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../config';

function KasseView() {
  const [drinks, setDrinks] = useState([]);
  const [error, setError] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [order, setOrder] = useState({});
  const [openOrders, setOpenOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [settings, setSettings] = useState({
    show_order_count: true,
    show_last_order: true,
    show_order_list: true
  });

  useEffect(() => {
    fetchDrinks();
    fetchOpenOrders();
    fetchSettings();
    const interval = setInterval(fetchOpenOrders, 10000); // Alle 10 Sekunden aktualisieren
    return () => clearInterval(interval);
  }, []);

  const fetchDrinks = async () => {
    try {
      const response = await axios.get(`${API_URL}/drinks`);
      setDrinks(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching drinks:', error);
      setError('Failed to load drinks. Please try again.');
    }
  };

  const fetchOpenOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      const orders = response.data;
      const openOrdersList = orders.filter(order => order.status === 'offen');
      setOpenOrders(openOrdersList);
      if (openOrdersList.length > 0) {
        setLastOrder(openOrdersList[openOrdersList.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching open orders:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleIncrement = (drinkId) => {
    setOrder(prev => ({
      ...prev,
      [drinkId]: (prev[drinkId] || 0) + 1
    }));
  };

  const handleDecrement = (drinkId) => {
    setOrder(prev => ({
      ...prev,
      [drinkId]: Math.max((prev[drinkId] || 0) - 1, 0)
    }));
  };

  const calculateTotal = () => {
    return drinks.reduce((total, drink) => {
      return total + (drink.price * (order[drink.id] || 0));
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      setError('Bitte geben Sie einen Namen ein');
      return;
    }

    const orderItems = drinks
      .filter(drink => order[drink.id] > 0)
      .map(drink => ({
        drink_id: drink.id,
        quantity: order[drink.id]
      }));

    if (orderItems.length === 0) {
      setError('Bitte wählen Sie mindestens ein Getränk aus');
      return;
    }

    try {
      await axios.post(`${API_URL}/orders`, {
        customer_name: customerName,
        items: orderItems
      });
      setCustomerName('');
      setOrder({});
      setError(null);
      alert('Bestellung erfolgreich aufgegeben!');
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('Fehler beim Absenden der Bestellung. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2>Kasse</h2>
          {settings.show_order_count && (
            <div className="mt-2">
              <Badge bg="warning" className="me-2" style={{ fontSize: '1.1em', padding: '8px 12px' }}>
                {openOrders.length} offene Bestellung(en)
              </Badge>
            </div>
          )}
        </div>
        {settings.show_last_order && lastOrder && (
          <div className="bg-info text-white p-3 rounded">
            <h5>Letzte Bestellung: {lastOrder.customer_name}</h5>
            <ul className="list-unstyled mb-0">
              {lastOrder.items.map((item) => {
                const drink = drinks.find(d => d.id === item.drink_id);
                return (
                  <li key={item.drink_id}>
                    {item.quantity}x {drink ? drink.name : 'Unbekanntes Getränk'}
                  </li>
                );
              })}
            </ul>
            <div className="mt-2">
              <strong>Total: {lastOrder.items.reduce((sum, item) => {
                const drink = drinks.find(d => d.id === item.drink_id);
                return sum + (drink ? drink.price * item.quantity : 0);
              }, 0).toFixed(2)} M$</strong>
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      <Form.Group className="mb-4">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Name eingeben"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </Form.Group>

      <div className="drinks-container">
        {drinks.map((drink) => (
          <Card key={drink.id} className="mb-3">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{drink.name}</h5>
                <p className="text-muted mb-1">{drink.description}</p>
                <small>{drink.price.toFixed(2)} M$</small>
              </div>
              <div className="d-flex align-items-center">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => handleDecrement(drink.id)}
                >
                  -
                </Button>
                <span className="mx-3">{order[drink.id] || 0}</span>
                <Button 
                  variant="outline-primary" 
                  onClick={() => handleIncrement(drink.id)}
                >
                  +
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      <div className="total-section mt-4 p-3 bg-light">
        <h3>Total: {calculateTotal().toFixed(2)} M$</h3>
        <Button 
          variant="primary" 
          size="lg" 
          className="mt-3 w-100"
          onClick={handleSubmitOrder}
        >
          Bestellung absenden
        </Button>
      </div>

      {settings.show_order_list && (
        <div className="open-orders-section mt-4">
          <h3>Offene Bestellungen:</h3>
          <div className="mb-4">
            <h5>Getränke Übersicht:</h5>
            <ul className="list-unstyled">
              {drinks.map(drink => {
                const totalQuantity = openOrders.reduce((sum, order) => {
                  const orderItem = order.items.find(item => item.drink_id === drink.id);
                  return sum + (orderItem ? orderItem.quantity : 0);
                }, 0);
                
                if (totalQuantity > 0) {
                  return (
                    <li key={drink.id} className="mb-2">
                      <strong>{drink.name}:</strong> {totalQuantity}x ({(totalQuantity * drink.price).toFixed(2)})
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </div>
          
          <h5>Details:</h5>
          <ul className="list-unstyled">
            {openOrders.map((order) => {
              const total = order.items.reduce((sum, item) => {
                const drink = drinks.find(d => d.id === item.drink_id);
                return sum + (drink ? drink.price * item.quantity : 0);
              }, 0);
              
              return (
                <li key={order.id} className="mb-3 p-3 border rounded">
                  <h6>{order.customer_name}</h6>
                  <ul className="list-unstyled mb-2">
                    {order.items.map((item) => {
                      const drink = drinks.find(d => d.id === item.drink_id);
                      return (
                        <li key={item.drink_id} className="ms-3">
                          {item.quantity} x {drink ? drink.name : 'Unbekanntes Getränk'}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="text-end">
                    <strong>Total: {total.toFixed(2)}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default KasseView;
