'use strict';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.socket = io("http://localhost:3000");

        this.state = {
            inputTodo: '',
            editMode: false,
            currentTodo: null,
            todos: []
        };

        this.socket.on("connect", () => {
            this.socket.emit("todo:list", (res) => {
                console.log("todo:list response", res);
                this.setState({todos: res.data});
            });
        });

        this.socket.on('welcome', payload => {
            console.log(payload);
        });

        this.socket.on("todo:created", (todo) => {
            console.log("todo:created response", todo);
            this.setState({
                todos: [
                    ...this.state.todos,
                    todo
                ]
            });
        });

        this.socket.on("todo:updated", (todo) => {
            console.log("todo:updated response", todo);
            const todoIndex = this.state.todos.findIndex(item => item.id === todo.id);
            if (todoIndex !== -1) {
                const newTodos = [...this.state.todos];
                newTodos.splice(todoIndex, 1, todo)
                this.setState({todos: newTodos});
            }
        });

        this.socket.on("todo:deleted", (id) => {
            console.log("todo:deleted response", id);
            this.setState({
                todos: this.state.todos.filter(item => item.id !== id)
            });
        });

        this.onInputChange = this.onInputChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onInputChange(e) {
        this.setState({inputTodo: e.target.value});
    }

    edit(item) {
        this.setState({
            editMode: true,
            currentTodo: item,
            inputTodo: item.todo,
        });
    }

    onSubmit(e) {
        e.preventDefault();
        if (this.state.inputTodo.trim() !== "") {
            const currentTodo = this.state.currentTodo;

            this.setState({
                inputTodo: '',
                currentTodo: null,
                editMode: false,
            });

            if (this.state.editMode && currentTodo) {
                if (currentTodo.todo !== this.state.inputTodo) {
                    currentTodo.done = false;
                }
                currentTodo.todo = this.state.inputTodo;

                const todoIndex = this.state.todos.findIndex(item => item.id === currentTodo.id);
                this.socket.emit("todo:update", currentTodo, (res) => {
                    console.log("todo:update ack", res);
                    const newTodos = [...this.state.todos];
                    newTodos.splice(todoIndex, 1, currentTodo)
                    this.setState({todos: newTodos});
                });
            } else {
                const payload = {
                    todo: this.state.inputTodo,
                    done: false
                };

                this.socket.emit("todo:create", payload, (res) => {
                    console.log("todo:create ack", res);
                    payload.id = res.data;
                    this.setState({
                        todos: [
                            ...this.state.todos,
                            payload,
                        ]
                    });
                });
            }
        }
    }

    onRemove(todo) {
        this.socket.emit("todo:delete", todo.id, (res) => {
            console.log("todo:delete ack", res);
            if (res && "error" in res) {
                alert("Error: " + res.error);
            } else {
                // can be moved outside callback
                this.setState({
                    todos: this.state.todos.filter(item => item.id !== todo.id)
                });
            }
        });
    }

    markAsDone(todo) {
        this.socket.emit("todo:mark-as-done", todo.id, (res) => {
            console.log("todo:mark-as-done ack", res);
            if (res && "error" in res) {
                alert("Error: " + res.error);
            } else {
                // can be moved outside callback
                this.setState({
                    todos: this.state.todos.map(item => {
                        if (item.id === todo.id) {
                            item.done = true;
                        }
                        return item;
                    })
                });
            }
        });
    }

    render() {
        return (
            <div className="container my-3">
                <div className="col-md-7 mx-auto">
                    <div className="mb-4 text-center">
                        <h2 className="mb-0 fw-bold">Realtime Todos</h2>
                        <p className="text-muted">Simple todo app with socket.io</p>
                    </div>
                    <form id="message-form" onSubmit={this.onSubmit}>
                        <div className="row g-3">
                            <div className="col-sm-10">
                                <input type="text" id="user-message" placeholder="Enter your todo"
                                       onChange={this.onInputChange}
                                       className="form-control" value={this.state.inputTodo}/>
                            </div>
                            <div className="col-sm-2">
                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary"
                                            disabled={this.state.inputTodo.trim() === ""}>
                                        {this.state.editMode ? 'Update' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                    <ul className="list-group list-group-flush mt-3">
                        {
                            this.state.todos.map((item) => {
                                return (
                                    <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <p className="mb-0" style={item.done ? {textDecoration: 'line-through', color: 'maroon'} : null}>
                                            {item.todo}
                                        </p>
                                        <div>
                                            {!item.done && (
                                                <button type={"button"} className="btn btn-sm btn-success text-sm me-1"
                                                        onClick={() => this.markAsDone(item)}>✓ Mark as Done</button>
                                            )}
                                            <button
                                                type={"button"}
                                                className="btn btn-sm btn-warning text-sm me-1"
                                                onClick={() => this.edit(item)}>
                                                Edit
                                            </button>
                                            <button
                                                type={"button"}
                                                className="btn btn-sm btn-danger text-sm"
                                                onClick={() => this.onRemove(item)}
                                            >
                                                ⨉
                                            </button>
                                        </div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            </div>
        );
    }
}

const domContainer = document.querySelector('#app');
const root = ReactDOM.createRoot(domContainer);
root.render(<App/>);