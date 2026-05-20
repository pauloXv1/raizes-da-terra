const SUPABASE_URL = 'https://rpozdqemixvqfbjrtdpq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k8wBcxfvPGVpVq_kbEUtUA_xCnWHYZf';

const supabaseCliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentFilter = 'all';

class SalesDatabase {
    constructor() {
        this.sales = [];
        this.loadSales();
    }

    async loadSales() {
        try {
            const { data, error } = await supabaseCliente
                .from('vendas')
                .select('*')
                .order('data_venda', { ascending: false })
                .order('criado_em', { ascending: false });

            if (error) throw error;

            this.sales = data.map(sale => ({
                id: sale.id,
                date: sale.data_venda,
                dinheiro: parseFloat(sale.dinheiro),
                pix: parseFloat(sale.pix),
                cartao: parseFloat(sale.cartao),
                total: parseFloat(sale.total),
                gastos: parseFloat(sale.gastos) || 0,
                liquido: parseFloat(sale.total) - (parseFloat(sale.gastos) || 0)
            }));

            this.render();
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            showAlert('Erro ao carregar vendas', 'error');
        }
    }

    async saveSale(sale) {
        try {
            const { error } = await supabaseCliente
                .from('vendas')
                .insert([{
                    data_venda: sale.date,
                    dinheiro: sale.dinheiro,
                    pix: sale.pix,
                    cartao: sale.cartao,
                    total: sale.total,
                    gastos: sale.gastos
                }]);

            if (error) throw error;

            await this.loadSales();
            return true;
        } catch (error) {
            console.error('Erro ao salvar venda:', error);
            throw error;
        }
    }

    async deleteSale(id) {
        try {
            const { error } = await supabaseCliente
                .from('vendas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadSales();
            return true;
        } catch (error) {
            console.error('Erro ao deletar venda:', error);
            throw error;
        }
    }

    getSales() {
        return this.sales;
    }

    getFilteredSales() {
        const now = new Date();

        if (currentFilter === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            return this.sales.filter(sale => {
                const saleDate = new Date(sale.date + 'T00:00:00');
                return saleDate >= startOfWeek;
            });
        } else if (currentFilter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            return this.sales.filter(sale => {
                const saleDate = new Date(sale.date + 'T00:00:00');
                return saleDate >= startOfMonth;
            });
        }

        return this.sales;
    }

    render() {
        const filteredSales = this.getFilteredSales();
        renderHistory(filteredSales);
        updateStats(filteredSales);
    }
}

const db = new SalesDatabase();

function filterAll() {
    currentFilter = 'all';
    updateFilterButtons();
    db.render();
}

function filterWeek() {
    currentFilter = 'week';
    updateFilterButtons();
    db.render();
}

function filterMonth() {
    currentFilter = 'month';
    updateFilterButtons();
    db.render();
}

function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.filter-btn');
    if (currentFilter === 'all') {
        buttons[0].classList.add('active');
    } else if (currentFilter === 'week') {
        buttons[1].classList.add('active');
    } else if (currentFilter === 'month') {
        buttons[2].classList.add('active');
    }
}

function updateStats(sales) {
    const totalBruto = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalGastos = sales.reduce((sum, sale) => sum + sale.gastos, 0);
    const totalLiquido = totalBruto - totalGastos;
    const count = sales.length;
    const average = count > 0 ? totalLiquido / count : 0;

    document.getElementById('statTotal').textContent = formatCurrency(totalBruto);
    document.getElementById('statGastos').textContent = formatCurrency(totalGastos);
    document.getElementById('statLiquido').textContent = formatCurrency(totalLiquido);
    document.getElementById('statCount').textContent = count;
    document.getElementById('statAverage').textContent = formatCurrency(average);
}

