const DataManager = {
    TASKS_KEY: 'electrical_intervention_tasks',
    REPORTS_KEY: 'generated_reports',

    init() {
        if (!localStorage.getItem(this.TASKS_KEY)) {
            localStorage.setItem(this.TASKS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.REPORTS_KEY)) {
            localStorage.setItem(this.REPORTS_KEY, JSON.stringify([]));
        }
    },

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > 1920 || height > 1080) {
                        const ratio = Math.min(1920 / width, 1080 / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const quality = file.size > 5000000 ? 0.7 : 0.9;
                    const base64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64);
                };
                img.onerror = () => reject(new Error('Erreur lors du traitement de l\'image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
            reader.readAsDataURL(file);
        });
    },

    async addTask(taskData) {
        try {
            if (taskData.photo instanceof File) {
                taskData.photo = await this.processImage(taskData.photo);
            }
            
            const tasks = this.getTasks();
            tasks.push({
                ...taskData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la tâche:', error);
            return false;
        }
    },

    getTasks() {
        const tasksJson = localStorage.getItem(this.TASKS_KEY);
        return JSON.parse(tasksJson) || [];
    },

    getTasksByDateRange(startDate, endDate) {
        const tasks = this.getTasks();
        return tasks.filter(task => {
            const taskStart = new Date(task.startTime);
            return taskStart >= startDate && taskStart <= endDate;
        });
    },

    getTaskStatistics(startDate = null, endDate = null) {
        let tasks = this.getTasks();
        
        if (startDate && endDate) {
            tasks = this.getTasksByDateRange(startDate, endDate);
        }

        const stats = {
            total: tasks.length,
            statusCount: {
                encours: 0,
                terminee: 0,
                annulee: 0
            },
            averageDuration: 0,
            totalDuration: 0,
            byEngin: {}
        };

        tasks.forEach(task => {
            // Compter par status
            stats.statusCount[task.status] = (stats.statusCount[task.status] || 0) + 1;
            
            // Calculer la durée totale
            stats.totalDuration += task.duration || 0;
            
            // Compter par engin
            stats.byEngin[task.engin] = (stats.byEngin[task.engin] || 0) + 1;
        });

        // Calculer la durée moyenne
        stats.averageDuration = stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;

        return stats;
    },

    async saveReport(reportData) {
        try {
            const reports = JSON.parse(localStorage.getItem(this.REPORTS_KEY)) || [];
            const report = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                ...reportData
            };
            reports.push(report);
            localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
            return report.id;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du rapport:', error);
            throw error;
        }
    },

    getReport(reportId) {
        const reports = JSON.parse(localStorage.getItem(this.REPORTS_KEY)) || [];
        return reports.find(report => report.id === reportId);
    },

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    },

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
    },

    clearTasks() {
        localStorage.setItem(this.TASKS_KEY, JSON.stringify([]));
    },

    async saveTask(taskData) {
        try {
            let tasks = this.getTasks();
            const taskId = Date.now().toString();
            
            // Traitement de la photo
            let photoData = null;
            if (taskData.photo) {
                if (taskData.photo instanceof File) {
                    photoData = await this.processPhoto(taskData.photo);
                } else if (typeof taskData.photo === 'string' && taskData.photo.startsWith('data:image')) {
                    // La photo est déjà en base64 (capture de la caméra)
                    photoData = await this.compressBase64Image(taskData.photo);
                }
            }

            const task = {
                id: taskId,
                taskName: taskData.taskName,
                engin: taskData.engin,
                intervenants: taskData.intervenants,
                details: taskData.details,
                startTime: taskData.startTime,
                endTime: taskData.endTime,
                duration: taskData.duration,
                status: taskData.status,
                photo: photoData,
                createdAt: new Date().toISOString()
            };

            tasks.push(task);
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
            return taskId;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la tâche:', error);
            throw error;
        }
    },

    async processPhoto(photoFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const compressedImage = await this.compressBase64Image(e.target.result);
                    resolve(compressedImage);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(photoFile);
        });
    },

    async compressBase64Image(base64String) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculer les nouvelles dimensions
                let width = img.width;
                let height = img.height;
                const maxSize = 1200; // Taille maximale pour la plus grande dimension

                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                // Dessiner l'image redimensionnée
                ctx.drawImage(img, 0, 0, width, height);

                // Compression en JPEG avec qualité réduite
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = base64String;
        });
    },

    getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(task => task.id === taskId);
    },

    updateTask(updatedTask) {
        let tasks = this.getTasks();
        const index = tasks.findIndex(task => task.id === updatedTask.id);
        
        if (index !== -1) {
            // Préserver la photo si elle n'a pas été modifiée
            const existingTask = tasks[index];
            if (!updatedTask.photo && existingTask.photo) {
                updatedTask.photo = existingTask.photo;
            }
            
            tasks[index] = {
                ...existingTask,
                ...updatedTask,
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
            return true;
        }
        return false;
    },

    deleteTask(taskId) {
        let tasks = this.getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks.splice(index, 1);
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
            return true;
        }
        return false;
    },
};

// Initialiser le gestionnaire de données
DataManager.init();
