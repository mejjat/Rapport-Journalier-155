// Navigation function
function navigateTo(page) {
    // Add smooth transition effect
    document.body.style.opacity = '0';
    setTimeout(() => {
        switch(page) {
            case 'home':
                window.location.href = 'index.html';
                break;
            case 'nouvelle-tache':
                window.location.href = 'nouvelle-tache.html';
                break;
            case 'taches-accomplies':
                window.location.href = 'taches-accomplies.html';
                break;
            case 'generer-rapport':
                window.location.href = 'generer-rapport.html';
                break;
        }
    }, 300);
}

// Generate PDF function
async function generatePDF() {
    const tasks = DataManager.getTasks();
    if (tasks.length === 0) {
        alert('Aucune tâche à inclure dans le rapport.');
        return;
    }

    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    // Simulate PDF generation (to be implemented with actual PDF generation library)
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        alert('Le rapport PDF a été généré avec succès!');
    }, 2000);
}

// Reset tasks function
function resetTasks() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les tâches accomplies?')) {
        DataManager.resetTasks();
        alert('Tâches réinitialisées avec succès!');
        if (window.location.pathname.includes('taches-accomplies.html')) {
            loadTasks(); // Refresh the tasks list if on the tasks page
        }
    }
}

// Add fade-in effect on page load
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add smooth transitions
document.body.style.transition = 'opacity 0.3s ease-in-out';
