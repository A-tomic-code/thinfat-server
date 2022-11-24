const { WebSocketServer, on } = require('ws');
const express = require('express');
const app = express();
const uuid = require('uuid');

const errorHandling = require('./error/errorHandling');


app.set('PORT', process.env.PORT || 8080);

app.use( (req, res, next) => {
    res.status(404).json({
        error: true,
        code: 404,
        message: 'Resource not found --> ' + req.url
    });

    next()
})

app.use(errorHandling);

//Sockets

const PORT = Number(app.get('PORT'));
const activeSocketConnections = new Map();
const MESSAGETYPES = {
    message: 'message',
    config: 'config',
    clientListChange: 'client-list-change',
    requestAdmin: 'request-admin'
}

const wss = new WebSocketServer({
    port: PORT + 15
}, () => {
    console.log(`WebSockets running on port ` + (PORT + 15));
});

wss.on('connection', (socket) => {
    const id = uuid.v4();
    console.log(`new connection --> ${id}`)

    initUser(id, socket)

    socket.on('message' , (msg ,isBinary) => {

        const data = isBinary ? msg : msg.toString();
        let message;

        console.log('Recibido --> ', data);

        if(data.at(0) == '{' && data.at(data.length - 1) == '}'){
            message = JSON.parse(data);

            if(message.type == MESSAGETYPES.requestAdmin){

                for(const key of activeSocketConnections){

                    if(key[0] == message.from){
                        activeSocketConnections.delete(message.from);
                        activeSocketConnections.set('thinfat', key[1]);
                    }

                }
                
                let arr = [...activeSocketConnections].map( ([id, socket]) => id) 
                const initAdmin = {
                    type: MESSAGETYPES.clientListChange,
                    list: JSON.stringify(arr),
                }

                const result = {
                    type: MESSAGETYPES.config,
                    id: 'thinfat'
                };



                socket.send( JSON.stringify(result) );
                socket.send( JSON.stringify(initAdmin) );
            }

        } else {
            message = data;
        }

        broadcast(socket, message);
    })
});

function broadcast(socket, msg){

    const message = JSON.stringify(msg);
    socket.send(message);
    console.log('broadast OK');

}

function initUser(id, socket){

    activeSocketConnections.set(id, socket)
    const arr = [...activeSocketConnections].map( ([id, socket]) => {
        return id
    })
    const arr_str = JSON.stringify(arr)

    const update_clientList = {
        type: MESSAGETYPES.clientListChange, 
        list: arr_str,
    }


    const init_msg = {
        type: MESSAGETYPES.config,
        id: id
    };

    const welcome_msg = {
        type: MESSAGETYPES.message,
        from: 'thinfat',
        to: id,
        content: 'Hola, soy Sarah, resposble de ThinFat ?en que podemos ayudarte?'
    }

    socket.send(JSON.stringify(init_msg));
    socket.send(JSON.stringify(welcome_msg));
    if(activeSocketConnections.get('thinfat')){
        activeSocketConnections.get('thinfat').send(JSON.stringify(update_clientList)); 
    }

}
module.exports = app, wss;