const supabaseCliente = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);
window.App = {
 profile:null,
 async requireAccess(admin=false) {
  const {data:{user},error} = await supabaseCliente.auth.getUser();
  if(error || !user){ location.replace('index.html'); throw new Error('Entre para continuar.'); }
  const {data,error:failure} = await supabaseCliente.from('perfis').select('*').eq('id',user.id).single();
  if(failure) throw new Error('Não foi possível verificar seu acesso. Tente novamente.');
  if(!data.ativo) throw new Error('Seu acesso aguarda liberação de um administrador.');
  if(admin && data.papel!=='admin'){ location.replace('precos.html'); throw new Error('Acesso restrito.'); }
  this.profile=data;
  document.querySelectorAll('[data-admin]').forEach(el=>{el.hidden=data.papel!=='admin';});
  document.querySelectorAll('[data-user]').forEach(el=>{el.textContent=data.nome||data.email;});
  return data;
 },
 message(text,error=false){const el=document.getElementById('status');if(el){el.textContent=text;el.classList.toggle('error',error);}}
};
document.querySelectorAll('[data-logout]').forEach(button=>button.addEventListener('click',async()=>{
 const {error}=await supabaseCliente.auth.signOut();
 if(error) return App.message('Não foi possível sair. Tente novamente.',true);
 location.replace('index.html');
}));
supabaseCliente.auth.onAuthStateChange(event=>{
 if(event==='SIGNED_OUT' && !location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) location.replace('index.html');
});
localStorage.removeItem('logado');localStorage.removeItem('usuario');sessionStorage.removeItem('sessionViva');
