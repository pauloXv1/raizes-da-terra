let checking = false;
async function loadHome() {
    if (checking) return;
    checking = true;
    const cards = document.getElementById('accessCards');
    cards.hidden = true;
    try {
        const profile = await App.getProfile();
        document.querySelector('[data-user]').textContent = profile.nome || profile.email;
        if (!profile.ativo) {
            App.profile = null;
            document.querySelectorAll('[data-admin]').forEach(el => { el.hidden = true; });
            App.message(profile.aprovado
                ? 'Seu acesso está bloqueado. Entre em contato com um administrador.'
                : 'Seu cadastro foi recebido! Aguardando aprovação de um administrador para visualizar Vendas e Preços.');
            return;
        }
        App.profile = profile;
        cards.hidden = false;
        document.querySelectorAll('[data-admin]').forEach(el => { el.hidden = profile.papel !== 'admin'; });
        App.message(profile.papel === 'admin'
            ? 'Escolha uma opção para consultar ou administrar o sistema.'
            : 'Acesso de visualização liberado. Escolha o que deseja consultar.');
    } catch (error) { App.message(error.message, true); }
    finally { checking = false; }
}
document.getElementById('checkAccess').addEventListener('click', loadHome);
loadHome();
const accessTimer = setInterval(() => { if (!document.hidden) loadHome(); }, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadHome(); });
window.addEventListener('pagehide', event => { if (!event.persisted) clearInterval(accessTimer); });
window.addEventListener('pageshow', event => { if (event.persisted) loadHome(); });
