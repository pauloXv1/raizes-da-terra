const SUPABASE_URL = 'https://rpozdqemixvqfbjrtdpq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k8wBcxfvPGVpVq_kbEUtUA_xCnWHYZf';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class SalesDatabase {
    constructor() {
        this.sales = [];
        this.loadSales();
    }

    async loadSales() {
        try {
            const { data, error } = await supabase
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
                total: parseFloat(sale.total)
            }));

            this.render();
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            showAlert('Erro ao carregar vendas', 'error');
        }
    }

    async saveSale(sale) {
        try {
            const { data, error } = await supabase
                .from('vendas')
                .insert([
                    {
                        data_venda: sale.date,
                        dinheiro: sale.dinheiro,
                        pix: sale.pix,
                        cartao: sale.cartao,
                        total: sale.total
                    }
                ])
                .select();

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
            const { error } = await supabase
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

    render() {
        renderHistory(this.getSales());
    }
}

const db = new SalesDatabase();

document.getElementById('saleDate').valueAsDate = new Date();

function updateSummary() {
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const pix = parseFloat(document.getElementById('pix').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;
    const total = dinheiro + pix + cartao;

    document.getElementById('summaryDinheiro').textContent = formatCurrency(dinheiro);
    document.getElementById('summaryPix').textContent = formatCurrency(pix);
    document.getElementById('summaryCartao').textContent = formatCurrency(cartao);
    document.getElementById('summaryTotal').textContent = formatCurrency(total);
}

['dinheiro', 'pix', 'cartao'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateSummary);
});

document.getElementById('salesForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const sale = {
        date: document.getElementById('saleDate').value,
        dinheiro: parseFloat(document.getElementById('dinheiro').value) || 0,
        pix: parseFloat(document.getElementById('pix').value) || 0,
        cartao: parseFloat(document.getElementById('cartao').value) || 0
    };

    sale.total = sale.dinheiro + sale.pix + sale.cartao;

    try {
        await db.saveSale(sale);
        showAlert('Venda registrada com sucesso!', 'success');

        document.getElementById('dinheiro').value = '';
        document.getElementById('pix').value = '';
        document.getElementById('cartao').value = '';
        updateSummary();
    } catch (error) {
        showAlert('Erro ao salvar venda. Tente novamente.', 'error');
    }
});

function renderHistory(sales) {
    const container = document.getElementById('historyContainer');
    
    if (sales.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma venda registrada ainda</div>';
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
                    <th>Total</th>
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
                <td><strong>${formatCurrency(sale.total)}</strong></td>
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
    if (confirm('Tem certeza que deseja excluir esta venda?')) {
        try {
            await db.deleteSale(id);
            showAlert('Venda excluída com sucesso!', 'success');
        } catch (error) {
            showAlert('Erro ao excluir venda. Tente novamente.', 'error');
        }
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

    setTimeout(() => {
        alert.remove();
    }, 3000);
}