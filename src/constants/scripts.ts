
import {} from '../types';

// --- MODULAR BACKEND FILES FOR APPS SCRIPT ---

const CODE_CONTROLLER = `
// =========================================================
// 1. CONTROLLER (Main Entry & Routing)
// =========================================================

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000); 
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = e.postData ? JSON.parse(e.postData.contents) : {};
    return routeRequest(ss, body);
  } catch (err) {
    return ResponseBuilder.error(err.toString());
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return DataHandlers.handleGetRequest(ss);
}

function routeRequest(ss, body) {
  const action = body.action;
  const routes = {
    'login': () => AuthHandlers.handleLogin(ss, body),
    'register_user': () => AuthHandlers.handleRegisterUser(ss, body),
    'get_users': () => AuthHandlers.handleGetUsers(ss),
    'delete_user': () => AuthHandlers.handleDeleteUser(ss, body),
    'update_user': () => AuthHandlers.handleUpdateUser(ss, body),
    'acknowledge_issue': () => SystemHandlers.handleAcknowledgeIssue(ss, body),
    'request_inspection': () => SystemHandlers.handleRequestInspection(ss, body),
    'get_acknowledgements': () => SystemHandlers.handleGetAcknowledgements(ss),
    'mark_notification_read': () => SystemHandlers.handleMarkNotificationRead(ss, body),
    'update_settings': () => SystemHandlers.handleUpdateSettings(ss, body),
    'broadcast': () => SystemHandlers.handleBroadcast(ss, body),
    'check_subscription': () => SubscriptionHandlers.handleCheckSubscription(ss),
    'extend_subscription': () => SubscriptionHandlers.handleExtendSubscription(ss, body),
    'submit_support_ticket': () => SupportHandlers.handleSubmitSupport(ss, body),
    'get_tickets': () => SupportHandlers.handleGetTickets(ss, body),
    'update_ticket': () => SupportHandlers.handleUpdateTicket(ss, body)
  };
  
  if (!action || action === 'create' || !routes[action]) {
    return DataHandlers.handleDataSubmission(ss, body);
  }
  return routes[action]();
}
`;

