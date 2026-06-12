/* ═══════════════════════════════════════════════
   SMARTDOCS-AI — script.js
   Handles: role selection, demo chat, contact
   form, and scroll-triggered fade animations.
═══════════════════════════════════════════════ */

/* ════════════════════════════════════════
   1. ROLE CARD SELECTION
════════════════════════════════════════ */

/**
 * Marks the clicked role card as active and
 * removes the active state from all others.
 *
 * @param {HTMLElement} el - The clicked role card element
 */
function setRole(el) {
  document.querySelectorAll('.role-card').forEach(function (card) {
    card.classList.remove('active');
  });
  el.classList.add('active');
}

/* ════════════════════════════════════════
   2. DEMO CHAT WINDOW
════════════════════════════════════════ */

/**
 * Bot reply messages shown in rotation so the
 * demo chat feels varied and useful.
 */
var BOT_REPLIES = [
  'Thanks for your answer! In a real session, SmartDocs-AI would evaluate your response with a STAR breakdown and written feedback. ' +
  '<a href="https://botpress.com" class="bot-link">Connect your Botpress bot</a> to activate live evaluation.',

  'Great effort! A real SmartDocs-AI session would score this across Situation, Task, Action, and Result — and tell you exactly which dimension needs the most work.',

  'Interesting response. Your Action component sounds strong. In a live session, the AI would quantify the impact of what you described and push for a clearer Result.',

  'Good structure! Remember to end every STAR answer with a measurable outcome — numbers, percentages, or time saved always strengthen the Result score.',

  'Solid answer. SmartDocs-AI would now ask a follow-up probe question to test the depth of your Situation. ' +
  '<a href="https://botpress.com" class="bot-link">Try the live bot</a> to experience that.'
];

var replyIndex = 0;

/**
 * Appends a user message bubble to the chat body,
 * then after a short delay appends a bot reply.
 */
async function sendMsg() {
  var input = document.getElementById('chatInput');
  var body = document.getElementById('chatBody');
  var val = input.value.trim();

  if (!val) return;

  // ── User bubble ──
  var userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.innerHTML =
    '<div class="msg-avatar">U</div>' +
    '<div class="msg-bubble">' + escapeHTML(val) + '</div>';
  body.appendChild(userMsg);

  input.value = '';
  scrollChat(body);

  // ── Typing indicator ──
  var typingMsg = document.createElement('div');
  typingMsg.className = 'msg bot typing-indicator';
  typingMsg.innerHTML =
    '<div class="msg-avatar">AI</div>' +
    '<div class="msg-bubble" style="letter-spacing:0.15em; color:var(--text-muted)">• • •</div>';
  body.appendChild(typingMsg);
  scrollChat(body);

  var activeRole = document.querySelector('.role-card.active .role-name');
  var roleName = activeRole ? activeRole.textContent : 'Unknown Role';

  if (isWebhookConfigured(MAKE_CHAT_WEBHOOK_URL)) {
    sendChatToMake({
      role: roleName,
      message: val,
      timestamp: new Date().toISOString()
    }).catch(function (error) {
      console.warn('Make chat webhook failed:', error);
    });
  }

  if (isWebhookConfigured(MAKE_ANALYTICS_WEBHOOK_URL)) {
    sendAnalyticsToMake({
      type: 'chat_message',
      role: roleName,
      message: val,
      timestamp: new Date().toISOString()
    }).catch(function (error) {
      console.warn('Make analytics webhook failed:', error);
    });
  }

  // ── Bot reply after delay ──
  setTimeout(function () {
    body.removeChild(typingMsg);

    var botMsg = document.createElement('div');
    botMsg.className = 'msg bot';
    botMsg.innerHTML =
      '<div class="msg-avatar">AI</div>' +
      '<div class="msg-bubble">' + BOT_REPLIES[replyIndex % BOT_REPLIES.length] + '</div>';
    body.appendChild(botMsg);

    replyIndex++;
    scrollChat(body);
  }, 900);
}

/**
 * Smooth-scrolls the chat body to the latest message.
 *
 * @param {HTMLElement} el - The scrollable chat container
 */
function scrollChat(el) {
  el.scrollTop = el.scrollHeight;
}

/**
 * Very basic HTML escaper to prevent XSS from
 * user-typed content being injected as raw HTML.
 *
 * @param  {string} str - Raw user input
 * @return {string}       Escaped string
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════
   3. CONTACT FORM
════════════════════════════════════════ */

