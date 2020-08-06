const express = require('express')
const app =express()
const server =require('http').createServer(app)
const io = require('socket.io')(server)
server.listen(3100 ,()=>{
    console.log('server is running on port 3100')
})
let roomName = ""
io.on('connection', socket=> {
    console.log(`socket is connected with client id ${socket.id}`)
    socket.on('connect', room=>{//클라이언트가 연결됐을때
        const clientsInRoom = io.sockets.adapter.rooms[room];//룸 안에 있는 클라이언트
        const numClient = clientsInRoom? Object.keys(clientsInRoom.sockets).length : 0;
        if (numClient ===0){
            socket.join(room)
            console.log(`first client join socketid ${socket.id}`)
        }else if (numClient ===1){
            socket.join(room)
            console.log(`second client join socketid ${socket.id}`)
            socket.in(room).emit('letOffer')
        }else{
            socket.in(room).emit('full')

        }    })
    socket.on('message',message=>{
        if (message.type==='offer'){
            socket.in(roomName).emit('recOffer',message)
        }else if (message.type ==='answer'){
            socket.in(roomName).emit('recAnswer',message)
        }else if (message.type ==='candidate'){
            socket.in(roomName).emit('recCandidate')

        }    })
})