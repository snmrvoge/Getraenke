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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { API_URL } from '../config';

function AdminView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [drinks, setDrinks] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [newDrink, setNewDrink] = useState({ name: '', price: '', description: '' });
  const [editingDrink, setEditingDrink] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDrinks, setTotalDrinks] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [openOrders, setOpenOrders] = useState(0);
  const [settings, setSettings] = useState({
    show_order_count: true,
    show_last_order: true,
    show_order_list: true
  });
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting login with password:', password);  
      console.log('API URL:', `${API_URL}/verify-admin`);  
      const response = await axios.post(`${API_URL}/verify-admin`, { password }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Login response:', response.data);  
      if (response.data.valid) {
        setIsAuthenticated(true);
        setShowError(false);
        fetchDrinks();
        fetchStatistics();
        fetchSettings();
      } else {
        setShowError(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setShowError(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDrinks();
      fetchStatistics();
    }
  }, [isAuthenticated]);

  const fetchDrinks = async () => {
    try {
      const response = await axios.get(`${API_URL}/drinks`);
      setDrinks(response.data);
    } catch (error) {
      console.error('Error fetching drinks:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/statistics`);
      const { drinks, total_orders, open_orders } = response.data;
      setStatistics(drinks);
      setTotalOrders(total_orders);
      setOpenOrders(open_orders);
      const totalRev = drinks.reduce((sum, stat) => sum + stat.total_revenue, 0);
      const totalDrk = drinks.reduce((sum, stat) => sum + stat.total_quantity, 0);
      setTotalRevenue(totalRev);
      setTotalDrinks(totalDrk);
    } catch (error) {
      console.error('Error fetching statistics:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDrink) {
        await axios.put(`${API_URL}/drinks/${editingDrink.id}`, {
          ...newDrink,
          price: parseFloat(newDrink.price)
        });
      } else {
        await axios.post(`${API_URL}/drinks`, {
          ...newDrink,
          price: parseFloat(newDrink.price)
        });
      }
      setNewDrink({ name: '', price: '', description: '' });
      setEditingDrink(null);
      fetchDrinks();
      fetchStatistics();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleEdit = (drink) => {
    setEditingDrink(drink);
    setNewDrink({
      name: drink.name,
      price: drink.price.toString(),
      description: drink.description
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/drinks/${id}`);
      fetchDrinks();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleCancel = () => {
    setEditingDrink(null);
    setNewDrink({ name: '', price: '', description: '' });
  };

  const handleResetStatistics = async () => {
    try {
      await axios.post(`${API_URL}/statistics/reset`);
      fetchStatistics();
      setResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting statistics:', error);
    }
  };

  const handleSettingChange = async (setting) => {
    const newSettings = { ...settings, [setting]: !settings[setting] };
    try {
      await axios.post(`${API_URL}/settings`, newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <h2>Verwaltung - Login</h2>
        <form onSubmit={handleLogin}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={showError}
              />
              {showError && (
                <Typography color="error">Falsches Passwort</Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" type="submit">
                Anmelden
              </Button>
            </Grid>
          </Grid>
        </form>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {showSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Erfolgreich gespeichert!
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        Getränkeverwaltung
      </Typography>

      <Grid container spacing={3}>
        {/* Statistik-Karten */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Gesamtumsatz
                </Typography>
                <Typography variant="h4">
                  {totalRevenue.toFixed(2)} M$
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Getränke verkauft
                </Typography>
                <Typography variant="h4">
                  {totalDrinks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Bestellungen gesamt
                </Typography>
                <Typography variant="h4">
                  {totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Offene Bestellungen
                </Typography>
                <Typography variant="h4">
                  {openOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detaillierte Statistiken */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Statistiken
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setResetDialogOpen(true)}
              >
                Zurücksetzen
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">
                Bestellungen Gesamt: {totalOrders}
              </Typography>
              <Typography variant="h6">
                Offene Bestellungen: {openOrders} 
                {totalOrders > 0 && ` (${((openOrders / totalOrders) * 100).toFixed(1)}%)`}
              </Typography>
            </Box>

            <div className="table-responsive">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Anzahl verkauft</TableCell>
                    <TableCell align="right">Umsatz (M$)</TableCell>
                    <TableCell align="right">Prozent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistics.map((stat) => {
                    const percentage = ((stat.total_quantity / totalDrinks) * 100).toFixed(1);
                    return (
                      <TableRow key={stat.drink_id}>
                        <TableCell component="th" scope="row">
                          {stat.name}
                        </TableCell>
                        <TableCell align="right">{stat.total_quantity}</TableCell>
                        <TableCell align="right">
                          {stat.total_revenue.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {totalDrinks > 0 && `${percentage}%`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </Grid>

        {/* Getränke-Verwaltung */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Getränke verwalten
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={newDrink.name}
                    onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Preis (M$)"
                    type="number"
                    step="0.01"
                    value={newDrink.price}
                    onChange={(e) => setNewDrink({ ...newDrink, price: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Beschreibung"
                    value={newDrink.description}
                    onChange={(e) => setNewDrink({ ...newDrink, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" type="submit">
                    {editingDrink ? 'Aktualisieren' : 'Hinzufügen'}
                  </Button>
                  {editingDrink && (
                    <Button sx={{ ml: 1 }} onClick={handleCancel}>
                      Abbrechen
                    </Button>
                  )}
                </Grid>
              </Grid>
            </form>

            <List sx={{ mt: 2 }}>
              {drinks.map((drink) => (
                <ListItem key={drink.id}>
                  <ListItemText
                    primary={drink.name}
                    secondary={`${drink.price.toFixed(2)} M$ - ${drink.description}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(drink)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(drink.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Kassenansicht Einstellungen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Kassenansicht Einstellungen
            </Typography>
            <form>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show-order-count"
                      checked={settings.show_order_count}
                      onChange={() => handleSettingChange('show_order_count')}
                    />
                    <label className="form-check-label" htmlFor="show-order-count">
                      Anzahl offener Bestellungen anzeigen
                    </label>
                  </div>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show-last-order"
                      checked={settings.show_last_order}
                      onChange={() => handleSettingChange('show_last_order')}
                    />
                    <label className="form-check-label" htmlFor="show-last-order">
                      Letzte Bestellung anzeigen
                    </label>
                  </div>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show-order-list"
                      checked={settings.show_order_list}
                      onChange={() => handleSettingChange('show_order_list')}
                    />
                    <label className="form-check-label" htmlFor="show-order-list">
                      Liste der offenen Bestellungen anzeigen
                    </label>
                  </div>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Reset-Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Statistiken zurücksetzen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie wirklich alle Statistiken und Bestellungen zurücksetzen? Dieser Vorgang kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleResetStatistics} color="secondary">
            Zurücksetzen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminView;