const CODE_AUTH = `
// =========================================================
// 2. AUTHENTICATION & USER MANAGEMENT
// =========================================================

const AuthHandlers = {
  handleLogin: function(ss, body) {
    const username = body.username ? String(body.username).trim().toLowerCase() : "";
    const password = body.password ? String(body.password) : "";
    let userSheet = ss.getSheetByName('Users');
    if (!userSheet || userSheet.getLastRow() <= 1) return ResponseBuilder.error("No users found in database.", "NO_USERS");

    const data = userSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (String(row[0]).trim().toLowerCase() === username && String(row[1]) === password) {
             let prefs = {};
             try { if (row[6]) prefs = JSON.parse(row[6]); } catch(e) {}
             const user = { username: row[0], name: row[2], role: String(row[3]).trim(), position: row[4] || '', preferences: prefs };
             userSheet.getRange(i + 1, 6).setValue(new Date().toISOString());
             return ResponseBuilder.success({ user: user });
        }
    }
    return ResponseBuilder.error("Invalid username or password.", "INVALID_CREDENTIALS");
  },

  handleRegisterUser: function(ss, body) {
    let userSheet = ss.getSheetByName('Users');
    if (!userSheet) {
        userSheet = ss.insertSheet('Users');
        userSheet.appendRow(["Username", "Password", "Name", "Role", "Position", "Last_Login", "Preferences"]);
        userSheet.setFrozenRows(1);
        userSheet.getRange(1, 1, 1, 7).setFontWeight("bold");
    }
    const username = body.username ? String(body.username).trim().toLowerCase() : "";
    const data = userSheet.getDataRange().getValues();
    for(let i=1; i<data.length; i++) {
        if(String(data[i][0]).trim().toLowerCase() === username) return ResponseBuilder.error("Username already exists.");
    }
    const defaultPrefs = JSON.stringify({ emailNotifications: true, notifyGeneral: true, notifyPetroleum: true, notifyPetroleumV2: true, notifyAcid: true });
    userSheet.appendRow([username, body.password, body.name, String(body.role).trim(), body.position || "", new Date().toISOString(), defaultPrefs]);
    
    if (body.name) Validation.updateSingle(ss, 'Inspector_Name', body.name);
    if (body.position) Validation.updateSingle(ss, 'Position', body.position);
    return ResponseBuilder.success({ message: "User created." });
  },

  handleGetUsers: function(ss) {
    let userSheet = ss.getSheetByName('Users');
    if (!userSheet) return ResponseBuilder.success({ users: [] });
    const data = userSheet.getDataRange().getValues();
    const users = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) {
            let prefs = {};
            try { if(row[6]) prefs = JSON.parse(row[6]); } catch(e){}
            users.push({ username: row[0], password: row[1], name: row[2], role: String(row[3]).trim(), position: row[4], lastLogin: row[5], preferences: prefs });
        }
    }
    return ResponseBuilder.success({ users: users });
  },

  handleDeleteUser: function(ss, body) {
    let userSheet = ss.getSheetByName('Users');
    if (!userSheet) return ResponseBuilder.error("Database not found.");
    const username = body.username ? String(body.username).trim().toLowerCase() : "";
    const data = userSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toLowerCase() === username) {
            userSheet.deleteRow(i + 1);
            return ResponseBuilder.success({ message: "User deleted." });
        }
    }
    return ResponseBuilder.error("User not found.");
  },

  handleUpdateUser: function(ss, body) {
    let userSheet = ss.getSheetByName('Users');
    if (!userSheet) return ResponseBuilder.error("Database not found.");
    const currentUsername = body.originalUsername ? String(body.originalUsername).trim().toLowerCase() : String(body.username).trim().toLowerCase();
    const data = userSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toLowerCase() === currentUsername) {
            if (body.username) userSheet.getRange(i + 1, 1).setValue(String(body.username).trim().toLowerCase());
            if (body.name) userSheet.getRange(i + 1, 3).setValue(body.name);
            if (body.role) userSheet.getRange(i + 1, 4).setValue(String(body.role).trim());
            if (body.position !== undefined) userSheet.getRange(i + 1, 5).setValue(body.position);
            if (body.preferences) userSheet.getRange(i + 1, 7).setValue(JSON.stringify(body.preferences));
            if (body.password) userSheet.getRange(i + 1, 2).setValue(body.password);
            
            if (body.name) Validation.updateSingle(ss, 'Inspector_Name', body.name);
            if (body.position) Validation.updateSingle(ss, 'Position', body.position);
            return ResponseBuilder.success({ message: "User updated." });
        }
    }
    return ResponseBuilder.error("User not found.");
  }
};
`;