/**
 * Handles the "Send Message" button click.
 * Validates that name + email are filled,
 * then shows a success state on the button.
 */
// These URLs send form and chat data to your Make.com webhook modules.
// 1) Contact form
// 2) Chat message
// 3) General analytics / event log
var MAKE_CONTACT_WEBHOOK_URL = 'https://hook.eu1.make.com/etfoqskislrirhd8exftdkvd1fl9ceqh';
var MAKE_CHAT_WEBHOOK_URL = 'https://hook.eu1.make.com/8xt96as5k4th34red9ya12f44fhr6tz0';
var MAKE_ANALYTICS_WEBHOOK_URL = 'https://hook.eu1.make.com/teaf1gutrvuwtwvr28vc1o7frw42gb2p';

function isWebhookConfigured(url) {
  return url && url.startsWith('https://hook.eu1.make.com/');
}

async function submitToMake(url, payload) {
  if (!isWebhookConfigured(url)) {
    return Promise.reject(new Error('Make webhook URL is not configured'));
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

async function submitContactToMake(payload) {
  return submitToMake(MAKE_CONTACT_WEBHOOK_URL, payload);
}

async function sendChatToMake(payload) {
  return submitToMake(MAKE_CHAT_WEBHOOK_URL, payload);
}

async function sendAnalyticsToMake(payload) {
  return submitToMake(MAKE_ANALYTICS_WEBHOOK_URL, payload);
}

async function handleContactSubmit() {
  var name = document.getElementById('inputName').value.trim();
  var email = document.getElementById('inputEmail').value.trim();
  var role = document.getElementById('inputRole').value;
  var message = document.getElementById('inputMessage').value.trim();
  var btn = document.getElementById('contactSubmit');
  var status = document.getElementById('contactStatus');

  status.textContent = '';
  status.style.color = '';

  if (!name || !email) {
    if (!name) document.getElementById('inputName').style.borderColor = 'var(--gold)';
    if (!email) document.getElementById('inputEmail').style.borderColor = 'var(--gold)';
    status.textContent = 'Please fill in your name and email before sending.';
    status.style.color = 'var(--gold)';
    return;
  }

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    var response = await submitContactToMake({
      name: name,
      email: email,
      role: role,
      message: message
    });

    if (!response.ok) {
      throw new Error('Webhook request failed');
    }

    btn.textContent = 'Sent! ✓';
    btn.classList.add('sent');
    status.textContent = 'Your message has been sent to Make.com successfully.';
    status.style.color = 'var(--text-muted)';

    if (isWebhookConfigured(MAKE_ANALYTICS_WEBHOOK_URL)) {
      sendAnalyticsToMake({
        type: 'contact_form',
        name: name,
        email: email,
        role: role,
        message: message,
        timestamp: new Date().toISOString()
      }).catch(function (error) {
        console.warn('Make analytics webhook failed:', error);
      });
    }
  } catch (error) {
    btn.textContent = 'Send Message';
    btn.disabled = false;
    status.textContent = 'Unable to send your message. Please check the webhook URL or try again later.';
    status.style.color = 'var(--gold)';
    console.error('Make integration error:', error);
  }
}

/* ════════════════════════════════════════
   4. SCROLL-TRIGGERED FADE-IN
════════════════════════════════════════ */

/**
 * Uses IntersectionObserver to fade in
 * feature cards, steps, and role cards
 * as they scroll into view.
 */
function initScrollAnimations() {
  var targets = document.querySelectorAll('.feature-card, .step, .role-card');

  // Set initial hidden state
  targets.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        // Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(function (el) {
    observer.observe(el);
  });
}

/* ════════════════════════════════════════
   5. EVENT LISTENERS  (DOM ready)
════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  // Send on Enter key inside chat input
  var chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMsg();
    });
  }

  // Send button click
  var sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMsg);
  }

  // Contact form submit
  var contactSubmit = document.getElementById('contactSubmit');
  if (contactSubmit) {
    contactSubmit.addEventListener('click', handleContactSubmit);
  }

  // Reset field highlight on input
  ['inputName', 'inputEmail'].forEach(function (id) {
    var field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', function () {
        field.style.borderColor = '';
      });
    }
  });

  // Init scroll animations
  initScrollAnimations();
});
