import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Label } from './components/ui/label';
import { ScrollArea } from './components/ui/scroll-area';
import { 
  Users, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Plus,
  Crown,
  Eye,
  Timer,
  UserCog,
  Settings
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_fantasy-league-12/artifacts/wmc167y3_image.png';

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
    <nav className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-4 shadow-2xl border-b-2 border-gold-400">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img src={LOGO_URL} alt="Kings Evolution League" className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-bold text-gold-400">Kings Evolution League</h1>
            <p className="text-sm text-gray-300">Fantasy Football Management</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user.role === 'PRESIDENT' && <Crown className="h-5 w-5 text-gold-400" />}
              <Avatar className="border-2 border-gold-400">
                <AvatarFallback className="bg-gold-400 text-navy-900">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-right">
              <div className="font-medium text-gold-400">{user.team_name}</div>
              <div className="text-sm text-gray-300">{user.username}</div>
            </div>
            <Badge variant="outline" className="border-gold-400 text-gold-400 bg-navy-800">
              €{user.budget}
            </Badge>
            <Button 
              variant="outline" 
              onClick={logout} 
              className="text-white border-gold-400 hover:bg-gold-400 hover:text-navy-900 transition-all"
            >
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
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-gold-400 bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 mb-4">
            <img src={LOGO_URL} alt="Kings Evolution League" className="w-full h-full" />
          </div>
          <CardTitle className="text-2xl font-bold text-navy-900">
            {isLogin ? 'Accedi' : 'Registrati'}
          </CardTitle>
          <CardDescription className="text-navy-600">
            {isLogin ? 'Benvenuto in Kings Evolution League' : 'Unisciti alla lega più esclusiva'}
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
                className="border-gold-200 focus:border-gold-400"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="border-gold-200 focus:border-gold-400"
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="border-gold-200 focus:border-gold-400"
            />
            {!isLogin && (
              <Input
                placeholder="Nome del team"
                value={formData.team_name}
                onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                required
                className="border-gold-200 focus:border-gold-400"
              />
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-bold"
              disabled={loading}
            >
              {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-navy-600 hover:text-gold-600"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AddPlayerModal = ({ onPlayerAdded }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    team: '',
    base_price: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/players`, {
        ...formData,
        base_price: parseFloat(formData.base_price)
      });
      onPlayerAdded();
      setOpen(false);
      setFormData({ name: '', position: '', team: '', base_price: '' });
      alert('Giocatore aggiunto con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nell\'aggiunta del giocatore');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Giocatore
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-gold-400">
        <DialogHeader>
          <DialogTitle className="text-navy-900">Aggiungi Nuovo Giocatore</DialogTitle>
          <DialogDescription>Inserisci i dettagli del giocatore</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome Giocatore</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label>Posizione</Label>
            <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona posizione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GK">Portiere (GK)</SelectItem>
                <SelectItem value="DEF">Difensore (DEF)</SelectItem>
                <SelectItem value="MID">Centrocampista (MID)</SelectItem>
                <SelectItem value="ATT">Attaccante (ATT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Squadra</Label>
            <Input
              value={formData.team}
              onChange={(e) => setFormData({...formData, team: e.target.value})}
              required
            />
          </div>
          <div>
            <Label>Prezzo Base (€)</Label>
            <Input
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({...formData, base_price: e.target.value})}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900">
            Aggiungi Giocatore
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CreateAuctionModal = ({ players, onAuctionCreated }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    player_id: '',
    starting_bid: '',
    duration_minutes: '5'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/auctions`, {
        ...formData,
        starting_bid: parseFloat(formData.starting_bid),
        duration_minutes: parseInt(formData.duration_minutes)
      });
      onAuctionCreated();
      setOpen(false);
      setFormData({ player_id: '', starting_bid: '', duration_minutes: '5' });
      alert('Asta creata con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nella creazione dell\'asta');
    }
  };

  const availablePlayers = players.filter(p => !p.current_owner);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy-600 hover:bg-navy-700 text-white">
          <Timer className="h-4 w-4 mr-2" />
          Crea Asta
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-gold-400">
        <DialogHeader>
          <DialogTitle className="text-navy-900">Crea Nuova Asta</DialogTitle>
          <DialogDescription>Seleziona giocatore e parametri dell'asta</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Giocatore</Label>
            <Select value={formData.player_id} onValueChange={(value) => setFormData({...formData, player_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona giocatore" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} - {player.team} (€{player.base_price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Offerta Iniziale (€)</Label>
            <Input
              type="number"
              value={formData.starting_bid}
              onChange={(e) => setFormData({...formData, starting_bid: e.target.value})}
              required
            />
          </div>
          <div>
            <Label>Durata (minuti)</Label>
            <Select value={formData.duration_minutes} onValueChange={(value) => setFormData({...formData, duration_minutes: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 minuti</SelectItem>
                <SelectItem value="5">5 minuti</SelectItem>
                <SelectItem value="10">10 minuti</SelectItem>
                <SelectItem value="15">15 minuti</SelectItem>
                <SelectItem value="30">30 minuti</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900">
            Crea Asta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BudgetManagementModal = ({ onBudgetUpdated }) => {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    if (open) {
      fetchManagers();
    }
  }, [open]);

  const fetchManagers = async () => {
    try {
      const response = await axios.get(`${API}/all-managers`);
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/manager-budget`, {
        manager_id: selectedManager,
        new_budget: parseFloat(newBudget)
      });
      onBudgetUpdated();
      setOpen(false);
      setSelectedManager('');
      setNewBudget('');
      alert('Budget aggiornato con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nell\'aggiornamento del budget');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Settings className="h-4 w-4 mr-2" />
          Gestisci Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-gold-400">
        <DialogHeader>
          <DialogTitle className="text-navy-900">Gestione Budget Manager</DialogTitle>
          <DialogDescription>Modifica il budget di un manager (Solo Presidente)</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Manager</Label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.username} - {manager.team_name} (€{manager.budget})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nuovo Budget (€)</Label>
            <Input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900">
            Aggiorna Budget
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AuctionHistoryModal = ({ auctionId, playerName }) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (open && auctionId) {
      fetchHistory();
    }
  }, [open, auctionId]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/auctions/${auctionId}/history`);
      setHistory(response.data.reverse()); // Most recent first
    } catch (error) {
      console.error('Error fetching auction history:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-gold-400 text-gold-700 hover:bg-gold-50">
          <Eye className="h-4 w-4 mr-1" />
          Cronologia
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-gold-400 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy-900">Cronologia Offerte - {playerName}</DialogTitle>
          <DialogDescription>Tutte le offerte per questo giocatore</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 w-full">
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((bid, index) => (
                <div key={bid.id} className={`p-3 rounded-lg border ${index === 0 ? 'border-gold-400 bg-gold-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-navy-900">{bid.bidder_username}</span>
                    <span className="font-bold text-gold-600">€{bid.amount}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(bid.timestamp).toLocaleString('it-IT')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nessuna offerta ancora</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const Dashboard = () => {
  const [players, setPlayers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [mySquad, setMySquad] = useState([]);
  const [allSquads, setAllSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, auctionsRes, squadRes, allSquadsRes] = await Promise.all([
        axios.get(`${API}/players`),
        axios.get(`${API}/auctions`),
        axios.get(`${API}/my-squad`),
        axios.get(`${API}/all-squads`)
      ]);
      
      setPlayers(playersRes.data);
      setAuctions(auctionsRes.data);
      setMySquad(squadRes.data);
      setAllSquads(allSquadsRes.data);
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
      case 'GK': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DEF': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MID': return 'bg-green-100 text-green-800 border-green-300';
      case 'ATT': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Scaduta';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex justify-center items-center">
        <div className="text-lg text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-gold-500 bg-white/95 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-2xl font-bold text-gold-600">€{user?.budget}</p>
                </div>
                <DollarSign className="h-8 w-8 text-gold-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur">
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
          
          <Card className="border-l-4 border-l-purple-500 bg-white/95 backdrop-blur">
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
          
          <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur">
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
          <TabsList className="grid w-full grid-cols-5 bg-white/90 border-2 border-gold-400">
            <TabsTrigger value="auctions" className="data-[state=active]:bg-gold-400 data-[state=active]:text-navy-900">Aste</TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-gold-400 data-[state=active]:text-navy-900">Giocatori</TabsTrigger>
            <TabsTrigger value="squad" className="data-[state=active]:bg-gold-400 data-[state=active]:text-navy-900">La Mia Rosa</TabsTrigger>
            <TabsTrigger value="all-squads" className="data-[state=active]:bg-gold-400 data-[state=active]:text-navy-900">Tutte le Rose</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-gold-400 data-[state=active]:text-navy-900">Statistiche</TabsTrigger>
          </TabsList>

          <TabsContent value="auctions" className="space-y-4">
            <Card className="bg-white/95 backdrop-blur border-2 border-gold-400">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-navy-900">Aste Attive</CardTitle>
                    <CardDescription>Partecipa alle aste per acquistare giocatori</CardDescription>
                  </div>
                  <CreateAuctionModal players={players} onAuctionCreated={fetchData} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {auctions.filter(auction => auction.status === 'ACTIVE').map(auction => {
                    const player = players.find(p => p.id === auction.player_id);
                    return (
                      <div key={auction.id} className="flex items-center justify-between p-4 border-2 border-gold-200 rounded-lg bg-gradient-to-r from-white to-gold-50 shadow-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{getPositionIcon(player?.position)}</div>
                          <div>
                            <h3 className="font-bold text-navy-900">{player?.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPositionColor(player?.position)}>{player?.position}</Badge>
                              <span className="text-sm text-gray-600">{player?.team}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">Scade in: {getTimeRemaining(auction.end_time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="font-bold text-gold-600 text-lg">€{auction.current_bid}</p>
                            <p className="text-xs text-gray-500">
                              {auction.current_bidder_username ? `di ${auction.current_bidder_username}` : 'Nessuna offerta'}
                            </p>
                          </div>
                          <AuctionHistoryModal auctionId={auction.id} playerName={player?.name} />
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Offerta"
                              className="w-24 border-gold-300"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                            />
                            <Button 
                              onClick={() => placeBid(auction.id, bidAmount)}
                              disabled={!bidAmount || parseFloat(bidAmount) <= auction.current_bid}
                              size="sm"
                              className="bg-gold-500 hover:bg-gold-600 text-navy-900"
                            >
                              Offri
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {auctions.filter(auction => auction.status === 'ACTIVE').length === 0 && (
                    <div className="text-center py-12">
                      <Timer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Nessuna asta attiva al momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <Card className="bg-white/95 backdrop-blur border-2 border-gold-400">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-navy-900">Mercato Giocatori</CardTitle>
                    <CardDescription>Tutti i giocatori disponibili</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={seedPlayers} variant="outline" className="border-gold-400">
                      Carica Giocatori
                    </Button>
                    <AddPlayerModal onPlayerAdded={fetchData} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.filter(player => !player.current_owner).map(player => (
                    <Card key={player.id} className="hover:shadow-xl transition-all border-2 border-gold-200 hover:border-gold-400">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-3xl">{getPositionIcon(player.position)}</div>
                          <Badge className={getPositionColor(player.position)}>{player.position}</Badge>
                        </div>
                        <h3 className="font-bold mb-1 text-navy-900">{player.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{player.team}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gold-600 text-lg">€{player.base_price}</span>
                        </div>
                        {player.goals > 0 || player.assists > 0 ? (
                          <div className="mt-2 flex space-x-2 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border">⚽ {player.goals}</span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded border">🅰️ {player.assists}</span>
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
            <Card className="bg-white/95 backdrop-blur border-2 border-gold-400">
              <CardHeader>
                <CardTitle className="text-navy-900">La Mia Rosa</CardTitle>
                <CardDescription>I tuoi giocatori acquistati</CardDescription>
              </CardHeader>
              <CardContent>
                {mySquad.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Non hai ancora nessun giocatore</p>
                    <p className="text-gray-400">Partecipa alle aste per costruire la tua rosa!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySquad.map(player => (
                      <Card key={player.id} className="border-2 border-gold-300 bg-gradient-to-br from-gold-50 to-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">{getPositionIcon(player.position)}</div>
                            <Badge className={getPositionColor(player.position)}>{player.position}</Badge>
                          </div>
                          <h3 className="font-bold mb-1 text-navy-900">{player.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{player.team}</p>
                          {player.goals > 0 || player.assists > 0 ? (
                            <div className="flex space-x-2 text-xs">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border">⚽ {player.goals}</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded border">🅰️ {player.assists}</span>
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

          <TabsContent value="all-squads" className="space-y-4">
            <Card className="bg-white/95 backdrop-blur border-2 border-gold-400">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-navy-900">Tutte le Rose</CardTitle>
                    <CardDescription>Rose di tutti i manager della lega</CardDescription>
                  </div>
                  {user?.role === 'PRESIDENT' && (
                    <BudgetManagementModal onBudgetUpdated={fetchData} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {allSquads.map(squad => (
                    <Card key={squad.manager.id} className="border-2 border-gold-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {squad.manager.role === 'PRESIDENT' && <Crown className="h-5 w-5 text-gold-500" />}
                            <div>
                              <h3 className="font-bold text-navy-900">{squad.manager.team_name}</h3>
                              <p className="text-sm text-gray-600">Manager: {squad.manager.username}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="border-gold-400 text-gold-700">
                              €{squad.manager.budget}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">{squad.players.length} giocatori</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {squad.players.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">Nessun giocatore nella rosa</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {squad.players.map(player => (
                              <div key={player.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                                <span className="text-sm">{getPositionIcon(player.position)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-navy-900 truncate">{player.name}</p>
                                  <p className="text-xs text-gray-500">{player.team}</p>
                                </div>
                                <Badge size="sm" className={getPositionColor(player.position)}>{player.position}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="bg-white/95 backdrop-blur border-2 border-gold-400">
              <CardHeader>
                <CardTitle className="text-navy-900">Statistiche</CardTitle>
                <CardDescription>Le tue performance e classifiche</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gold-400" />
                  <p className="text-gray-500 text-lg">Statistiche e classifiche</p>
                  <p className="text-gray-400">saranno disponibili quando inizieranno le competizioni</p>
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