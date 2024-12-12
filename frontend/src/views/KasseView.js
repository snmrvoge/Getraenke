import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../config';

function KasseView() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const markAsPaid = async (orderId) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/paid`);
      fetchOrders();
    } catch (error) {
      console.error('Error marking order as paid:', error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Kasse</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Bestellnummer</th>
            <th>Getränke</th>
            <th>Gesamtpreis</th>
            <th>Status</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>
                {order.items.map(item => `${item.quantity}x ${item.drink_name}`).join(', ')}
              </td>
              <td>{order.total_price.toFixed(2)} €</td>
              <td>{order.paid ? 'Bezahlt' : 'Nicht bezahlt'}</td>
              <td>
                {!order.paid && (
                  <Button variant="success" onClick={() => markAsPaid(order.id)}>
                    Als bezahlt markieren
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default KasseView;
