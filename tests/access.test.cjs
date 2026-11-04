const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function context(user, profile, failure = null) {
    const redirects = [];
    const client = {
        auth: { getUser: async () => ({ data: { user }, error: null }), onAuthStateChange() {} },
        from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: profile, error: failure }) }) }) })
    };
    const sandbox = { APP_CONFIG: {}, window: { supabase: { createClient: () => client } },
        document: { querySelectorAll: () => [] }, location: { replace: url => redirects.push(url) },
        localStorage: { removeItem() {} }, sessionStorage: { removeItem() {} } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/auth.js'), 'utf8'), sandbox);
    return { app: sandbox.window.App, redirects };
}
test('visitante é redirecionado para o login', async () => {
    const { app, redirects } = context(null);
    await assert.rejects(app.requireAccess());
    assert.deepEqual(redirects, ['index.html']);
});
test('conta bloqueada não ganha acesso', async () => {
    const { app } = context({ id: '1' }, { ativo: false, papel: 'admin' });
    await assert.rejects(app.requireAccess());
    assert.equal(app.profile, null);
});
test('leitor não entra na administração', async () => {
    const { app, redirects } = context({ id: '1' }, { ativo: true, papel: 'leitor' });
    await assert.rejects(app.requireAccess(true));
    assert.deepEqual(redirects, ['precos.html']);
});
test('administrador ativo entra e falhas de consulta negam acesso', async () => {
    const profile = { ativo: true, papel: 'admin' };
    assert.equal(await context({ id: '1' }, profile).app.requireAccess(true), profile);
    await assert.rejects(context({ id: '1' }, null, { message: 'offline' }).app.requireAccess());
});
test('referências locais de todas as páginas e ícones existem', () => {
    for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
        const html = fs.readFileSync(path.join(root, file), 'utf8');
        for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
            if (/^https?:/.test(match[1])) continue;
            assert.ok(fs.existsSync(path.join(root, match[1])), file + ': ' + match[1]);
        }
    }
    for (const icon of JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).icons) {
        assert.ok(fs.existsSync(path.join(root, icon.src.replace(/^\//, ''))));
    }
});
