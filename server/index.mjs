import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import * as cors from "cors";

const app = express();
app.use(cors.default());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:8080', 'http://localhost:63342']
    }
});

let todos = [];

io.on("connection", (socket) => {
    socket.emit('welcome', {data: 'Welcome to the TODO with socket.io'});

    socket.on("todo:create", (payload, callback) => {
        const todo = {
            id: Date.now(),
            todo: payload.todo,
            done: payload.done || false,
        }

        todos.push(todo);

        // acknowledge the creation
        callback({
            data: todo.id,
        });

        // notify the other users
        socket.broadcast.emit("todo:created", todo);
    });
    socket.on("todo:read", (id, callback) => {
        const todo = todos.find(item => item.id === id);
        if (todo) {
            return callback({
                data: todo,
            });
        }
        return callback({
            code: 404,
            error: "Entity not found",
        });
    });
    socket.on("todo:update", (payload, callback) => {
        const todoIndex = todos.findIndex(item => item.id === payload.id);
        if (todoIndex !== -1) {
            todos[todoIndex].todo = payload.todo;
            todos[todoIndex].done = payload.done;

            callback();
            socket.broadcast.emit("todo:updated", todos[todoIndex]);
        }
        return callback({
            code: 404,
            error: "Entity not found",
        });
    });
    socket.on("todo:mark-as-done", (id, callback) => {
        const todoIndex = todos.findIndex(item => item.id === id);
        if (todoIndex !== -1) {
            todos[todoIndex].done = true;

            callback();
            console.log(todos[todoIndex])
            socket.broadcast.emit("todo:updated", todos[todoIndex]);
        }
        return callback({
            code: 404,
            error: "Entity not found",
        });
    });
    socket.on("todo:delete", (id, callback) => {
        const todoIndex = todos.findIndex(item => item.id === id);
        if (todoIndex !== -1) {
            todos = todos.filter(item => item.id !== id);

            callback();
            socket.broadcast.emit("todo:deleted", id);
        }
        return callback({
            code: 404,
            error: "Entity not found",
        });
    });
    socket.on("todo:list", (callback) => {
        callback({
            data: todos,
        });
    });
});

httpServer.listen(3000);