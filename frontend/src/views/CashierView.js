import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Grid,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from 'axios';
import { API_URL } from '../config';

function CashierView() {
  const [drinks, setDrinks] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedDrinks, setSelectedDrinks] = useState({});
  const [orderStatus, setOrderStatus] = useState('');
  const [openOrders, setOpenOrders] = useState([]);

  useEffect(() => {
    fetchDrinks();
    fetchOpenOrders();
    // Aktualisiere die offenen Bestellungen alle 10 Sekunden
    const interval = setInterval(fetchOpenOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOpenOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      const orders = response.data.filter(order => order.status === 'offen');
      setOpenOrders(orders);
    } catch (error) {
      console.error('Fehler beim Laden der offenen Bestellungen:', error);
    }
  };

  const fetchDrinks = async () => {
    try {
      const response = await axios.get(`${API_URL}/drinks`);
      setDrinks(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Getränke:', error);
    }
  };

  const handleQuantityChange = (drinkId, change) => {
    setSelectedDrinks(prev => {
      const currentQuantity = prev[drinkId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        const { [drinkId]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [drinkId]: newQuantity
      };
    });
  };

  const calculateTotal = () => {
    return drinks.reduce((total, drink) => {
      const quantity = selectedDrinks[drink.id] || 0;
      return total + (drink.price * quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName) {
      setOrderStatus('Bitte geben Sie einen Namen ein');
      return;
    }

    if (Object.keys(selectedDrinks).length === 0) {
      setOrderStatus('Bitte wählen Sie mindestens ein Getränk aus');
      return;
    }

    const orderItems = Object.entries(selectedDrinks).map(([drinkId, quantity]) => ({
      drink_id: parseInt(drinkId),
      quantity
    }));

    try {
      await axios.post(`${API_URL}/orders`, {
        customer_name: customerName,
        items: orderItems
      });
      setOrderStatus('Bestellung erfolgreich aufgegeben!');
      setCustomerName('');
      setSelectedDrinks({});
      
      // Nach 3 Sekunden die Meldung ausblenden
      setTimeout(() => {
        setOrderStatus('');
      }, 3000);
    } catch (error) {
      console.error('Fehler beim Erstellen der Bestellung:', error);
      setOrderStatus('Fehler beim Erstellen der Bestellung');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Getränkebestellung
      </Typography>

      {openOrders.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff3e0' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {openOrders.length} {openOrders.length === 1 ? 'offene Bestellung' : 'offene Bestellungen'}
          </Typography>
          {openOrders.length > 0 && (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Letzte offene Bestellung: #{openOrders[openOrders.length - 1].id} - {openOrders[openOrders.length - 1].customer_name}
              <br />
              {openOrders[openOrders.length - 1].items.map(item => {
                const drink = drinks.find(d => d.id === item.drink_id);
                return `${item.quantity}x ${drink ? drink.name : 'Getränk'}`; 
              }).join(', ')}
            </Typography>
          )}
        </Paper>
      )}

      {orderStatus && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: orderStatus.includes('Fehler') ? 'error' : 'success',
            mb: 2,
            textAlign: 'left',
            fontWeight: 'bold'
          }}
        >
          {orderStatus}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          margin="normal"
          required
        />

        <Paper sx={{ mt: 2, p: 2 }}>
          <List>
            {drinks.map((drink) => (
              <ListItem key={drink.id}>
                <ListItemText
                  primary={drink.name}
                  secondary={`${drink.price.toFixed(2)} M$ - ${drink.description}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleQuantityChange(drink.id, -1)}
                    disabled={!selectedDrinks[drink.id]}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography component="span" sx={{ mx: 2 }}>
                    {selectedDrinks[drink.id] || 0}
                  </Typography>
                  <IconButton
                    edge="end"
                    onClick={() => handleQuantityChange(drink.id, 1)}
                  >
                    <AddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Typography variant="h6" align="right">
              Gesamtbetrag: {calculateTotal().toFixed(2)} M$
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={!customerName || Object.keys(selectedDrinks).length === 0}
            >
              Bestellen
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}

export default CashierView;