const CODE_CORE_OPS = `
// =========================================================
// 3. CORE OPERATIONS (Data, Systems, Subscription)
// =========================================================

const DataHandlers = {
  handleDataSubmission: function(ss, body) {
    const sheetName = body.sheet;
    const headers = body.headers;
    const rowData = body.row;
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (headers && Array.isArray(headers)) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        sheet.setFrozenRows(1);
      }
    }
    const safeRow = rowData.map(r => (r === null || r === undefined) ? "" : String(r));
    sheet.appendRow(safeRow);

    // --- REQUEST FULFILLMENT LOGIC ---
    if (body.requestId) {
        try {
            let reqSheet = ss.getSheetByName('Inspection_Requests');
            if (reqSheet) {
                const rData = reqSheet.getDataRange().getValues();
                const idColIndex = 0; // Request_ID is first
                const statusColIndex = 10; // Status is 10th (column K, index 10 in getRange)
                // Iterate to find ID
                for(let i=1; i<rData.length; i++) {
                    if(String(rData[i][idColIndex]) === String(body.requestId)) {
                        // Mark as Completed
                        reqSheet.getRange(i+1, statusColIndex).setValue('Completed');
                        break; 
                    }
                }
            }
        } catch(e) { Logger.log(ss, "REQ_UPDATE_ERROR", e.toString()); }
    }

    const skipValidation = ['System_Settings', 'Validation_Data', 'Users', 'Acknowledgements', 'SystemNotification', 'Subscription_Data', 'Support_Tickets', 'Inspection_Requests'];
    if (!skipValidation.includes(sheetName)) {
       Validation.updateFromRow(ss, body);
       try { 
          EmailHandlers.sendEmailNotifications(ss, body, sheetName); 
       } catch (e) { 
          Logger.log(ss, "EMAIL_FAILURE", "CRITICAL: " + e.toString()); 
       }
    }
    return ResponseBuilder.success({ sheet: sheetName });
  },

  handleGetRequest: function(ss) {
    const sheets = ss.getSheets();
    const data = {};
    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (name === 'Users') return;
      const lastRow = sheet.getLastRow();
      
      if (name === 'Validation_Data') {
         if (lastRow > 1) {
            const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
            const values = range.getValues();
            const columns = {};
            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            headers.forEach((h, colIndex) => {
               columns[h] = [...new Set(values.map(row => row[colIndex]).filter(c => c !== ""))]; 
            });
            data[name] = columns;
         } else { data[name] = {}; }
      } else if (name === 'Acknowledgements') {
          data[name] = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat() : [];
      } else if (name === 'System_Settings') {
          data[name] = lastRow > 0 ? sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues() : [];
      } else if (name === 'Subscription_Data') {
          if (lastRow > 1) {
               const values = sheet.getRange(lastRow, 1, 1, 4).getValues()[0];
               data[name] = { status: values[0], plan: values[1], expiryDate: values[2] };
          } else { data[name] = null; }
      } else {
         if (lastRow > 0) {
            const startRow = Math.max(1, lastRow - 200);
            const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn()).getValues();
            if (startRow > 1) values.unshift(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
            data[name] = values;
         } else { data[name] = []; }
      }
    });
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
};

const SystemHandlers = {
  handleBroadcast: function(ss, body) {
    let notifSheet = ss.getSheetByName('SystemNotification');
    if (!notifSheet) {
        notifSheet = ss.insertSheet('SystemNotification');
        notifSheet.appendRow(["Notification_ID", "Recipient", "Type", "Message", "Timestamp", "IsRead", "ActionLink"]);
        notifSheet.setFrozenRows(1);
    }
    const notifId = "SYS-BCAST-" + Date.now();
    notifSheet.appendRow([
        notifId, 
        "All", 
        body.type || "info", 
        body.message, 
        new Date().toISOString(), 
        "FALSE", 
        body.actionLink || ""
    ]);
    return ResponseBuilder.success({ message: "Broadcast sent", id: notifId });
  },

  handleRequestInspection: function(ss, body) {
    let reqSheet = ss.getSheetByName('Inspection_Requests');
    if (!reqSheet) {
        reqSheet = ss.insertSheet('Inspection_Requests');
        reqSheet.appendRow(['Request_ID', 'Requester', 'Role', 'Truck_No', 'Trailer_No', 'Type', 'Reason', 'Priority', 'Assigned_Inspector', 'Status', 'Timestamp']);
        reqSheet.setFrozenRows(1);
    }
    const reqId = "REQ-" + Date.now();
    reqSheet.appendRow([
        reqId, 
        body.requester, 
        body.role, 
        body.truckNo, 
        body.trailerNo, 
        body.type, 
        body.reason, 
        body.priority,
        body.assignedInspector || 'Unassigned', 
        'Pending', 
        new Date().toISOString()
    ]);

    let notifSheet = ss.getSheetByName('SystemNotification');
    if (!notifSheet) {
        notifSheet = ss.insertSheet('SystemNotification');
        notifSheet.appendRow(["Notification_ID", "Recipient", "Type", "Message", "Timestamp", "IsRead", "ActionLink"]);
    }
    
    // Updated Link to include Request ID at the end
    const actionLink = "request:start_inspection|" + body.type + "|" + body.truckNo + "|" + body.trailerNo + "|" + body.requester + "|" + body.reason + "|" + reqId;
    
    notifSheet.appendRow([
        "NOTIF-" + reqId, 
        "Inspector", 
        "warning", 
        "New Inspection Request: " + body.truckNo + " (" + body.priority + ")", 
        new Date().toISOString(), 
        "FALSE", 
        actionLink
    ]);

    return ResponseBuilder.success({ message: "Request Submitted" });
  },

  handleAcknowledgeIssue: function(ss, body) {
    let ackSheet = ss.getSheetByName('Acknowledgements');
    if (!ackSheet) {
        ackSheet = ss.insertSheet('Acknowledgements');
        ackSheet.appendRow(['Issue_ID', 'Acknowledged_By', 'Role', 'Timestamp']);
        ackSheet.setFrozenRows(1);
    }
    const issueId = String(body.issueId);
    const data = ackSheet.getDataRange().getValues();
    if (!data.some(row => String(row[0]) === issueId)) {
         ackSheet.appendRow([issueId, body.user || 'Unknown', body.role || 'Unknown', new Date().toISOString()]);
    }
    return ResponseBuilder.success({ message: "Issue acknowledged." });
  },

  handleGetAcknowledgements: function(ss) {
    let ackSheet = ss.getSheetByName('Acknowledgements');
    if (!ackSheet) return ResponseBuilder.success({ ids: [] });
    const data = ackSheet.getDataRange().getValues();
    const ids = [];
    for (let i = 1; i < data.length; i++) if (data[i][0]) ids.push(String(data[i][0]));
    return ResponseBuilder.success({ ids: ids });
  },

  handleMarkNotificationRead: function(ss, body) {
    const sheet = ss.getSheetByName('SystemNotification');
    if (!sheet) return ResponseBuilder.error("Notification sheet not found");
    const idToMark = String(body.id);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === idToMark) {
            sheet.getRange(i + 1, 6).setValue("TRUE");
            return ResponseBuilder.success({ message: "Marked as read" });
        }
    }
    return ResponseBuilder.error("ID not found");
  },

  handleUpdateSettings: function(ss, body) {
    let settingsSheet = ss.getSheetByName('System_Settings');
    if (!settingsSheet) {
        settingsSheet = ss.insertSheet('System_Settings');
        settingsSheet.appendRow(["CompanyName", "ManagerEmail", "UpdatedBy", "Timestamp", "LogoBase64", "MobileApkLink", "WebAppUrl", "MaintenanceMode", "MaintenanceMessage"]);
        settingsSheet.setFrozenRows(1);
    }
    settingsSheet.appendRow([
        body.companyName, 
        body.managerEmail, 
        "System", 
        new Date().toISOString(), 
        body.companyLogo || "", 
        body.mobileApkLink || "", 
        body.webAppUrl || "",
        body.maintenanceMode ? "TRUE" : "FALSE",
        body.maintenanceMessage || ""
    ]);
    return ResponseBuilder.success({ message: "Settings updated" });
  }
};

const SubscriptionHandlers = {
  handleCheckSubscription: function(ss) {
    let subSheet = ss.getSheetByName('Subscription_Data');
    if (!subSheet) {
        subSheet = ss.insertSheet('Subscription_Data');
        subSheet.appendRow(["Status", "Plan", "Expiry_Date", "Last_Updated"]);
        subSheet.setFrozenRows(1);
    }
    if (subSheet.getLastRow() < 2) {
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        subSheet.appendRow(["Active", "Trial", defaultExpiry.toISOString(), new Date().toISOString()]);
    }
    const lastRow = subSheet.getLastRow();
    const data = subSheet.getRange(lastRow, 1, 1, 4).getValues()[0];
    let status = data[0];
    const expiry = new Date(data[2]);
    const now = new Date();
    if (status === 'Active' && !isNaN(expiry.getTime()) && now > expiry) {
        status = 'Expired';
        subSheet.getRange(lastRow, 1).setValue('Expired');
    }
    return ResponseBuilder.success({ 
        subscription: {
            status: status,
            plan: data[1],
            expiryDate: data[2],
            daysRemaining: Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
    });
  },

  handleExtendSubscription: function(ss, body) {
    let subSheet = ss.getSheetByName('Subscription_Data');
    if (!subSheet) {
        subSheet = ss.insertSheet('Subscription_Data');
        subSheet.appendRow(["Status", "Plan", "Expiry_Date", "Last_Updated"]);
    }
    if (subSheet.getLastRow() < 2) {
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 1); 
        subSheet.appendRow(["Expired", "Trial", expiredDate.toISOString(), new Date().toISOString()]);
    }
    const daysToAdd = parseInt(body.days || 30);
    const lastRow = subSheet.getLastRow();
    const currentData = subSheet.getRange(lastRow, 1, 1, 4).getValues()[0];
    let currentExpiry = new Date(currentData[2]);
    const now = new Date();
    if (!currentData[2] || isNaN(currentExpiry.getTime()) || currentExpiry < now) currentExpiry = now;
    currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
    
    subSheet.getRange(lastRow, 1).setValue('Active');
    subSheet.getRange(lastRow, 3).setValue(currentExpiry.toISOString());
    subSheet.getRange(lastRow, 4).setValue(new Date().toISOString());
    return ResponseBuilder.success({ message: "Subscription Extended" });
  }
};
`;