function updateSummary() {
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const pix = parseFloat(document.getElementById('pix').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;
    const gastos = parseFloat(document.getElementById('gastos').value) || 0;

    const total = dinheiro + pix + cartao;
    const liquido = total - gastos;

    document.getElementById('summaryDinheiro').textContent = formatCurrency(dinheiro);
    document.getElementById('summaryPix').textContent = formatCurrency(pix);
    document.getElementById('summaryCartao').textContent = formatCurrency(cartao);
    document.getElementById('summaryGastos').textContent = formatCurrency(gastos);
    document.getElementById('summaryTotal').textContent = formatCurrency(total);
    document.getElementById('summaryLiquido').textContent = formatCurrency(liquido);
}

function renderHistory(sales) {
    const container = document.getElementById('historyContainer');

    if (sales.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma venda registrada neste período</div>';
        return;
    }

    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Dinheiro</th>
                    <th>PIX</th>
                    <th>Cartão</th>
                    <th>Total Bruto</th>
                    <th>Gastos</th>
                    <th>Total Líquido</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
    `;

    sales.forEach(sale => {
        html += `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>${formatCurrency(sale.dinheiro)}</td>
                <td>${formatCurrency(sale.pix)}</td>
                <td>${formatCurrency(sale.cartao)}</td>
                <td>${formatCurrency(sale.total)}</td>
                <td style="color: #e53e3e;">${formatCurrency(sale.gastos)}</td>
                <td><strong style="color: #276749;">${formatCurrency(sale.liquido)}</strong></td>
                <td>
                    <button class="delete-btn" onclick="deleteSale(${sale.id})">
                        🗑️ Excluir
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

async function deleteSale(id) {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    try {
        await db.deleteSale(id);
        showAlert('Venda excluída com sucesso!', 'success');
    } catch (error) {
        showAlert('Erro ao excluir venda', 'error');
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');

    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    container.innerHTML = '';
    container.appendChild(alert);

    setTimeout(() => alert.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saleDate').valueAsDate = new Date();

    ['dinheiro', 'pix', 'cartao', 'gastos'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateSummary);
    });

    document.getElementById('salesForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const sale = {
            date: document.getElementById('saleDate').value,
            dinheiro: parseFloat(document.getElementById('dinheiro').value) || 0,
            pix: parseFloat(document.getElementById('pix').value) || 0,
            cartao: parseFloat(document.getElementById('cartao').value) || 0,
            gastos: parseFloat(document.getElementById('gastos').value) || 0
        };

        sale.total = sale.dinheiro + sale.pix + sale.cartao;

        try {
            await db.saveSale(sale);
            showAlert('Venda registrada com sucesso!', 'success');

            document.getElementById('dinheiro').value = '';
            document.getElementById('pix').value = '';
            document.getElementById('cartao').value = '';
            document.getElementById('gastos').value = '';
            updateSummary();
        } catch (error) {
            console.error(error);
            showAlert(error.message || 'Erro ao salvar venda', 'error');
        }
    });

    updateSummary();
});

function enviarResumoWhatsApp() {
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const pix = parseFloat(document.getElementById('pix').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;
    const gastos = parseFloat(document.getElementById('gastos').value) || 0;

    const total = dinheiro + pix + cartao;
    const liquido = total - gastos;

    const hoje = new Date().toLocaleDateString('pt-BR');
    const usuario = sessionStorage.getItem('usuario') || 'Desconhecido';

    const mensagem = `
📊 *Resumo de Vendas*
📅 ${hoje}
👤 Usuário: ${usuario}
💰 Dinheiro: ${formatCurrency(dinheiro)}
📲 Pix: ${formatCurrency(pix)}
💳 Cartão: ${formatCurrency(cartao)}
💸 Gastos/Descontos: ${formatCurrency(gastos)}
✅ *Total Bruto:* ${formatCurrency(total)}
🟢 *Total Líquido:* ${formatCurrency(liquido)}
    `;

    const texto = encodeURIComponent(mensagem);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
}

if ("serviceWorker" in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register("/service-worker.js")
            .then((registration) => {
                console.log("SW registrado com sucesso:", registration.scope);
            })
            .catch((err) => {
                console.log("Erro ao registrar SW:", err);
            });
    });
}