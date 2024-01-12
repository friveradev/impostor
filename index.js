const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = [];
const objects = [
    "Casa", "Montaña", "Pasto", "Árbol", "Río", "Playa", "Cielo", "Lago", "Desierto", "Cueva",
    "Cama", "Silla", "Mesa", "Lámpara", "Ventana", "Puerta", "Espejo", "Libro", "Reloj", "Teléfono",
    "Coche", "Bicicleta", "Avión", "Barco", "Tren", "Camino", "Puente", "Piedra", "Flor", "Hierba",
    "Sol", "Luna", "Estrella", "Nube", "Rayo", "Nieve", "Fuego", "Agua", "Hielo", "Viento",
    "Mapa", "Brújula", "Bolsa", "Llave", "Caja", "Botella", "Taza", "Plato", "Cuchillo", "Tenedor",
    "Papel", "Lápiz", "Pintura", "Cepillo", "Cámara", "Computadora", "Teclado", "Mouse", "Pantalla", "Altavoz",
    "Guitarra", "Piano", "Tambor", "Micrófono", "Pelota", "Juguete", "Dinero", "Reloj de arena", "Balanza", "Escalera",
    "Sombrero", "Zapatos", "Camisa", "Pantalón", "Vestido", "Guantes", "Bufanda", "Bolso", "Gafas", "Paraguas",
    "Manzana", "Naranja", "Plátano", "Fresa", "Pan", "Queso", "Leche", "Huevo", "Café", "Agua",
    "Vino", "Pizza", "Helado", "Caramelo", "Chocolate", "Cereal", "Sopa", "Ensalada", "Pescado", "Pollo",
    "Lápiz", "Taza", "Reloj", "Caja", "Llave", "Cuchillo", "Silla", "Flor", "Nube", "Botella",
    "Libro", "Sombrero", "Cama", "Bolso", "Camino", "Piedra", "Lago", "Cielo", "Perro", "Pelota",
    "Vaso", "Papel", "Plato", "Vela", "Mesa", "Sol", "Puerta", "Río", "Caja de música", "Estrella",
    "Casa", "Pintura", "Guitarra", "Ventana", "Bicicleta", "Reloj de arena", "Mapa", "Zapatos", "Ojo de cerradura", "Galleta",
    "Globo", "Martillo", "Abeja", "Pescado", "Tren", "Gato", "Tijeras", "Nube de lluvia", "Oreja", "Silla de ruedas",
    "Gafas", "Globo terráqueo", "Huevo", "Jirafa", "Diente de león", "Hamburguesa", "Iglú", "Joya", "Buceo", "Pirámide",
    "Robot", "Taza de té", "Barco de papel", "Fogata", "Globo de aire caliente", "Patineta", "Serpiente", "Plátano", "Caja de herramientas", "Maleta",
    "Cohete", "Flecha", "Auriculares", "Borla", "Hula-hoop", "Flecha", "Cinta adhesiva", "Cruz", "Ampolla", "Estampilla",
    "Isla", "Tobogán", "Llave inglesa", "Cruz", "Hueso", "Estrella de mar", "Caja fuerte", "Cepillo de dientes", "Conejo", "Girasol",
    "Patineta", "Bolso de mano", "Hoja", "Calcetines", "Pecera", "Jaula", "Pista de carreras", "Pluma", "Huevo frito", "Oveja"
];

function generateUserId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function selectRandomUser(list) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

function raw(text) {
    return new TextEncoder().encode(text).buffer;
}

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

wss.on('connection', (ws) => {
  const userId = generateUserId();

  const user = { id: userId, username: '', socket: ws };
  users.push(user);

  // Enviar un mensaje a todos los usuarios cuando alguien se conecta
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send('¡Nuevo usuario se ha conectado!');
    }
  });

  // Manejar los mensajes desde el cliente
  ws.on('message', (message) => {
    console.log(`Mensaje recibido: ${message}`);

    const messageText = message.toString();

    if (messageText === 'cmd:iniciar') {
        const targetUser = selectRandomUser(users);
        const res = raw(selectRandomUser(objects));
        users.forEach(user => {
            if (user && user.socket.readyState === WebSocket.OPEN) {
                if (user.id === targetUser.id) {
                    user.socket.send(raw("Eres el impostor"));
                } else {
                    user.socket.send(res);
                }
            }
            user.socket.send(message);
        })
    } else {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                if (messageText.startsWith('cmd:newUser:')) {
                const regex = /cmd:newUser:(.*)/;
                const match = messageText.match(regex);
                const username = match[1];
                user.username = username;
                const parsedMessage = `${username} se ha conectado.`;
                const userList = `cmd:users:{${users.map(u => u.username).join(', ')}}`;
                client.send(raw(userList));
                client.send(raw(parsedMessage));
                } else {
                    client.send(message);
                }
            }
        });
    }
});

ws.on('close', () => {
    console.log(`Usuario desconectado (ID: ${userId})`);
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users.splice(index, 1);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                const userList = `cmd:users:{${users.map(u => u.username).join(', ')}}`;
                client.send(raw(userList));
            }
        })
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});