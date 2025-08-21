import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Users, Trophy, Target, TrendingUp, Clock, DollarSign } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = (tokenData, userData) => {
    localStorage.setItem('token', tokenData);
    setToken(tokenData);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Components
const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-green-800 to-green-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <h1 className="text-2xl font-bold">Fantasy Manager</h1>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.team_name}</span>
            <Badge variant="secondary">€{user.budget}</Badge>
            <Button variant="outline" onClick={logout} className="text-white border-white hover:bg-white hover:text-green-900">
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    team_name: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await axios.post(`${API}${endpoint}`, data);
      login(response.data.access_token, response.data.manager);
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-900">
            {isLogin ? 'Accedi' : 'Registrati'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Accedi al tuo account manager' : 'Crea il tuo team fantasy'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Nome utente"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            {!isLogin && (
              <Input
                placeholder="Nome del team"
                value={formData.team_name}
                onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                required
              />
            )}
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-600"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const [players, setPlayers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [mySquad, setMySquad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, auctionsRes, squadRes] = await Promise.all([
        axios.get(`${API}/players`),
        axios.get(`${API}/auctions`),
        axios.get(`${API}/my-squad`)
      ]);
      
      setPlayers(playersRes.data);
      setAuctions(auctionsRes.data);
      setMySquad(squadRes.data);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedPlayers = async () => {
    try {
      await axios.post(`${API}/seed-players`);
      fetchData();
      alert('Giocatori caricati con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nel caricamento giocatori');
    }
  };

  const createAuction = async (playerId) => {
    try {
      await axios.post(`${API}/auctions`, {
        player_id: playerId,
        starting_bid: 5.0,
        duration_minutes: 5
      });
      fetchData();
      alert('Asta creata con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nella creazione asta');
    }
  };

  const placeBid = async (auctionId, amount) => {
    try {
      await axios.post(`${API}/auctions/${auctionId}/bid`, {
        auction_id: auctionId,
        bidder_id: user.id,
        amount: parseFloat(amount)
      });
      fetchData();
      setBidAmount('');
      alert('Offerta inviata con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nell\'invio offerta');
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'GK': return 'bg-yellow-100 text-yellow-800';
      case 'DEF': return 'bg-blue-100 text-blue-800';
      case 'MID': return 'bg-green-100 text-green-800';
      case 'ATT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 'GK': return '🥅';
      case 'DEF': return '🛡️';
      case 'MID': return '⚽';
      case 'ATT': return '🎯';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-2xl font-bold text-green-600">€{user?.budget}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">La Mia Rosa</p>
                  <p className="text-2xl font-bold text-blue-600">{mySquad.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aste Attive</p>
                  <p className="text-2xl font-bold text-purple-600">{auctions.filter(a => a.status === 'ACTIVE').length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Giocatori Totali</p>
                  <p className="text-2xl font-bold text-orange-600">{players.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="auctions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auctions">Aste</TabsTrigger>
            <TabsTrigger value="players">Giocatori</TabsTrigger>
            <TabsTrigger value="squad">La Mia Rosa</TabsTrigger>
            <TabsTrigger value="stats">Statistiche</TabsTrigger>
          </TabsList>

          <TabsContent value="auctions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aste Attive</CardTitle>
                <CardDescription>Partecipa alle aste per acquistare giocatori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {auctions.filter(auction => auction.status === 'ACTIVE').map(auction => {
                    const player = players.find(p => p.id === auction.player_id);
                    return (
                      <div key={auction.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{getPositionIcon(player?.position)}</div>
                          <div>
                            <h3 className="font-semibold">{player?.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPositionColor(player?.position)}>{player?.position}</Badge>
                              <span className="text-sm text-gray-600">{player?.team}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-green-600">€{auction.current_bid}</p>
                            <p className="text-xs text-gray-500">Offerta attuale</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Offerta"
                              className="w-24"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                            />
                            <Button 
                              onClick={() => placeBid(auction.id, bidAmount)}
                              disabled={!bidAmount || parseFloat(bidAmount) <= auction.current_bid}
                              size="sm"
                            >
                              Offri
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {auctions.filter(auction => auction.status === 'ACTIVE').length === 0 && (
                    <p className="text-center text-gray-500 py-8">Nessuna asta attiva al momento</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mercato Giocatori</CardTitle>
                    <CardDescription>Tutti i giocatori disponibili</CardDescription>
                  </div>
                  <Button onClick={seedPlayers}>Carica Giocatori</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.filter(player => !player.current_owner).map(player => (
                    <Card key={player.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-2xl">{getPositionIcon(player.position)}</div>
                          <Badge className={getPositionColor(player.position)}>{player.position}</Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{player.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{player.team}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600">€{player.base_price}</span>
                          <Button 
                            size="sm" 
                            onClick={() => createAuction(player.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Crea Asta
                          </Button>
                        </div>
                        {player.goals > 0 || player.assists > 0 ? (
                          <div className="mt-2 flex space-x-2 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">⚽ {player.goals}</span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">🅰️ {player.assists}</span>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="squad" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>La Mia Rosa</CardTitle>
                <CardDescription>I tuoi giocatori acquistati</CardDescription>
              </CardHeader>
              <CardContent>
                {mySquad.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Non hai ancora nessun giocatore. Partecipa alle aste per costruire la tua rosa!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySquad.map(player => (
                      <Card key={player.id} className="border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-2xl">{getPositionIcon(player.position)}</div>
                            <Badge className={getPositionColor(player.position)}>{player.position}</Badge>
                          </div>
                          <h3 className="font-semibold mb-1">{player.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{player.team}</p>
                          {player.goals > 0 || player.assists > 0 ? (
                            <div className="flex space-x-2 text-xs">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">⚽ {player.goals}</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">🅰️ {player.assists}</span>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiche</CardTitle>
                <CardDescription>Le tue performance e classifiche</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Statistiche e classifiche saranno disponibili quando inizieranno le competizioni</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <LoginForm />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;