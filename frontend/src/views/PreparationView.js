import React, { useState, useEffect } from 'react';
import { 
  Container, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function PreparationView() {
  const [orders, setOrders] = useState([]);
  const [drinks, setDrinks] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchDrinks();
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
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
      console.error('Fehler beim Laden der Getränke:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/complete`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Fehler beim Abschließen der Bestellung:', error);
    }
  };

  const formatOrderItems = (items) => {
    return items.map(item => {
      const drink = drinks[item.drink_id];
      return `${item.quantity}x ${drink ? drink.name : 'Unbekanntes Getränk'}`;
    }).join(', ');
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleClose = () => {
    setSelectedOrder(null);
  };

  const openOrders = orders.filter(order => order.status === 'offen');
  const completedOrders = orders.filter(order => order.status === 'fertig');

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Getränkezubereitung
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Offene Bestellungen
            </Typography>
            <List>
              {openOrders.map((order) => (
                <ListItem 
                  key={order.id}
                  button
                  onClick={() => handleOrderClick(order)}
                  secondaryAction={
                    <Button 
                      variant="contained" 
                      onClick={(e) => {
                        e.stopPropagation();
                        completeOrder(order.id);
                      }}
                    >
                      Fertig
                    </Button>
                  }
                >
                  <ListItemText
                    primary={`${order.customer_name} (${order.total_price.toFixed(2)} M$)`}
                    secondary={formatOrderItems(order.items)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fertige Bestellungen
            </Typography>
            <List>
              {completedOrders.map((order) => (
                <ListItem 
                  key={order.id}
                  button
                  onClick={() => handleOrderClick(order)}
                >
                  <ListItemText
                    primary={`${order.customer_name} (${order.total_price.toFixed(2)} M$)`}
                    secondary={formatOrderItems(order.items)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={selectedOrder !== null} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Grid container justifyContent="space-between" alignItems="center">
                <Grid item>
                  Bestellung von {selectedOrder.customer_name}
                </Grid>
                <Grid item>
                  <IconButton onClick={handleClose}>
                    <CloseIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </DialogTitle>
            <DialogContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Getränk</TableCell>
                      <TableCell align="right">Anzahl</TableCell>
                      <TableCell align="right">Preis</TableCell>
                      <TableCell align="right">Gesamt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item) => {
                      const drink = drinks[item.drink_id];
                      return (
                        <TableRow key={item.drink_id}>
                          <TableCell>{drink ? drink.name : 'Unbekanntes Getränk'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{drink ? `${drink.price.toFixed(2)} M$` : '-'}</TableCell>
                          <TableCell align="right">
                            {drink ? `${(drink.price * item.quantity).toFixed(2)} M$` : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><strong>Gesamtbetrag:</strong></TableCell>
                      <TableCell align="right"><strong>{selectedOrder.total_price.toFixed(2)} M$</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Status: {selectedOrder.status === 'offen' ? 'In Zubereitung' : 'Fertig'}
              </Typography>
              <Typography variant="body2">
                Bestellt am: {new Date(selectedOrder.created_at).toLocaleString()}
              </Typography>
            </DialogContent>
            <DialogActions>
              {selectedOrder.status === 'offen' && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => completeOrder(selectedOrder.id)}
                >
                  Bestellung abschließen
                </Button>
              )}
              <Button onClick={handleClose}>Schließen</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

export default PreparationView;
