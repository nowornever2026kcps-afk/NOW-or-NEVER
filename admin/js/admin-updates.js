export function initUpdates({ supabaseClient, $, sectionContent, adminToast, escapeHTML, loadOverview }) {
  let updates = []; 
  let editingId = null;

  const typeLabel = { announcement:'Announcement', feature:'Feature', important:'Important', maintenance:'Maintenance', event:'Event' };

  async function loadUpdates() {
    const { data, error } = await supabaseClient.rpc('admin_updates_list');
    if (error) throw error;
    updates = Array.isArray(data) ? data : [];
  }

  function formHTML(item = null) {
    const isEdit = !!item;
    return `<div class="updates-editor">
      <div class="updates-editor-head"><div><p class="eyebrow">${isEdit?'EDIT UPDATE':'NEW UPDATE'}</p><h4>${isEdit?'Edit announcement':'Publish an update'}</h4></div>${isEdit?'<button class="ghost-btn" type="button" id="cancelUpdateEdit">Cancel</button>':''}</div>
      <div class="updates-form-grid">
        <label>Title<input id="updTitle" maxlength="120" value="${escapeHTML(item?.title||'')}" placeholder="e.g. New NEET planner is live"></label>
        <label>Icon<input id="updIcon" maxlength="8" value="${escapeHTML(item?.icon||'📢')}" placeholder="📢"></label>
        <label>Type<select id="updType">${Object.entries(typeLabel).map(([k,v])=>`<option value="${k}" ${item?.update_type===k?'selected':''}>${v}</option>`).join('')}</select></label>
        <label class="check-row"><input id="updPinned" type="checkbox" ${item?.pinned?'checked':''}> Pin this update</label>
        <label class="check-row"><input id="updEnabled" type="checkbox" ${item?(item.enabled?'checked':''):'checked'}> Visible to students</label>
        <label class="check-row"><input id="updPublish" type="checkbox" ${item?(item.published_at?'checked':''):'checked'}> Published</label>
      </div>
      <label>Message<textarea id="updContent" maxlength="5000" rows="7" placeholder="Write the update students should see...">${escapeHTML(item?.content||'')}</textarea></label>
      <div class="updates-form-actions"><button class="primary-btn" type="button" id="saveUpdateBtn">${isEdit?'Save changes':'Publish update'}</button><span class="muted">${isEdit?'Changes are protected by server-side admin checks.':'You can keep it unpublished as a draft.'}</span></div>
    </div>`;
  }

  function listHTML() {
    if (!updates.length) return '<div class="updates-empty">No updates yet. Create your first announcement above.</div>';
    return `<div class="updates-list">${updates.map(u=>`<article class="admin-update-item ${u.enabled?'':'is-disabled'}">
      <div class="admin-update-icon">${escapeHTML(u.icon||'📢')}</div><div class="admin-update-main">
      <div class="admin-update-meta"><span class="update-type-badge">${escapeHTML(typeLabel[u.update_type]||u.update_type)}</span>${u.pinned?'<span class="update-pin">📌 Pinned</span>':''}${u.published_at?'<span>Published</span>':'<span>Draft</span>'}${!u.enabled?'<span>Hidden</span>':''}</div>
      <h4>${escapeHTML(u.title)}</h4><p>${escapeHTML(u.content).replaceAll('\n','<br>')}</p><small>${u.published_at?new Date(u.published_at).toLocaleString('en-IN'):'Not published'}</small></div>
      <div class="admin-update-actions"><button class="ghost-btn" type="button" data-edit-update="${u.id}">Edit</button><button class="danger-btn" type="button" data-delete-update="${u.id}">Delete</button></div>
    </article>`).join('')}</div>`;
  }

  async function renderUpdates() {
    try { await loadUpdates(); sectionContent.innerHTML=`<div class="section-heading"><p class="eyebrow">ADMIN MODULE</p><h3>📢 Updates</h3><p class="muted">Create and control announcements shown to students.</p></div>${formHTML()}${listHTML()}`; bind(); }
    catch(error){ console.error('Updates load failed:',error); sectionContent.innerHTML='<div class="section-heading"><h3>📢 Updates</h3><p class="muted">Unable to load updates.</p></div>'; adminToast(error.message||'Unable to load updates'); }
  }

  function bind() {
    $('saveUpdateBtn')?.addEventListener('click',saveUpdate);
    $('cancelUpdateEdit')?.addEventListener('click',()=>{editingId=null;renderUpdates();});
    sectionContent.querySelectorAll('[data-edit-update]').forEach(btn=>btn.addEventListener('click',()=>{ editingId=Number(btn.dataset.editUpdate); const item=updates.find(x=>Number(x.id)===editingId); sectionContent.innerHTML=`<div class="section-heading"><p class="eyebrow">ADMIN MODULE</p><h3>📢 Updates</h3></div>${formHTML(item)}${listHTML()}`; bind(); $('updTitle')?.focus(); }));
    sectionContent.querySelectorAll('[data-delete-update]').forEach(btn=>btn.addEventListener('click',()=>deleteUpdate(Number(btn.dataset.deleteUpdate))));
  }

  async function saveUpdate() {
    const title=$('updTitle')?.value.trim(), content=$('updContent')?.value.trim();
    if(!title||!content){adminToast('Title and message are required.');return;}
    const wasEditing=!!editingId;
    const args={p_title:title,p_content:content,p_update_type:$('updType')?.value||'announcement',p_icon:$('updIcon')?.value.trim()||'📢',p_pinned:$('updPinned')?.checked||false,p_enabled:$('updEnabled')?.checked??true,p_publish:$('updPublish')?.checked??true};
    try{
      const result=wasEditing?await supabaseClient.rpc('admin_updates_update',{p_id:editingId,...args}):await supabaseClient.rpc('admin_updates_create',args);
      if(result.error)throw result.error;
      editingId=null; adminToast(wasEditing?'Update saved.':'Update created.',true); await renderUpdates(); loadOverview?.();
    }catch(error){console.error('Update save failed:',error);adminToast(error.message||'Unable to save update');}
  }

  async function deleteUpdate(id){
    if(!confirm('Delete this update permanently?'))return;
    try{const {error}=await supabaseClient.rpc('admin_updates_delete',{p_id:id});if(error)throw error;adminToast('Update deleted.',true);await renderUpdates();loadOverview?.();}
    catch(error){console.error('Update delete failed:',error);adminToast(error.message||'Unable to delete update');}
  }

  return {renderUpdates,loadUpdates};
}
