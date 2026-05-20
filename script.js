// Memória do Sistema (Salva tudo no navegador)
let filaProducao = JSON.parse(localStorage.getItem("filaProducao")) || [];
let historicoProducao = JSON.parse(localStorage.getItem("historicoProducao")) || [];
let dadosAtuais = JSON.parse(localStorage.getItem("dadosAtuais")) || null;

window.onload = function() {
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);
    
    // Executa a limpeza automática de 24 horas ao iniciar a página
    limparHistoricoAntigoAutonomo();
    
    renderizarFila();
    renderizarHistorico();
    
    if (dadosAtuais) {
        document.getElementById("areaContador").style.display = "block";
        atualizarDisplay();
    }
};

// --- FUNÇÕES DA PROGRAMAÇÃO / FILA ---
function adicionarAProgramacao() {
    const produto = document.getElementById("produtoKits").value;
    const qtd = parseInt(document.getElementById("qtdTotalKits").value);
    
    if (isNaN(qtd) || qtd <= 0) {
        alert("Digite uma quantidade de kits válida.");
        return;
    }
    
    filaProducao.push({ produto: produto, total: qtd });
    localStorage.setItem("filaProducao", JSON.stringify(filaProducao));
    
    document.getElementById("qtdTotalKits").value = "";
    renderizarFila();
}

function renderizarFila() {
    const lista = document.getElementById("itensFila");
    const containerVisual = document.getElementById("listaProgramacaoVisual");
    lista.innerHTML = "";
    
    if (filaProducao.length === 0) {
        containerVisual.style.display = "none";
        return;
    }
    
    containerVisual.style.display = "block";
    filaProducao.forEach((item, index) => {
        lista.innerHTML += `<li><strong>${item.produto}</strong>: ${item.total} massas</li>`;
    });
}

function iniciarProximoDaFila() {
    if (dadosAtuais && dadosAtuais.produzidos < dadosAtuais.total) {
        if (!confirm("Existe uma produção em andamento. Deseja pará-la para iniciar a próxima?")) return;
    }
    
    if (filaProducao.length === 0) {
        alert("Nenhum produto na fila de programação para iniciar!");
        return;
    }
    
    // Pega o primeiro item da lista da programação
    const proximo = filaProducao.shift();
    localStorage.setItem("filaProducao", JSON.stringify(filaProducao));
    renderizarFila();
    
    const agora = new Date();
    dadosAtuais = {
        produto: proximo.produto,
        total: proximo.total,
        produzidos: 0,
        horaInicio: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestampInicio: agora.getTime()
    };
    
    localStorage.setItem("dadosAtuais", JSON.stringify(dadosAtuais));
    document.getElementById("areaContador").style.display = "block";
    atualizarDisplay();
}

// --- CONTROLE DE ABATIMENTO ---
function abaterKit() {
    if (!dadosAtuais) return;

    if (dadosAtuais.produzidos < dadosAtuais.total) {
        dadosAtuais.produzidos++;
        localStorage.setItem("dadosAtuais", JSON.stringify(dadosAtuais));
        atualizarDisplay();
        
        // Verifica se finalizou a quantidade da masseira
        if (dadosAtuais.produzidos === dadosAtuais.total) {
            finalizarProducaoAtual(false); // Finalizou normal (100%)
        }
    }
}

// ATUALIZADO: Cálculo de tempo inteligente com base no tipo de produto
function atualizarDisplay() {
    if (!dadosAtuais) return;
    document.getElementById("nomeProdutoAtual").innerText = dadosAtuais.produto;
    document.getElementById("horaInicioAtual").innerText = dadosAtuais.horaInicio;
    document.getElementById("progressoAtual").innerText = dadosAtuais.produzidos;
    document.getElementById("progressoTotal").innerText = dadosAtuais.total;

    // 1. Tabela de tempos pré-definidos por produto (em minutos)
    const temposPorProduto = {
        "PP": 10,
        "PI": 8,
        "Artesano Original": 6,
        "Artesano Chapa": 6,
        "Artesano Brioche": 6,
        "Artesano Integral": 6
    };

    // 2. Identifica o tempo do produto atual. Se não achar na lista exata, adota 6 min como padrão.
    const produtoNome = dadosAtuais.produto;
    const minutosPorMassa = temposPorProduto[produtoNome] || 6; 

    // 3. Faz o cálculo do tempo restante
    const kitsRestantes = dadosAtuais.total - dadosAtuais.produzidos;
    const tempoRestanteMs = kitsRestantes * minutosPorMassa * 60 * 1000;
    
    // 4. Calcula o horário real do relógio para a projeção de encerramento
    const dataEstimada = new Date(new Date().getTime() + tempoRestanteMs);
    const horaEstimada = dataEstimada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const elPrevisao = document.getElementById("previsaoTermino");
    if (elPrevisao) {
        if (kitsRestantes > 0) {
            elPrevisao.innerText = `Previsão de Término: ${horaEstimada} (${kitsRestantes * minutosPorMassa} min)`;
        } else {
            elPrevisao.innerText = "";
        }
    }
}

// NOVO: Função chamada pelo botão manual de interrupção na tela
function interromperEEncerrarManual() {
    if (!dadosAtuais) return;
    
    if (confirm(`Deseja encerrar o produto ${dadosAtuais.produto} agora com apenas ${dadosAtuais.produzidos} kits feitos?`)) {
        finalizarProducaoAtual(true); // Indica que foi cortado antes do final
    }
}