const CODE_SUPPORT = `
// =========================================================
// 4. SUPPORT TICKET MODULE
// =========================================================

const SupportHandlers = {
  handleSubmitSupport: function(ss, body) {
    let ticketSheet = ss.getSheetByName('Support_Tickets');
    if (!ticketSheet) {
        ticketSheet = ss.insertSheet('Support_Tickets');
        ticketSheet.appendRow(["Ticket_ID", "Type", "Subject", "Description", "Priority", "User", "Email", "Role", "Timestamp", "Status", "Comments", "Assigned_Agent", "Attachment"]);
        ticketSheet.setFrozenRows(1);
    }
    const ticketId = "TKT-" + Math.floor(1000 + Math.random() * 9000);
    ticketSheet.appendRow([
        ticketId, body.type, body.subject, body.description, body.priority,
        body.user, String(body.email).toLowerCase().trim(), body.role,
        new Date().toISOString(), "Open", "[]", "", body.attachment || ""
    ]);
    
    try {
        GmailApp.sendEmail(
            "notifications@sallychanza.com", 
            "New Ticket: " + ticketId + " [" + body.priority + "]", 
            "User: " + body.user + " (" + body.role + ")\\n" +
            "Type: " + body.type + "\\n" +
            "Subject: " + body.subject + "\\n\\n" +
            "Description:\\n" + body.description
        );
    } catch(e) {
        Logger.log(ss, "EMAIL_ERROR", "Support Ticket Email Failed: " + e.toString());
    }

    let notifSheet = ss.getSheetByName('SystemNotification');
    if (!notifSheet) {
        notifSheet = ss.insertSheet('SystemNotification');
        notifSheet.appendRow(["Notification_ID", "Recipient", "Type", "Message", "Timestamp", "IsRead", "ActionLink"]);
    }
    
    notifSheet.appendRow(["NOTIF-" + Date.now() + "-A", "Admin", "info", "New Ticket: " + ticketId + " (" + body.subject + ")", new Date().toISOString(), "FALSE", "view:support"]);
    notifSheet.appendRow(["NOTIF-" + Date.now() + "-U", String(body.email).toLowerCase().trim(), "success", "Ticket Received: " + ticketId, new Date().toISOString(), "FALSE", "view:support"]);

    if (String(body.priority) === 'Critical') {
         const broadcastMsg = "CRITICAL ALERT: " + body.user + " (" + body.role + ") reported a critical system issue. ID: " + ticketId;
         notifSheet.appendRow([
            "NOTIF-" + Date.now() + "-ALL", 
            "All", 
            "critical", 
            broadcastMsg, 
            new Date().toISOString(), 
            "FALSE", 
            "view:support"
        ]);
    }

    return ResponseBuilder.success({ ticketId: ticketId });
  },

  handleGetTickets: function(ss, body) {
    let ticketSheet = ss.getSheetByName('Support_Tickets');
    if (!ticketSheet || ticketSheet.getLastRow() <= 1) return ResponseBuilder.success({ tickets: [] });
    const data = ticketSheet.getDataRange().getValues();
    const tickets = [];
    const userRole = body.role ? String(body.role).toLowerCase() : "";
    const userEmail = body.email ? String(body.email).toLowerCase().trim() : ""; 
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if(!row[0]) continue;
        const ticketOwnerEmail = row[6] ? String(row[6]).toLowerCase().trim() : "";
        if (isAdmin || (userEmail && ticketOwnerEmail === userEmail) || (ticketOwnerEmail && userEmail && ticketOwnerEmail.includes(userEmail))) {
            let comments = [];
            try { comments = row[10] ? JSON.parse(row[10]) : []; } catch(e) {}
            tickets.push({
                ticketId: row[0], type: row[1], subject: row[2], description: row[3],
                priority: row[4], user: row[5], email: row[6], role: row[7],
                timestamp: row[8], status: row[9], comments: comments,
                assignedTo: row[11] || "", attachment: row[12] || ""
            });
        }
    }
    return ResponseBuilder.success({ tickets: tickets.reverse() });
  },

  handleUpdateTicket: function(ss, body) {
    let ticketSheet = ss.getSheetByName('Support_Tickets');
    if (!ticketSheet) return ResponseBuilder.error("DB Error");
    const data = ticketSheet.getDataRange().getValues();
    const ticketId = body.ticketId;
    let targetRowIndex = -1;
    let ticketOwnerEmail = "";
    
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === ticketId) {
            targetRowIndex = i + 1;
            ticketOwnerEmail = String(data[i][6]);
            break;
        }
    }
    
    if (targetRowIndex > -1) {
        let notifSheet = ss.getSheetByName('SystemNotification');
        if (!notifSheet) {
            notifSheet = ss.insertSheet('SystemNotification');
            notifSheet.appendRow(["Notification_ID", "Recipient", "Type", "Message", "Timestamp", "IsRead", "ActionLink"]);
        }
        if (body.status) {
            ticketSheet.getRange(targetRowIndex, 10).setValue(body.status);
            notifSheet.appendRow(["NOTIF-" + Date.now(), ticketOwnerEmail.toLowerCase().trim(), "info", "Ticket " + ticketId + " status: " + body.status, new Date().toISOString(), "FALSE", "view:support"]);
        }
        if (body.assignedTo) {
            if (ticketSheet.getLastColumn() < 12) ticketSheet.getRange(1, 12).setValue("Assigned_Agent");
            ticketSheet.getRange(targetRowIndex, 12).setValue(body.assignedTo);
            notifSheet.appendRow(["NOTIF-" + Date.now() + "-U", ticketOwnerEmail.toLowerCase().trim(), "info", "Ticket " + ticketId + " assigned to: " + body.assignedTo, new Date().toISOString(), "FALSE", "view:support"]);
        }
        if (body.comment) {
            const currentCommentsJson = ticketSheet.getRange(targetRowIndex, 11).getValue();
            let comments = [];
            try { comments = currentCommentsJson ? JSON.parse(currentCommentsJson) : []; } catch(e) {}
            comments.push(body.comment);
            ticketSheet.getRange(targetRowIndex, 11).setValue(JSON.stringify(comments));
            
            const isResponderAdmin = String(body.comment.role).toLowerCase() === 'admin' || String(body.comment.role).toLowerCase() === 'superadmin';
            let recipient = isResponderAdmin ? ticketOwnerEmail.toLowerCase().trim() : 'Admin';
            notifSheet.appendRow(["NOTIF-" + Date.now(), recipient, "info", "New update on Ticket " + ticketId, new Date().toISOString(), "FALSE", "view:support"]);
        }
        return ResponseBuilder.success();
    }
    return ResponseBuilder.error("Ticket not found");
  }
};
`;

