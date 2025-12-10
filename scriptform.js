// scriptform.js

// 🚨 ATENÇÃO: Verifique se a URL e a porta (3000) estão corretas para sua API NestJS.
const API_BASE_URL = 'http://localhost:3000'; 
const DONATIONS_ENDPOINT = '/donations';
const INSTITUTIONS_ENDPOINT = '/institutions'; 

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('user-form');
    
    // 1. Carregar e renderizar as instituições como botões
    renderInstitutionButtons();

    // 2. Listener do formulário: USANDO O EVENTO 'submit' DO FORMULÁRIO
    // O botão no HTML agora é type="submit".
    form.addEventListener('submit', async (event) => {
        // ESSA É A PREVENÇÃO MAIS ROBUSTA CONTRA RECARREGAMENTO DE PÁGINA
        event.preventDefault(); 
        
        const data = collectFormData(form);

        if (!validateData(data)) {
            alert('Por favor, preencha todos os campos obrigatórios (incluindo a instituição, o valor e o tipo de pagamento)!');
            return;
        }

        try {
            await sendDonation(data);
            
            // 🎯 RETORNO AO ALERT:
            alert('Doação registrada com sucesso! Agradecemos sua contribuição.'); 
            
            // Limpa o formulário APÓS o sucesso
            form.reset(); 
            document.getElementById('institution-id-hidden').value = '';
            document.querySelectorAll('.institution-button').forEach(btn => btn.classList.remove('selected'));
        } catch (error) {
            console.error('Erro ao enviar doação:', error);
            alert('Erro ao registrar a doação. Verifique o console para detalhes sobre a falha na API.');
        }
    });
});

/**
 * Busca a lista de instituições na API do NestJS (GET /institutions).
 */
async function fetchInstitutions() {
    const url = `${API_BASE_URL}${INSTITUTIONS_ENDPOINT}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Erro ao buscar instituições: ${response.status} ${response.statusText}`);
            return [];
        }
        return response.json();
    } catch (error) {
        console.error("Não foi possível carregar as instituições. Verifique se a API está rodando:", error);
        return [];
    }
}

/**
 * Cria os botões de instituição e adiciona a lógica de seleção ao container.
 */
async function renderInstitutionButtons() {
    const container = document.getElementById('institution-selection-container');
    const hiddenInput = document.getElementById('institution-id-hidden');
    container.innerHTML = '<p>Carregando instituições...</p>';

    const institutions = await fetchInstitutions();

    if (institutions.length === 0) {
        container.innerHTML = '<p>Nenhuma instituição encontrada.</p>';
        return;
    }

    container.innerHTML = ''; // Limpa o estado de carregamento

    institutions.forEach(institution => {
        const btn = document.createElement('button');
        btn.type = 'button'; // Mantido como type="button" para evitar submissão ao clicar na instituição
        btn.className = 'institution-button';
        
        const name = institution.institutionName || `Nome não encontrado (ID: ${institution.id})`;
        const imageUrl = institution.urlImage || 'https://via.placeholder.com/80?text=Sem+Logo'; 

        btn.innerHTML = `
            <img src="${imageUrl}" alt="Logo da ${name}">
            <span>${name}</span>
        `;
        btn.setAttribute('data-institution-id', institution.id);

        btn.addEventListener('click', () => {
            document.querySelectorAll('.institution-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            hiddenInput.value = institution.id;
        });

        container.appendChild(btn);
    });
}

/**
 * Coleta os dados do formulário e a ID da instituição do campo hidden.
 */
function collectFormData(form) {
    const institutionId = document.getElementById('institution-id-hidden').value.trim(); 
    
    const donatorName = form.querySelector('#name').value.trim();
    const donatorEmail = form.querySelector('#email').value.trim();
    const donatorPhone = form.querySelector('#telefone').value.trim();
    const donatorCpf = form.querySelector('#cpf').value.trim();
    
    const date = form.querySelector('#data_doacao').value.trim(); 
    const valorInput = form.querySelector('#valor').value.trim();

    const pagamentoElement = form.querySelector('input[name="payment_option"]:checked');
    const typePayment = pagamentoElement ? pagamentoElement.value : null; 
    
    const amount = parseFloat(valorInput.replace(',', '.')); 

    return {
        institutionId: institutionId, 
        donatorName: donatorName,
        donatorEmail: donatorEmail,
        donatorPhone: donatorPhone,
        donatorCpf: donatorCpf,
        amount: amount, 
        date: date, 
        typePayment: typePayment
    };
}

/**
 * Realiza uma validação básica dos dados antes de enviar.
 */
function validateData(data) {
    if (!data.donatorName || !data.donatorEmail || !data.date || !data.donatorPhone || !data.donatorCpf || !data.institutionId || !data.typePayment) {
        return false;
    }

    if (isNaN(data.amount) || data.amount <= 0) {
        return false;
    }
    
    return true;
}

/**
 * Envia a requisição POST para a API do NestJS (POST /donations).
 */
async function sendDonation(donationData) {
    const url = `${API_BASE_URL}${DONATIONS_ENDPOINT}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData)
    });

    if (!response.ok) {
        let errorDetails = '';
        try {
            const errorBody = await response.json();
            if (errorBody && errorBody.message) {
                errorDetails = 'Detalhes do servidor: ' + (Array.isArray(errorBody.message) ? errorBody.message.join(', ') : JSON.stringify(errorBody.message));
            }
        } catch (e) {
            // Ignora se o corpo da resposta não for JSON
        }
        
        const errorMessage = `Erro HTTP ${response.status} ao criar doação. ${errorDetails}`;
        throw new Error(errorMessage);
    }

    return response.json();
}