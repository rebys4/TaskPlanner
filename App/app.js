class appTaskPlanner {
    constructor(containerId, options = {} ) {
        this.container = document.getElementById(containerId);
        this.tasks = [];
        this.taskIdCounter = 0; 
        this.currentFilter = null; 
        this.editingTaskId = null; 
        this.hideCompleted = false; 

        if (options.cssPath) {
            this.loadCSS(options.cssPath);
        }

        this.createLayout();
        this.createModal(); 
        this.loadTasksFromLocalStorage();
        this.renderTasks(this.currentFilter);
    }

    loadCSS(path) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
    }

    // Сохранение задач в localStorage
    saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Загрузка задач из localStorage
    loadTasksFromLocalStorage() {
        const tasksData = localStorage.getItem('tasks');
        if (tasksData) {
            this.tasks = JSON.parse(tasksData);
            
            if (this.tasks.length > 0) {
                this.taskIdCounter = Math.max(...this.tasks.map(task => task.id)) + 1;
            }
        }
    }

    createElement(tag, styles = {}, attributes = {}) {
        const element = document.createElement(tag);
        Object.assign(element.style, styles);
        for (const key in attributes) {
            element.setAttribute(key, attributes[key]);
        }
        return element;
    }

    createLayout() {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.width = '100vw';
        this.container.style.height = '100vh';
        this.container.style.background = '#f5f5f5';

        const header = this.createHeader();
        const mainContainer = this.createElement('div', {
            display: 'flex',
            flex: '1',
        });
        
        this.sidebar = this.createSidebar();
        this.taskList = this.createTaskList();
        
        mainContainer.appendChild(this.sidebar);
        mainContainer.appendChild(this.taskList);
        
        this.container.appendChild(header);
        this.container.appendChild(mainContainer);
    }

    createHeader() {
        const header = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            background: '#fff'
        });

        const title = this.createElement('h1', { 
            fontSize: '24px', 
            fontFamily: 'Roboto',
            color: '#000' 
        });
        title.textContent = 'Планировщик задач';

        const addButton = this.createElement('button', {
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            fontSize: '20px',
            cursor: 'pointer',
            borderRadius: '250px'
        });
        addButton.textContent = '+';
        addButton.addEventListener('click', () => this.openTaskModal());
        
        header.appendChild(title);
        header.appendChild(addButton);
        return header;
    }

    createSidebar() {
        const sidebar = this.createElement('div', {
            width: '200px',
            background: '#ddd',
            padding: '50px 15px',
            margin: "15px",
            border: "none",
            borderRadius: "25px"
        });

        const sections = ['Работа', 'Учеба', 'Личное'];
        sections.forEach(section => {
            const button = this.createElement('button', {
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '5px',
                border: "none",
                borderRadius: "250px",
                cursor: 'pointer'
            });

            const textSection = this.createElement("p", {
                fontSize: "16px",
                fontFamily: "Roboto"
            });
            
            textSection.textContent = section;
            button.appendChild(textSection);
            button.addEventListener('click', () => this.sortTasksBySection(section));
            sidebar.appendChild(button);
        });

        // Кнопка для отображения всех задач
        const allButton = this.createElement('button', {
            display: 'block',
            width: '100%',
            padding: '10px',
            marginTop: '15px',
            marginBottom: '15px',
            cursor: 'pointer',
            background: '#bbb',
            borderRadius: "250px"
        });

        const textBtn = this.createElement("p", {
            fontSize: "16px",
            fontFamily: "Roboto"
        });

        textBtn.textContent = 'Все задачи';
        allButton.appendChild(textBtn);
        allButton.addEventListener('click', () => {
            this.currentFilter = null;
            this.renderTasks();
        });
        sidebar.appendChild(allButton);

        // Новая кнопка "Скрыть выполненные задачи"
        const hideCompletedButton = this.createElement('button', {
            display: 'block',
            width: '100%',
            padding: '10px',
            marginBottom: '5px',
            cursor: 'pointer',
            background: '#bbb',
            borderRadius: "25px"
        });

        const hideCompletedText = this.createElement("p", {
            fontSize: "16px",
            fontFamily: "Roboto"
        });

        hideCompletedText.textContent = 'Скрыть выполненные задачи';
        hideCompletedButton.appendChild(hideCompletedText);
        hideCompletedButton.addEventListener('click', () => {
            this.hideCompleted = !this.hideCompleted;
            hideCompletedText.textContent = this.hideCompleted ? 
                'Показать выполненные задачи' : 'Скрыть выполненные задачи';
            this.renderTasks(this.currentFilter);
        });
        sidebar.appendChild(hideCompletedButton);

        return sidebar;
    }

    createTaskList() {
        return this.createElement('div', {
            display: "flex",
            flexWrap: "wrap",
            margin: "10px",
            padding: "20px",
            overflow: "auto", 
            maxHeight: "calc(100vh - 100px)", 
            background: "#f5f5f5", 
            borderRadius: "25px" 
        });
    }
    

    createModal() {
        // Создаём оверлей для модального окна
        this.modalOverlay = this.createElement('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
        });
        
        // Создаём контейнер самого модального окна
        const modalContent = this.createElement('div', {
            background: '#fff',
            padding: '20px',
            borderRadius: '25px',
            width: '500px',
            height: "400px",
            boxSizing: "border-box"
        });
        
        const modalTitle = this.createElement('h2', { fontFamily: "Roboto", marginBottom: '15px' });
        modalTitle.textContent = 'Новая задача';
        
        this.createTaskModal(modalContent, modalTitle);
    }

    createTaskModal(modalContent, modalTitle) {
        // Поле для названия задачи
        this.inputTitle = this.createElement('input', {
            width: '100%',
            height: "30px",
            padding: '8px',
            border: "1px solid black",
            borderRadius: "50px",
            marginBottom: '10px',
            boxSizing: 'border-box',
        }, { placeholder: 'Название задачи' });

        // Выпадающий список для выбора раздела
        this.inputSection = this.createElement('select', {
            width: '450px',
            height: "35px",
            padding: '4px',
            borderRadius: "25px",
            marginBottom: '10px',
            boxSizing: 'border-box'
        });
        const sections = ['Работа', 'Учеба', 'Личное'];
        sections.forEach(sec => {
            const option = document.createElement('option');
            option.value = sec;
            option.textContent = sec;
            this.inputSection.appendChild(option);
        });

        // Поле для описания задачи
        this.inputDescription = this.createElement('textarea', {
            width: '100%',
            height: "150px",
            padding: '8px',
            marginBottom: '10px',
            boxSizing: 'border-box',
            borderRadius: "15px"
        }, { placeholder: 'Описание задачи' });
        
        // Контейнер для кнопок
        const buttonContainer = this.createElement('div', {
            display: 'flex',
            justifyContent: 'flex-end',
        });
        
        const cancelButton = this.createElement('button', {
            padding: '8px 12px',
            marginRight: '10px',
            background: '#ccc',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px'
        });
        cancelButton.textContent = 'Отмена';
        cancelButton.addEventListener('click', () => this.closeTaskModal());
        
        const confirmButton = this.createElement('button', {
            padding: '8px 12px',
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px'
        });
        confirmButton.textContent = 'Сохранить';
        confirmButton.addEventListener('click', () => {
            const title = this.inputTitle.value.trim();
            const description = this.inputDescription.value.trim();
            const section = this.inputSection.value;
            if (title === '') {
                alert('Введите название задачи');
                return;
            }
            if (this.editingTaskId !== null) {
                // Редактирование существующей задачи
                const task = this.tasks.find(t => t.id === this.editingTaskId);
                if (task) {
                    task.title = title;
                    task.description = description;
                    task.section = section;
                    task.updatedAt = new Date().toISOString();
                }
                this.editingTaskId = null;
            } else {
                // Создание новой задачи с дополнительными уникальными полями
                const task = { 
                    id: this.taskIdCounter++, 
                    title, 
                    description, 
                    section, 
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                this.tasks.push(task);
            }
            // Восстанавливаем заголовок модального окна для создания новой задачи
            this.modalOverlay.querySelector('h2').textContent = 'Новая задача';
            this.closeTaskModal();
            this.renderTasks(this.currentFilter);
            this.saveTasksToLocalStorage();
        });
        
        // Кнопка для удаления задачи в режиме редактирования
        this.deleteButton = this.createElement('button', {
            padding: '8px 12px',
            background: '#f44336',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px',
            marginLeft: '10px',
            display: 'none' // по умолчанию скрыта
        });
        this.deleteButton.textContent = 'Удалить';
        this.deleteButton.addEventListener('click', () => {
            if (confirm("Вы уверены, что хотите удалить задачу?")) {
                this.tasks = this.tasks.filter(task => task.id !== this.editingTaskId);
                this.editingTaskId = null;
                this.modalOverlay.querySelector('h2').textContent = 'Новая задача';
                this.closeTaskModal();
                this.renderTasks(this.currentFilter);
                this.saveTasksToLocalStorage();
            }
        });
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(this.deleteButton);
        
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(this.inputTitle);
        modalContent.appendChild(this.inputSection);
        modalContent.appendChild(this.inputDescription);
        modalContent.appendChild(buttonContainer);
        
        this.modalOverlay.appendChild(modalContent);
        document.body.appendChild(this.modalOverlay);
    }

    openTaskModal() {
        this.editingTaskId = null;
        this.modalOverlay.querySelector('h2').textContent = 'Новая задача';
        this.inputTitle.value = '';
        this.inputDescription.value = '';
        this.inputSection.selectedIndex = 0;
        this.deleteButton.style.display = 'none'; // скрываем кнопку удаления при создании
        this.modalOverlay.style.display = 'flex';
    }
    
    closeTaskModal() {
        this.modalOverlay.style.display = 'none';
    }
    
    renderTasks(filterSection = null) {
        this.taskList.innerHTML = '';
        let tasksToRender = filterSection 
            ? this.tasks.filter(task => task.section === filterSection)
            : this.tasks;
            
        // Применяем фильтр по скрытию выполненных задач, если он включен
        if (this.hideCompleted) {
            tasksToRender = tasksToRender.filter(task => !task.completed);
        }
        
        tasksToRender.forEach(task => {
            const taskItem = this.createElement('div', {
                background: '#fff',
                padding: '10px',
                margin: '10px',
                borderRadius: '5px',
                width: '350px',
                height: '180px'
            });
            
            
            const titleElem = this.createElement('h3', { fontFamily: "Roboto" });
            titleElem.textContent = task.title;
            
            const descriptionElem = this.createElement('p', { fontFamily: "Roboto" });
            descriptionElem.textContent = task.description;
        
            
            const editButton = this.createElement('button', { border: "1px solid black", borderRadius: "25px", marginRight: '5px' });
            const textEditBtn = this.createElement('p', { fontFamily: "Roboto", fontSize: "10px" });
            textEditBtn.textContent = "Редактировать";
            editButton.appendChild(textEditBtn);
            editButton.addEventListener('click', () => this.editTask(task.id));
            
            const completeButton = this.createElement('input', {}, { type: 'checkbox' });
            completeButton.checked = task.completed;
            completeButton.addEventListener('change', () => {
                this.markTaskAsCompleted(task.id);
                this.saveTasksToLocalStorage();
            });
            
            taskItem.appendChild(titleElem);
            taskItem.appendChild(descriptionElem);
            taskItem.appendChild(editButton);
            taskItem.appendChild(completeButton);
            this.taskList.appendChild(taskItem);
        });
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        // Устанавливаем режим редактирования
        this.editingTaskId = taskId;
        // Изменяем заголовок модального окна
        this.modalOverlay.querySelector('h2').textContent = 'Редактирование задачи';
        // Предзаполняем поля данными задачи
        this.inputTitle.value = task.title;
        this.inputDescription.value = task.description;
        for (let i = 0; i < this.inputSection.options.length; i++) {
            if (this.inputSection.options[i].value === task.section) {
                this.inputSection.selectedIndex = i;
                break;
            }
        }
        this.deleteButton.style.display = 'inline-block';
        this.modalOverlay.style.display = 'flex';
    }
    
    markTaskAsCompleted(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks(this.currentFilter);
        }
    }
    
    sortTasksBySection(section) {
        this.currentFilter = section;
        this.renderTasks(section);
    }
}