// ATUALIZADO: Salva o status correto do kit dependendo de como terminou
function finalizarProducaoAtual(foiInterrompido = false) {
    const agora = new Date();
    const horaFim = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Define o texto que aparecerá na coluna de quantidade do histórico
    let statusTexto = `${dadosAtuais.total} Kts`;
    if (foiInterrompido) {
        statusTexto = `${dadosAtuais.produzidos}/${dadosAtuais.total} Kts (Encerrado)`;
    }

    // Cria o registro para o histórico
    const registro = {
        produto: dadosAtuais.produto,
        total: statusTexto,
        horaInicio: dadosAtuais.horaInicio,
        horaFim: horaFim,
        timestampFim: agora.getTime() // usado para calcular as 24h depois
    };
    
    historicoProducao.unshift(registro); // Adiciona no início da lista
    localStorage.setItem("historicoProducao", JSON.stringify(historicoProducao));
    
    // Força atualização local caso a tela da TV precise sincronizar o encerramento imediato
    localStorage.setItem("dadosAtuais", JSON.stringify(dadosAtuais)); 
    
    renderizarHistorico();
    
    // Limpa a produção atual dos blocos ativos
    dadosAtuais = null;
    localStorage.removeItem("dadosAtuais");
    document.getElementById("areaContador").style.display = "none";

    // Pergunta se deseja puxar o próximo da lista automaticamente
    setTimeout(() => {
        if (filaProducao.length > 0) {
            if (confirm("Massa concluída/atualizada! Deseja iniciar o próximo produto da programação agora?")) {
                iniciarProximoDaFila();
            }
        } else {
            alert("Programação atualizada com sucesso.");
        }
    }, 500);
}

// --- HISTÓRICO E LIMPEZA AUTOMÁTICA (24 HORAS) ---
function renderizarHistorico() {
    const divHist = document.getElementById("listaHistorico");
    if (historicoProducao.length === 0) {
        divHist.innerHTML = "<i>Nenhum produto finalizado nas últimas 24h.</i>";
        return;
    }
    
    divHist.innerHTML = "";
    historicoProducao.forEach(item => {
        // Aplica uma cor de aviso (laranja escuro/marrom) se o item foi encerrado antes da meta
        const estiloEstilizado = item.total.includes("Encerrado") ? "color: #b37400; font-style: italic;" : "";
        
        divHist.innerHTML += `<div style="padding: 3px 0; border-bottom: 1px solid #ccc; ${estiloEstilizado}">
            ✓ <b>${item.produto}</b> (${item.total}) | 🕒 ${item.horaInicio} às ${item.horaFim}
        </div>`;
    });
}

function limparHistoricoAntigoAutonomo() {
    const agora = new Date().getTime();
    const vinteQuatroHorasEmMs = 24 * 60 * 60 * 1000;
    
    // Filtra mantendo apenas registros com menos de 24h baseados no timestampFim
    historicoProducao = historicoProducao.filter(item => (agora - item.timestampFim) < vinteQuatroHorasEmMs);
    localStorage.setItem("historicoProducao", JSON.stringify(historicoProducao));
    renderizarHistorico();
}

function limparHistoricoManualmente() {
    if (confirm("Tem certeza que quer apagar o histórico?")) {
        historicoProducao = [];
        localStorage.setItem("historicoProducao", JSON.stringify(historicoProducao));
        renderizarHistorico();
    }
}

function zerarTudoComHistorio() {
    if (confirm("Isso apagará toda a Fila, Histórico e Produção ativa. Confirma?")) {
        localStorage.clear();
        filaProducao = [];
        historicoProducao = [];
        dadosAtuais = null;
        document.getElementById("areaContador").style.display = "none";
        document.getElementById("listaProgramacaoVisual").style.display = "none";
        renderizarFila();
        renderizarHistorico();
    }
}

// Abre a TV
function abrirPainelTV() {
    window.open("tv.html", "_blank");
}

// Atalho do Espaço
document.addEventListener("keydown", function(e) {
    if ((e.code === "Space" || e.key === "Enter") && dadosAtuais) {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;
        e.preventDefault(); 
        abaterKit();
    }
});

// Relógio Padrão
function atualizarRelogio() {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR');
    if(document.getElementById("horaEsquerda")) document.getElementById("horaEsquerda").innerText = horaFormatada;
    if(document.getElementById("horaDireita")) document.getElementById("horaDireita").innerText = horaFormatada;
    const d = agora.getDate().toString().padStart(2, '0');
    const m = (agora.getMonth() + 1).toString().padStart(2, '0');
    if(document.getElementById("dataHojeCompacta")) document.getElementById("dataHojeCompacta").innerText = `${d}/${m}`;
    if(document.getElementById("dataAtual")) document.getElementById("dataAtual").innerText = agora.toLocaleDateString('pt-BR');
}

const toggleBtn = document.getElementById("toggleDarkMode");
if(toggleBtn) { toggleBtn.addEventListener("click", () => { document.body.classList.toggle("dark-mode"); }); }

// --- REGISTRO DO SERVICE WORKER (Para funcionar como Aplicativo/PWA) ---
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(reg => console.log("Masseira PWA: Service Worker registrado com sucesso!", reg))
            .catch(err => console.log("Masseira PWA: Erro ao registrar o Service Worker:", err));
    });
}