
const io = require('socket.io').listen(process.env.PORT ,(res)=>{
    res.header('Access-Control-Allow-Origin', '*');
    console.log('server is running on port 3100')
})
let roomName = ""
io.on('connection', socket=> {
    console.log(`socket is connected with client id ${socket.id}`)

    socket.on('joinRoom', room=>{
        console.log("client connect")
        const clientsInRoom = io.sockets.adapter.rooms[room];
        const numClient = clientsInRoom? Object.keys(clientsInRoom.sockets).length : 0;
        console.log(`client num + ${numClient}`)
        if (numClient ===0){
            socket.join(room)
            console.log(`first client join roomName ${room} socketid ${socket.id}`)
        }else if (numClient ===1){
            socket.join(room)
            console.log(`second client join roomName ${room} socketid ${socket.id}`)
            socket.in(room).emit('letOffer')
        }else{
            socket.in(room).emit('full')
        }    })
    socket.on('message',message=>{
        if (message.type==='offer'){
            console.log('client send message type offer')
            socket.broadcast.to("room").emit('recOffer',message)
        }else if (message.type ==='answer'){
            console.log('client send message type answer')
            socket.broadcast.to("room").emit('recAnswer',message)
        }else if (message.type ==='candidate'){
            console.log('client send message type candidate')
            socket.broadcast.to("room").emit('recCandidate', message)
        }

    })
})