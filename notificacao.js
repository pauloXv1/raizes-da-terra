const HORA_AVISO        = 14;  
const INTERVALO_HORAS   = 3;    
const CHAVE_VERIFICADO  = 'vendaRegistradaHoje'; 

async function iniciarNotificacoes() {
    if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações.');
        return;
    }

    if (Notification.permission === 'default') {
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') return;
    }

    if (Notification.permission === 'granted') {
        agendarNotificacaoDiaria();
    }
}

function agendarNotificacaoDiaria() {
    const agora     = new Date();
    const alvo      = new Date();

    alvo.setHours(HORA_AVISO, 0, 0, 0);

    if (agora >= alvo) {
        alvo.setDate(alvo.getDate() + 1);
    }

    const msAteAviso = alvo - agora;

    console.log(`⏰ Próximo aviso em: ${Math.round(msAteAviso / 60000)} minutos`);

    setTimeout(async () => {
        await verificarENotificar();

        // Depois do primeiro aviso, verifica a cada 3 horas
        const intervalo = setInterval(async () => {
            const jaRegistrou = await verificarVendaHoje();
            if (jaRegistrou) {
                clearInterval(intervalo);
                console.log('✅ Venda registrada. Notificações pausadas.');
            } else {
                enviarNotificacao(
                    '⏳ Rendimento ainda não registrado!',
                    'Não esqueça de registrar as vendas do dia no sistema.'
                );
            }
        }, INTERVALO_HORAS * 60 * 60 * 1000);

        agendarNotificacaoDiaria();

    }, msAteAviso);
}

async function verificarVendaHoje() {
    try {
        const hoje = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        const { data, error } = await supabaseCliente
            .from('vendas')
            .select('id')
            .eq('data_venda', hoje)
            .limit(1);

        if (error) throw error;

        return data && data.length > 0;
    } catch (err) {
        console.error('Erro ao verificar venda:', err);
        return false;
    }
}

async function verificarENotificar() {
    const jaRegistrou = await verificarVendaHoje();

    if (jaRegistrou) {
        enviarNotificacao(
            '✅ Tudo certo!',
            'O rendimento de hoje já foi registrado. Bom trabalho!'
        );
    } else {
        enviarNotificacao(
            '🌿 Raizes da Terra – Lembrete',
            'Está na hora de registrar o rendimento do dia! Acesse o sistema.'
        );
    }
}

function enviarNotificacao(titulo, corpo) {
    if (Notification.permission !== 'granted') return;

    const notificacao = new Notification(titulo, {
        body: corpo,
        icon: 'icon-central.png',
        badge: 'favicon-32.png',
        tag: 'lembrete-vendas',   
        renotify: true
    });

    notificacao.onclick = () => {
        window.focus();
        notificacao.close();
    };
}