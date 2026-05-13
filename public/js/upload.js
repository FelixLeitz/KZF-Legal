// upload.js file 
// responsibilities: handles document uploads within chat sessions, opens file picker, validates files, upload to backend,
// displays progress and upload status, formates file size, provides upload doc ID's to chat.js

(function () {

  // dom refs 
  const fileInput     = document.getElementById('chat-file-input');
  const attachBtn     = document.getElementById('btn-attach');
  const attachPanel   = document.getElementById('attachment-panel');
  const progressRow   = document.getElementById('attach-progress-row');
  const progressFill  = document.getElementById('attach-progress-fill');
  const progressLabel = document.getElementById('attach-progress-label');
  const attachFilename= document.getElementById('attach-filename');
  const chipsRow      = document.getElementById('attach-chips-row');

  // stop script if upload UI elements do not exist
  if (!fileInput || !attachBtn) return;

  // maximum allowed upload file size
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  // supported document file types
  const ALLOWED_EXT = ['.pdf', '.doc', '.docx'];

  // temporarily stores uploaded documents attached to current chat
  let pendingDocuments = [];

  // opens native file picker when attachment button is clicked
  attachBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
      fileInput.value = '';
    }
  });

  // validates file type and size before upload
  function validateFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!ALLOWED_EXT.includes(ext)) {
      return { ok: false, message: 'Only PDF, DOC, DOCX allowed.' };
    }

    if (file.size > MAX_SIZE_BYTES) {
      return { ok: false, message: 'File too large (max 10MB).' };
    }

    return { ok: true };
  }

  // processes selected file after validation
  function handleFile(file) {
    const check = validateFile(file);
    if (!check.ok) return showToast(check.message, 'error');

    uploadFile(file);
  }

  // uploads selected document to backend API
  async function uploadFile(file) {

    showProgress(file.name);

    try {
      // create multipart form data for file upload
      const form = new FormData();
      form.append('document', file);

      if (state.currentSessionId) {
        form.append('chatId', state.currentSessionId);
      }

      // visually update upload progress bar during upload
      animateProgress(70);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + state.token },
        body: form
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || 'Upload failed');

      const { documentId, chatId } = json.data;

      if (chatId && !state.currentSessionId) {
        state.currentSessionId = chatId;
      }

      animateProgress(100);
      setLabel('Processing…');

      // store uploaded document metadata for chat usage
      pendingDocuments.push({
        documentId,
        filename: file.name,
        size: file.size
      });

      setTimeout(() => {
        hideProgress();
        addChip(file.name, file.size, documentId);
        showToast('Uploaded: ' + file.name);
      }, 500);

    } catch (err) {
      hideProgress();
      showToast(err.message || 'Upload failed', 'error');
    }
  }

  // UI 
  // displays upload progress UI and filename
  function showProgress(name) {
    if (!attachPanel || !progressRow) return;

    attachPanel.classList.add('active');
    progressRow.classList.remove('hidden');

    if (attachFilename) attachFilename.textContent = name;
    if (progressFill) progressFill.style.width = '0%';
    setLabel('Uploading…');
  }

  // hides upload progress UI after completion
  function hideProgress() {
    if (progressRow) progressRow.classList.add('hidden');

    if (chipsRow && chipsRow.children.length === 0) {
      attachPanel?.classList.remove('active');
    }
  }

  function setLabel(text) {
    if (progressLabel) progressLabel.textContent = text;
  }

  // updates progress bar width visually
  function animateProgress(target) {
    if (!progressFill) return;
    progressFill.style.width = target + '%';
  }

  // creates removable UI chip for uploaded document
  function addChip(name, size, id) {
    const chip = document.createElement('div');
    chip.className = 'attach-chip';
    chip.dataset.documentId = id;

    chip.innerHTML = `
      <span>${name}</span>
      <small>${format(size)}</small>
      <button class="remove">×</button>
    `;

    // removes uploaded document from UI and backend storage
    chip.querySelector('.remove').onclick = async () => {
      pendingDocuments = pendingDocuments.filter(d => d.documentId !== id);
      chip.remove();

      await fetch('/api/documents/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + state.token }
      });
    };

    chipsRow.appendChild(chip);
  }

  // converts file size into readable format (B, KB, MB)
  function format(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  // expose upload helper methods globally for chat.js usage
  window.UploadModule = {
    getDocumentIds: () => pendingDocuments.map(d => d.documentId),
    getAttachedFiles: () => [...pendingDocuments],
    clearAttachments: () => {
      pendingDocuments = [];
      chipsRow.innerHTML = '';
      attachPanel?.classList.remove('active');
    }
  };

})();