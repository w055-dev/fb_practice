const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    list.innerHTML = notes.map((note, i) => `
        <li class="row" style="margin-bottom: 10px; align-items: center;">
            <span class="col-9">${note}</span>
            <button class="col-3 button error" onclick="deleteNote(${i})">Удалить</button>
        </li>
    `).join('');
}

function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

function deleteNote(id){
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(id, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

form.addEventListener('submit', (e) =>{
    e.preventDefault();
    const text = input.value.trim();
    if (text){
        addNote(text);
        input.value = '';
    }
})

loadNotes();

if ('serviceWorker' in navigator){
    window.addEventListener('load', async() => {
        try{
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker зарегистрирован', registration.scope);
        } catch (err){
            console.log('Ошибка регистрации ServiceWorker:', err);
        }
    });
}