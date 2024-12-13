import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import AdminView from './views/AdminView';
import KasseView from './views/KasseView';
import ZubereitungView from './views/ZubereitungView';
import 'bootstrap/dist/css/bootstrap.min.css';

function NavigationBar() {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin' || location.pathname === '/';

  if (!isAdminPage) {
    return null;
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Nik's Getränke App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/admin">Verwaltung</Nav.Link>
            <Nav.Link as={Link} to="/kasse">Kasse</Nav.Link>
            <Nav.Link as={Link} to="/zubereitung">Zubereitung</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function App() {
  return (
    <Router>
      <div>
        <NavigationBar />
        <Container>
          <Routes>
            <Route path="/" element={<AdminView />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="/kasse" element={<KasseView />} />
            <Route path="/zubereitung" element={<ZubereitungView />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
