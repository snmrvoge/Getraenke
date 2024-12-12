import './ZubereitungView.css';
import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../config';

function ZubereitungView() {
  const [orders, setOrders] = useState([]);
  const [drinks, setDrinks] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDrinks();
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Aktualisiere alle 5 Sekunden
    return () => clearInterval(interval);
  }, []);

  const fetchDrinks = async () => {
    try {
      const response = await axios.get(`${API_URL}/drinks`);
      const drinksMap = {};
      response.data.forEach(drink => {
        drinksMap[drink.id] = drink;
      });
      setDrinks(drinksMap);
    } catch (error) {
      console.error('Error fetching drinks:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      const sortedOrders = response.data.sort((a, b) => {
        if (a.status === b.status) {
          return b.id - a.id;
        }
        return a.status === 'offen' ? -1 : 1;
      });
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const markAsCompleted = async (orderId, e) => {
    e.stopPropagation(); // Verhindert, dass der Modal-Dialog geöffnet wird
    try {
      await axios.put(`${API_URL}/orders/${orderId}/complete`);
      fetchOrders();
    } catch (error) {
      console.error('Error marking order as completed:', error);
    }
  };

  const getDrinkName = (drinkId) => {
    return drinks[drinkId]?.name || `Getränk ${drinkId}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'offen':
        return <Badge bg="warning">Offen</Badge>;
      case 'in_zubereitung':
        return <Badge bg="info">Fertig</Badge>;
      case 'fertig':
        return <Badge bg="success">Ausgeliefert</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <div className="container mt-4">
      <h2>Zubereitung</h2>
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th className="col-bestellnr">Bestellnummer</th>
            <th className="col-kunde">Kunde</th>
            <th className="col-getraenke">Getränke</th>
            <th className="col-status">Status</th>
            <th className="col-aktionen">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr 
              key={order.id} 
              className={order.status === 'offen' ? 'table-warning' : order.status === 'fertig' ? 'table-success' : ''}
              onClick={() => handleOrderClick(order)}
              style={{ cursor: 'pointer' }}
            >
              <td data-label="Bestellnummer">{order.id}</td>
              <td data-label="Kunde">{order.customer_name}</td>
              <td data-label="Getränke">
                {order.items.map((item, index) => (
                  <div key={index}>
                    {getDrinkName(item.drink_id)} ({item.quantity}x)
                  </div>
                ))}
              </td>
              <td data-label="Status">
                {getStatusBadge(order.status)}
              </td>
              <td data-label="Aktionen" onClick={(e) => e.stopPropagation()}>
                {order.status === 'offen' && (
                  <Button variant="primary" size="sm" onClick={(e) => markAsCompleted(order.id, e)}>
                    Als fertig markieren
                  </Button>
                )}
                {order.status === 'in_zubereitung' && (
                  <Button variant="success" size="sm" onClick={(e) => markAsCompleted(order.id, e)}>
                    Als ausgeliefert markieren
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Bestellung #{selectedOrder?.id} - {selectedOrder?.customer_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Status: {selectedOrder && getStatusBadge(selectedOrder.status)}</h5>
          <h5 className="mt-4">Bestellte Getränke:</h5>
          <div className="table-responsive">
            <ListGroup>
              {selectedOrder?.items.map((item, index) => (
                <ListGroup.Item 
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h6 className="mb-0">{getDrinkName(item.drink_id)}</h6>
                    <small className="text-muted">
                      Einzelpreis: {drinks[item.drink_id]?.price.toFixed(2)} M$
                    </small>
                  </div>
                  <div className="text-end">
                    <h5 className="mb-0">
                      <Badge bg="primary" pill>
                        {item.quantity}x
                      </Badge>
                    </h5>
                    <small className="text-muted">
                      {(drinks[item.drink_id]?.price * item.quantity).toFixed(2)} M$
                    </small>
                  </div>
                </ListGroup.Item>
              ))}
              <ListGroup.Item className="d-flex justify-content-between align-items-center bg-light">
                <h6 className="mb-0">Gesamtbetrag</h6>
                <h5 className="mb-0">{selectedOrder?.total_price.toFixed(2)} M$</h5>
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {selectedOrder?.status === 'offen' && (
            <Button variant="primary" onClick={(e) => markAsCompleted(selectedOrder.id, e)}>
              Als fertig markieren
            </Button>
          )}
          {selectedOrder?.status === 'in_zubereitung' && (
            <Button variant="success" onClick={(e) => markAsCompleted(selectedOrder.id, e)}>
              Als ausgeliefert markieren
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Schließen
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ZubereitungView;