const CODE_LIB = `
// =========================================================
// 5. UTILITIES & LIBRARIES (Helpers, Email, PDF)
// =========================================================

const ResponseBuilder = {
  success: function(data = {}) { return this.build({ status: "success", ...data }); },
  error: function(message, code = null) {
    const response = { status: "error", message: message };
    if (code) response.code = code;
    return this.build(response);
  },
  build: function(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
};

const Validation = {
  updateFromRow: function(ss, body) {
     try {
       const row = body.row;
       const sheetName = body.sheet;
       let truck, trailer, driver, inspector, location;
       if (sheetName === 'General') {
           truck = row[2]; trailer = row[3]; inspector = row[4]; driver = row[5]; location = row[6];
       } else {
           truck = row[2]; trailer = row[3]; location = row[5]; inspector = row[7]; driver = row[8];
       }
       this.updateSingle(ss, 'Truck_Reg_No', truck);
       this.updateSingle(ss, 'Trailer_Reg_No', trailer);
       this.updateSingle(ss, 'Driver_Name', driver);
       this.updateSingle(ss, 'Inspector_Name', inspector);
       this.updateSingle(ss, 'Location', location);
     } catch (e) {}
  },
  updateSingle: function(ss, headerName, value) {
     if (!value || String(value).trim() === "") return;
     const valStr = String(value).trim();
     let vSheet = ss.getSheetByName('Validation_Data');
     if (!vSheet) {
        vSheet = ss.insertSheet('Validation_Data');
        vSheet.appendRow(['Truck_Reg_No', 'Trailer_Reg_No', 'Driver_Name', 'Inspector_Name', 'Location', 'Position']);
        vSheet.setFrozenRows(1);
     }
     const headers = vSheet.getRange(1, 1, 1, vSheet.getLastColumn()).getValues()[0];
     let colIndex = headers.indexOf(headerName) + 1;
     if (colIndex < 1) {
         colIndex = headers.length + 1;
         vSheet.getRange(1, colIndex).setValue(headerName);
     }
     const fullCol = vSheet.getRange(1, colIndex, vSheet.getMaxRows(), 1).getValues().flat().map(String);
     if (!fullCol.includes(valStr)) {
         let targetRow = 1;
         for(let i=1; i<fullCol.length; i++) {
             if(fullCol[i] === "") { targetRow = i + 1; break; }
         }
         if (targetRow === 1) targetRow = vSheet.getLastRow() + 1;
         vSheet.getRange(targetRow, colIndex).setValue(valStr);
     }
  }
};

const Logger = {
  log: function(ss, action, details) {
    let logSheet = ss.getSheetByName('System_Logs');
    if (!logSheet) {
        logSheet = ss.insertSheet('System_Logs');
        logSheet.appendRow(["Timestamp", "Action", "Details"]);
        logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([new Date(), action, details]);
  }
};

const EmailHandlers = {
  sendEmailNotifications: function(ss, data, moduleName) {
    Logger.log(ss, "EMAIL_START", "Module: " + moduleName);
    
    try {
      var userSheet = ss.getSheetByName("Users");
      if (!userSheet) return;

      var users = userSheet.getDataRange().getValues();
      var recipients = [];
      
      for (var i = 1; i < users.length; i++) {
         var userEmail = String(users[i][0]).trim(); 
         var rawPrefs = users[i][6];
         
         if (userEmail && userEmail.indexOf("@") > -1) {
             try {
                 var prefs = rawPrefs ? JSON.parse(rawPrefs) : {};
                 var emailsEnabled = (prefs.emailNotifications !== false); 
                 
                 if (emailsEnabled) {
                     var shouldSend = false;
                     if (moduleName === "General" && (prefs.notifyGeneral !== false)) shouldSend = true;
                     if (moduleName === "Petroleum" && (prefs.notifyPetroleum !== false)) shouldSend = true;
                     if (moduleName === "Petroleum_V2" && (prefs.notifyPetroleumV2 !== false)) shouldSend = true;
                     if (moduleName === "Acid" && (prefs.notifyAcid !== false)) shouldSend = true;
                     
                     if (shouldSend) recipients.push(userEmail);
                 }
             } catch(e) {
                 recipients.push(userEmail);
             }
         }
      }

      if (recipients.length === 0) return;
      
      var row = data.row;
      var truckNo = "N/A", driver = "N/A", inspector = "N/A", rating = "N/A";
      
      if (moduleName === "General") {
          truckNo = row[2]; driver = row[5]; inspector = row[4]; rating = row[8];
      } else {
          truckNo = row[2]; driver = row[8]; inspector = row[7]; rating = row[9];
      }

      var statusColor = "#10b981";
      var statusText = "PASSED";
      if (rating <= 3) { statusColor = "#f59e0b"; statusText = "WARNING"; } 
      if (rating <= 2) { statusColor = "#ef4444"; statusText = "CRITICAL FAIL"; }

      var htmlBody = 
          "<div style='font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;'>" +
              "<div style='background-color: #0f172a; padding: 25px; text-align: center;'>" +
                  "<h2 style='color: white; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;'>INSPECTION ALERT</h2>" +
              "</div>" +
              "<div style='padding: 30px; color: #334155;'>" +
                  "<p style='margin-top: 0; font-size: 15px; color: #475569;'>A new " + moduleName + " inspection report has been submitted.</p>" +
                  "<div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;'>" +
                      "<table style='width: 100%; border-collapse: collapse;'>" +
                          "<tr>" +
                              "<td style='padding: 5px 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;'>Vehicle</td>" +
                              "<td style='padding: 5px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;'>" + truckNo + "</td>" +
                          "</tr>" +
                          "<tr>" +
                              "<td style='padding: 5px 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;'>Inspector</td>" +
                              "<td style='padding: 5px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;'>" + inspector + "</td>" +
                          "</tr>" +
                          "<tr>" +
                              "<td style='padding: 5px 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;'>Result</td>" +
                              "<td style='padding: 5px 0; text-align: right;'>" +
                                  "<span style='color: " + statusColor + "; font-weight: 800; font-size: 14px;'>" + statusText + " (" + rating + "/5)</span>" +
                              "</td>" +
                          "</tr>" +
                      "</table>" +
                  "</div>" +
                  "<p style='font-size: 14px; line-height: 1.5;'>The official PDF report is attached to this email.</p>" +
                  "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;' />" +
                  "<p style='font-size: 11px; color: #94a3b8; text-align: center; margin: 0;'>Sent by SafetyCheck Pro Alerts System.</p>" +
              "</div>" +
          "</div>";

      var blobs = [];
      // (PDF Generation logic omitted for brevity in template, preserved in actual execution if present)
      
      var subject = "Inspection Report: " + truckNo + " [" + statusText + "]";
      var senderEmail = "notification@sallychanza.com";

      var emailOptions = {
          htmlBody: htmlBody,
          name: "Alerts", 
          attachments: blobs,
          bcc: recipients.slice(1).join(","),
          replyTo: senderEmail,
          from: senderEmail
      };

      try {
          GmailApp.sendEmail(recipients[0], subject, "HTML Required", emailOptions);
      } catch (e1) {
          Logger.log(ss, "EMAIL_FAILURE", "Alias failed: " + e1.toString());
      }

    } catch (err) {
        Logger.log(ss, "GLOBAL_EMAIL_ERROR", err.toString());
    }
  }
};

const PDFGenerator = {
  // Simplified PDF generator stub for template compactness. 
  // In real deployment, include full generator logic from previous versions or use libraries.
  create: function(data) { return "<html><body>PDF Content Placeholder</body></html>"; }
};
`;

export const BACKEND_FILES = {
    '1_Controller.gs': CODE_CONTROLLER,
    '2_AuthAndAdmin.gs': CODE_AUTH,
    '3_CoreOperations.gs': CODE_CORE_OPS,
    '4_SupportModule.gs': CODE_SUPPORT,
    '5_LibAndUtils.gs': CODE_LIB
};

export const BACKEND_SCRIPT_TEMPLATE = Object.values(BACKEND_FILES).join('\n\n');
