(function () {
  const dropZone     = document.getElementById('drop-zone');
  const fileInput    = document.getElementById('file-input');
  const browseBtn    = document.getElementById('drop-browse');
  const fileListEl   = document.getElementById('upload-file-list');
  const fileItemsCtr = document.getElementById('file-items-container');
 
  if (!dropZone) return; 
  // config
  const MAX_SIZE_MB   = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ALLOWED_EXT   = ['.pdf', '.doc', '.docx'];
 
  // uploaded files store (in-memory)
  // each entry has the following { id, name, size, status: 'uploading'|'done'|'error' }
  const uploadedFiles = [];

  // browse button 
  browseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
  });
 
  dropZone.addEventListener('click', (e) => {
    // only trigger if clicking the drop zone itself (not the browse button)
    if (e.target === browseBtn) return;
    fileInput.click();
  });
 
  // allow re-selecting same file
  fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = ''; 
  });

  // drag and drop
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
 
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
 
  dropZone.addEventListener('dragleave', (e) => {
    // only remove if leaving the drop zone entirely
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('dragover');
    }
  });
 
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });

  // handle files 
  function handleFiles(files) {
    files.forEach(file => {
      const validation = validateFile(file);
      if (!validation.ok) {
        showToast(validation.message, 'error');
        return;
      }
      addFileToList(file);
    });
  }

  // validation  (client-side)
  function validateFile(file) {
    // check file type
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return {
        ok: false,
        message: `"${file.name}" is not supported. Please upload PDF, DOC, or DOCX files.`
      };
    }
 
    // check file size
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return {
        ok: false,
        message: `"${file.name}" is ${sizeMB}MB — maximum file size is ${MAX_SIZE_MB}MB.`
      };
    }
 
    // check for duplicates
    if (uploadedFiles.find(f => f.name === file.name)) {
      return {
        ok: false,
        message: `"${file.name}" has already been uploaded.`
      };
    }
    return { ok: true };
  }

  // add file to list and upload
  function addFileToList(file) {
    const id = 'file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const entry = { id, name: file.name, size: file.size, status: 'uploading', file };
    uploadedFiles.push(entry);
 
    // show file list section
    fileListEl.classList.remove('hidden');
 
    renderFileItem(entry);
    uploadFile(entry);
  }
 
  function renderFileItem(entry) {
    const el = document.createElement('div');
    el.className = 'file-item';
    el.id = entry.id;
    el.innerHTML = fileItemHTML(entry);
    fileItemsCtr.prepend(el);
 
    // remove button
    el.querySelector('.file-remove').addEventListener('click', () => removeFile(entry.id));
  }
 
  function fileItemHTML(entry) {
    const sizeLabel = formatBytes(entry.size);
    const statusHTML = entry.status === 'uploading'
      ? `<span class="file-status-uploading">Uploading…</span>`
      : entry.status === 'done'
        ? `<div class="file-status-ok">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="20 6 9 17 4 12"/>
             </svg>
           </div>`
        : `<span style="color:var(--red-text);font-size:11px;font-weight:600;">Failed</span>`;
 
    return `
      <div class="file-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div class="file-item-body">
        <p class="file-name">${escapeHtml(entry.name)}</p>
        <p class="file-size">${sizeLabel}</p>
      </div>
      ${statusHTML}
      <button class="file-remove" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
  }
 
  function updateFileStatus(id, status) {
    const entry = uploadedFiles.find(f => f.id === id);
    if (!entry) return;
    entry.status = status;
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = fileItemHTML(entry);
      el.querySelector('.file-remove').addEventListener('click', () => removeFile(id));
    }
  }
 
  // upload API call
  async function uploadFile(entry) {
  try {
    const formData = new FormData();
    formData.append('file', entry.file);

    const res = await fetch('/api/upload-page', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Upload failed');

    updateFileStatus(entry.id, 'done');
    showToast('"' + entry.name + '" uploaded successfully');

  } catch (err) {
    updateFileStatus(entry.id, 'error');
    showToast('Upload failed: ' + (err.message || 'Unknown error'), 'error');
    console.error('[upload.js] Upload error:', err);
  }
  }

  // remove file 
  function removeFile(id) {
    const idx = uploadedFiles.findIndex(f => f.id === id);
    if (idx > -1) uploadedFiles.splice(idx, 1);
 
    const el = document.getElementById(id);
    if (el) el.remove();
 
    if (uploadedFiles.length === 0) {
      fileListEl.classList.add('hidden');
    }
 
    showToast('File removed');
  }
 
  // utilities
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }
 
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
 
  window.UploadModule = { handleFiles };
 
})();