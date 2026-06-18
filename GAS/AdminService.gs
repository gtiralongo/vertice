// ==================== ADMIN AUTH ====================

function isAdmin() {
  try {
    ensureSheets();
    var userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) return false;
    var adminEmailsRaw = getConfig('admin_emails');
    var adminEmails = adminEmailsRaw ? JSON.parse(adminEmailsRaw) : [];
    if (!Array.isArray(adminEmails)) adminEmails = [];

    // Si la lista está vacía, el primer usuario en acceder se convierte en admin
    if (adminEmails.length === 0) {
      adminEmails.push(userEmail);
      setConfig('admin_emails', JSON.stringify(adminEmails));
      return true;
    }

    return adminEmails.indexOf(userEmail) !== -1;
  } catch (e) {
    return false;
  }
}

function getAdminEmails() {
  if (!isAdmin()) return [];
  var raw = getConfig('admin_emails');
  if (!raw) return [];
  return JSON.parse(raw);
}

function addAdminEmail(email) {
  if (!isAdmin()) return false;
  var raw = getConfig('admin_emails');
  var list = raw ? JSON.parse(raw) : [];
  if (list.indexOf(email) === -1) {
    list.push(email);
    setConfig('admin_emails', JSON.stringify(list));
  }
  return true;
}

function removeAdminEmail(email) {
  if (!isAdmin()) return false;
  var raw = getConfig('admin_emails');
  var list = raw ? JSON.parse(raw) : [];
  var idx = list.indexOf(email);
  if (idx !== -1) {
    list.splice(idx, 1);
    setConfig('admin_emails', JSON.stringify(list));
  }
  return true;
}

function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

// Ejecutar manualmente desde el editor de GAS para agregar el primer admin
function setupFirstAdmin(email) {
  ensureSheets();
  var raw = getConfig('admin_emails');
  var list = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(list)) list = [];
  if (list.indexOf(email) === -1) {
    list.push(email);
    setConfig('admin_emails', JSON.stringify(list));
  }
  return list;
}



// ==================== STORE CONFIG ====================

function getStoreConfig() {
  ensureSheets();
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Config');
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 0; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  return config;
}

function updateStoreConfig(data) {
  if (!isAdmin()) return false;
  for (var key in data) {
    setConfig(key, data[key]);
  }
  return true;
}
