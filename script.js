// INSIRA AQUI A URL DO SEU GOOGLE APPS SCRIPT DEPOIS DE PUBLICADO
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5oDWHLMowWqgEvr_pD2Htk_hzDMFKxzN0qmcqd5INZ9VtCUZ7WzNXUxQFUs2u6wVb/exec";

// --- Lógica da Contagem Regressiva ---
const countdownDate = new Date("June 13, 2026 18:00:00").getTime();

const updateCountdown = setInterval(function() {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
        clearInterval(updateCountdown);
        document.getElementById("countdown").innerHTML = "<h2>É hoje! Feliz Aniversário, Selma! 🎉</h2>";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("days").innerText = days.toString().padStart(2, '0');
    document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
    document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
}, 1000);


// --- Lógica de Renderização ---

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function renderGuest(guest, board, prepend = true) {
    const guestItem = document.createElement('div');
    guestItem.className = 'rsvp-item';
    
    let statusText = '';
    if (guest.isChild) {
        statusText += ' <span class="badge child-badge"><i class="fa-solid fa-child"></i> Criança (Menor de 7 anos)</span>';
    }
    
    guestItem.innerHTML = `
        <div class="rsvp-guest-info">
            <span class="guest-icon"><i class="fa-solid fa-user-check"></i></span>
            <div class="guest-details">
                <strong>${guest.name}</strong>
                <div class="guest-badges">${statusText || '<span class="badge presence-badge">Presença Confirmada</span>'}</div>
            </div>
        </div>
        <div class="rsvp-date">${guest.date}</div>
    `;
    
    if (prepend) {
        board.insertBefore(guestItem, board.firstChild);
    } else {
        board.appendChild(guestItem);
    }
}

function renderMessage(msg, board, prepend = true) {
    const newMsg = document.createElement('div');
    newMsg.className = 'message-item';
    newMsg.innerHTML = `
        <div class="message-header">
            <h4>${msg.name}</h4>
            <span class="message-time">${msg.date}</span>
        </div>
        <p>${msg.text}</p>
    `;
    
    if (prepend) {
        board.insertBefore(newMsg, board.firstChild);
    } else {
        board.appendChild(newMsg);
    }
}

// Carrega os dados salvos do Sheets ou do LocalStorage (fallback)
async function loadPersistedData() {
    const rsvpBoard = document.getElementById('rsvpBoard');
    const messageBoard = document.getElementById('messageBoard');
    
    // Se o usuário já configurou a URL do Google Sheets
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "URL_DO_SEU_SCRIPT_AQUI") {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            const data = await response.json();
            
            // Renderizar convidados do Google Sheets
            if (data.guests && data.guests.length > 0) {
                const emptyMsg = rsvpBoard.querySelector('.rsvp-empty-msg');
                if (emptyMsg) emptyMsg.remove();
                rsvpBoard.innerHTML = ''; // Limpa mensagens padrão
                data.guests.forEach(guest => renderGuest(guest, rsvpBoard, false));
            }
            
            // Renderizar mensagens do Google Sheets
            if (data.messages && data.messages.length > 0) {
                const emptyMsg = messageBoard.querySelector('.message-empty-msg');
                if (emptyMsg) emptyMsg.remove();
                messageBoard.innerHTML = ''; // Limpa mensagens padrão
                data.messages.forEach(msg => renderMessage(msg, messageBoard, false));
            }
            return; // Dados carregados com sucesso, encerra a função
        } catch (error) {
            console.error("Erro ao carregar dados do Google Sheets, usando LocalStorage como fallback:", error);
        }
    }
    
    // Fallback: LocalStorage
    const savedGuests = JSON.parse(localStorage.getItem('rsvp_guests') || '[]');
    if (savedGuests.length > 0) {
        const emptyMsg = rsvpBoard.querySelector('.rsvp-empty-msg');
        if (emptyMsg) emptyMsg.remove();
        savedGuests.forEach(guest => renderGuest(guest, rsvpBoard, false));
    }

    const savedMessages = JSON.parse(localStorage.getItem('mural_messages') || '[]');
    if (savedMessages.length > 0) {
        const emptyMsg = messageBoard.querySelector('.message-empty-msg');
        if (emptyMsg) emptyMsg.remove();
        savedMessages.forEach(msg => renderMessage(msg, messageBoard, false));
    }
}

// Inicializa o carregamento dos dados
document.addEventListener('DOMContentLoaded', loadPersistedData);


// --- Lógica de Confirmação de Presença ---
document.getElementById('rsvpForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const isChild = document.getElementById('isChild').checked;
    const dateStr = getFormattedDate();
    
    const newGuest = {
        name: name,
        isChild: isChild,
        date: dateStr
    };
    
    const rsvpBoard = document.getElementById('rsvpBoard');
    
    // Remove a mensagem de lista vazia
    const emptyMsg = rsvpBoard.querySelector('.rsvp-empty-msg');
    if (emptyMsg) {
        emptyMsg.remove();
    }
    
    // Renderiza na tela na hora
    renderGuest(newGuest, rsvpBoard, true);
    
    // Envia para o Google Sheets se estiver configurado
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "URL_DO_SEU_SCRIPT_AQUI") {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Necessário para evitar bloqueios CORS de redirecionamento do Google
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'rsvp',
                    ...newGuest
                })
            });
        } catch (error) {
            console.error("Erro ao enviar dados para o Google Sheets:", error);
        }
    }
    
    // Também salva no localStorage localmente por garantia/histórico
    const savedGuests = JSON.parse(localStorage.getItem('rsvp_guests') || '[]');
    savedGuests.unshift(newGuest);
    localStorage.setItem('rsvp_guests', JSON.stringify(savedGuests));
    
    const successMsg = document.getElementById('rsvpSuccess');
    successMsg.style.display = 'block';
    this.reset();
    
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 4000);
});


// --- Lógica do Mural de Mensagens ---
document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('msgName').value;
    const text = document.getElementById('messageText').value;
    const dateStr = getFormattedDate();
    
    const newMsgObj = {
        name: name,
        text: text,
        date: dateStr
    };
    
    const messageBoard = document.getElementById('messageBoard');
    
    // Remove a mensagem de mural vazio
    const emptyMsg = messageBoard.querySelector('.message-empty-msg');
    if (emptyMsg) {
        emptyMsg.remove();
    }
    
    // Renderiza na tela na hora
    renderMessage(newMsgObj, messageBoard, true);
    
    // Envia para o Google Sheets se estiver configurado
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "URL_DO_SEU_SCRIPT_AQUI") {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'message',
                    ...newMsgObj
                })
            });
        } catch (error) {
            console.error("Erro ao enviar mensagem para o Google Sheets:", error);
        }
    }
    
    // Também salva no localStorage localmente por garantia/histórico
    const savedMessages = JSON.parse(localStorage.getItem('mural_messages') || '[]');
    savedMessages.unshift(newMsgObj);
    localStorage.setItem('mural_messages', JSON.stringify(savedMessages));
    
    const successMsg = document.getElementById('msgSuccess');
    successMsg.style.display = 'block';
    this.reset();
    
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 4000);
});
