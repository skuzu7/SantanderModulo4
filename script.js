const taskInput = document.getElementById('taskInput')
const addButton = document.getElementById('addButton')
const taskList = document.getElementById('taskList')

const API_URL =
    'https://crudcrud.com/api/a241f3b61a0a40a1b05a24506ddd8d6f/tasks'

let editMode = false
let editId = null

const toggleErrorVisible = (isVisible) => {
    const invalidText = document.getElementById('invalid-text')

    if (!isVisible) {
        invalidText.classList.replace('invisible', 'visible')
    } else {
        invalidText.classList.replace('visible', 'invisible')
    }
}

taskInput.addEventListener('keyup', (e) => {
    const text = e.target.value
    toggleErrorVisible(!!text)
})

const formatDate = (date) => {
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    const hour = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    const now = `${hour.toString().padStart(2, 0)}:${minutes
        .toString()
        .padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`

    const today = `${day.toString().padStart(2, 0)}/${month
        .toString()
        .padStart(2, 0)}/${year.toString()}`

    return { today, now }
}

function updateClock() {
    const { today, now } = formatDate(new Date())

    const dateContainer = document.getElementById('date-container')
    dateContainer.innerHTML = `<h4>${now}</h4><p>${today}</p>`
}

setInterval(updateClock, 1000)

// Fetch tasks from the API
function fetchTasks() {
    fetch(API_URL)
        .then((response) => response.json())
        .then((data) => {
            renderTasks(data)
        })
        .catch((error) => {
            console.error('Error fetching tasks:', error)
        })
}

// Create
addButton.addEventListener('click', async function (e) {
    e.target.disabled = true
    const taskText = taskInput.value.trim()

    if (!taskText) {
        toggleErrorVisible(false)
        return
    }
    if (!editMode) {
        await addTask(taskText)
    } else {
        await fetchEdit(editId, taskText)
        editMode = false
        editId = null
        taskInput.value = ''

        addButton.classList.remove('saveEditBtn')
        addButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'

        await fetchTasks()
    }
    e.target.disabled = false
})

// Read
function renderTasks(tasks) {
    taskList.innerHTML = ''
    tasks.forEach(function (task) {
        const { today, now } = formatDate(new Date(task.date))
        const li = document.createElement('li')

        li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${
            task._id
        }" onclick="checkTask('${task._id}')"/>
        <div class="task-container ${
            task.completed ? 'completed' : ''
        }"  id="task-${task._id}">
      <span>${task.text}</span>
        <p>${today} ${now}</p>
        </div>
      <button class="deleteButton" onclick="deleteTask('${
          task._id
      }')"><i class="fa-solid fa-trash"></i></button>
      <button class="editButton" onclick="editTask('${
          task._id
      }')"><i class="fa-solid fa-pencil"></i></button>
    `
        taskList.appendChild(li)
    })
}
function addTask(taskText) {
    const task = {
        text: taskText,
        completed: false,
        date: new Date(),
    }
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    })
        .then((response) => response.json())
        .then((data) => {
            taskInput.value = ''
            fetchTasks() // Refresh the task list after creating a new task
        })
        .catch((error) => {
            console.error('Error creating task:', error)
        })
}
async function editTask(taskId) {
    const input = document.getElementById('taskInput')
    const task = await (
        await fetch(`${API_URL}/${taskId}`, { method: 'GET' })
    ).json()
    if (!task) {
        return
    }
    input.value = task.text
    editMode = true
    editId = taskId

    const addButton = document.getElementById('addButton')
    addButton.classList.add('saveEditBtn')
    addButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>'
}

async function fetchEdit(taskId, taskText) {
    const task = await (
        await fetch(`${API_URL}/${taskId}`, { method: 'GET' })
    ).json()
    const newTask = {
        completed: task.completed,
        text: taskText || task.text,
        date: new Date(),
    }

    await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
    })
}
function deleteTask(taskId) {
    fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE',
    })
        .then(() => {
            fetchTasks() // Refresh the task list after deleting a task
        })
        .catch((error) => {
            console.error('Error deleting task:', error)
        })
}
function checkTask(taskId) {
    fetch(`${API_URL}/${taskId}`)
        .then((response) => response.json())
        .then((task) => {
            task.completed = !task.completed
            return fetch(`${API_URL}/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: task.text,
                    completed: task.completed,
                    date: task.date,
                }),
            })
        })
        .then(() => {
            fetchTasks()
        })
        .catch((error) => {
            console.error('Error updating task:', error)
        })
}
// Fetch tasks on page load
fetchTasks()
updateClock()
