// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  TextField, 
  Card, 
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Palette as PaletteIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';

// Функции для работы с localStorage
const storage = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
};

// Инициализация базы данных
const initializeDB = () => {
  const users = storage.getItem('users');
  if (!users) {
    const adminUser = {
      id: Date.now(),
      username: 'admin',
      password: 'admin123',
      ip: 'localhost',
      role: 'admin'
    };
    storage.setItem('users', [adminUser]);
    return {
      users: [adminUser],
      drawings: [],
      messages: []
    };
  }
  return {
    users: users,
    drawings: storage.getItem('drawings') || [],
    messages: storage.getItem('messages') || []
  };
};

const localDB = initializeDB();

// Компонент авторизации
const Auth = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const user = localDB.users.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        alert('Неверные данные!');
      }
    } else {
      if (localDB.users.some(u => u.username === username)) {
        alert('Пользователь уже существует!');
        return;
      }
      const newUser = {
        id: Date.now(),
        username,
        password,
        ip: 'localhost', // В реальном приложении здесь будет реальный IP
        role: 'member'
      };
      localDB.users.push(newUser);
      storage.setItem('users', localDB.users);
      onRegister(newUser);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {isLogin ? 'Вход' : 'Регистрация'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              type="password"
              label="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 2 }}
            >
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button
              fullWidth
              onClick={() => setIsLogin(!isLogin)}
              sx={{ mt: 1 }}
            >
              {isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт?'}
            </Button>
          </form>
        </Card>
      </Box>
    </Container>
  );
};

// Компонент холста для рисования
const Canvas = ({ user }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [drawings, setDrawings] = useState(localDB.drawings);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight - 100;
    
    drawings.forEach(drawing => {
      ctx.beginPath();
      ctx.moveTo(drawing.start.x, drawing.start.y);
      ctx.lineTo(drawing.end.x, drawing.end.y);
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [drawings]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    
    const drawing = {
      id: Date.now(),
      userId: user.id,
      color,
      start: { x: e.nativeEvent.offsetX - 1, y: e.nativeEvent.offsetY - 1 },
      end: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
    };
    localDB.drawings.push(drawing);
    storage.setItem('drawings', localDB.drawings);
    setDrawings([...drawings, drawing]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          sx={{ width: 100 }}
        />
      </Box>
      <Paper elevation={3}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{ border: '1px solid #ccc' }}
        />
      </Paper>
    </Box>
  );
};

// Компонент чата
const Chat = ({ user }) => {
  const [messages, setMessages] = useState(localDB.messages);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    localDB.messages.push(message);
    storage.setItem('messages', localDB.messages);
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Чат
      </Typography>
      <List sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        {messages.map(message => (
          <ListItem key={message.id}>
            <ListItemText
              primary={message.text}
              secondary={message.username}
              sx={{
                backgroundColor: message.userId === user.id ? '#e3f2fd' : '#f5f5f5',
                borderRadius: 1,
                p: 1
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box component="form" onSubmit={sendMessage} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Сообщение..."
        />
        <IconButton color="primary" type="submit">
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

// Главный компонент приложения
const App = () => {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} onRegister={handleLogin} />;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {user.username}
          </Typography>
          <Chip 
            label={user.role} 
            color={user.role === 'admin' ? 'error' : 'primary'} 
            size="small" 
            sx={{ mr: 2 }}
          />
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
          <Canvas user={user} />
        </Box>
        <Box sx={{ width: 300, borderLeft: 1, borderColor: 'divider' }}>
          <Chat user={user} />
        </Box>
      </Box>
    </Box>
  );
};

export default App;