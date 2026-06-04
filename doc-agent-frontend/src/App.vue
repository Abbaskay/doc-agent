<template>
  <div class="app">
    <div class="toast" :class="toast.visible ? 'show' : ''" :style="{ background: toast.color }">{{ toast.text }}</div>
    <LoginModal :visible="showLoginModal" agent-name="DocAgent" @close="showLoginModal = false" @logged-in="onLoggedIn" />

    <router-view v-if="isStandaloneRoute" />

    <template v-else-if="isAppRoute">
    <Transition name="page" mode="out-in">
      <!-- Landing -->
      <div v-if="!workspaceActive" key="landing" class="landing">
        <header class="lp-header">
          <div class="lp-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>DocAgent</span>
          </div>
          <div class="lp-header-right">
            <router-link :to="{ name: 'Dashboard' }" class="lp-h-link">My Documents</router-link>
            <router-link :to="{ name: 'Pricing' }" class="lp-h-link">Pricing</router-link>
            <template v-if="isAuthenticated">
              <div class="user-menu" ref="userMenu">
                <button @click="userMenuOpen = !userMenuOpen" class="user-trigger">
                  <span class="user-avatar">{{ userInitial }}</span>
                  <span class="user-name">{{ authState.user?.name || 'User' }}</span>
                  <span class="user-plan">{{ authState.plan }}</span>
                </button>
                <Transition name="menu">
                  <div class="user-dropdown" v-if="userMenuOpen">
                    <div class="ud-user">
                      <span class="ud-name">{{ authState.user?.name || 'User' }}</span>
                      <span class="ud-email">{{ authState.user?.email || '' }}</span>
                    </div>
                    <div class="ud-usage">
                      <div class="ud-u-label">Documents this month</div>
                      <div class="ud-u-bar"><div class="ud-u-fill" :style="{ width: usagePercent + '%' }"></div></div>
                      <div class="ud-u-text">{{ authState.usage.generated }} / {{ authState.usageLimit.generated }}</div>
                    </div>
                    <router-link :to="{ name: 'Settings' }" class="ud-item" @click="userMenuOpen = false">Settings</router-link>
                    <router-link :to="{ name: 'Pricing' }" class="ud-item" @click="userMenuOpen = false">Billing & Plan</router-link>
                    <div class="ud-divider"></div>
                    <button class="ud-item ud-logout" @click="handleLogout">Sign out</button>
                  </div>
                </Transition>
              </div>
            </template>
            <template v-else>
              <button @click="showLoginModal = true" class="lp-h-link" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit">Sign in</button>
              <a :href="'http://localhost:5173/signup'" target="_blank" class="lp-h-btn">Get Started</a>
            </template>
          </div>
        </header>

        <main class="lp-main">
          <div class="lp-hero">
            <div class="lp-badge">AI-Powered Document Studio</div>
            <h1 class="hero-title">
              <span class="hero-word">What are you</span>
              <span class="hero-word hero-word-accent">creating?</span>
            </h1>
            <p>Describe any document and AI will generate it in seconds — resumes, invoices, proposals, emails, and more.</p>
          </div>

          <div class="lp-prompt-card" @dragover.prevent="$event.currentTarget.classList.add('drag')" @dragleave.prevent="$event.currentTarget.classList.remove('drag')" @drop.prevent="onDropFile($event)">
            <div class="lp-prompt-inner">
              <button @click="$refs.fileInput?.click()" class="lp-attach-btn" title="Attach file">
                <Paperclip :size="16" :stroke-width="2" />
              </button>
              <textarea v-model="prompt" :placeholder="uploadedFilename ? 'Describe what to do with ' + uploadedFilename + '...' : 'Describe what you want to create — a resume, an invoice, a proposal...'" rows="3" @input="onPromptInput" @keydown.enter.prevent="doLandingSend"></textarea>
              <button @click="doLandingSend" :disabled="!prompt.trim() || loading" class="lp-send-btn">
                <SendHorizonal :size="16" :stroke-width="2.5" />
              </button>
            </div>
            <div class="lp-file-badge" v-if="uploadedFilename">
              <FileText :size="13" :stroke-width="1.5" />
              <span class="lpf-name">{{ uploadedFilename }}</span>
              <span class="lpf-size">({{ (uploadedText.length / 1024).toFixed(1) }} KB)</span>
              <button @click.stop="clearUpload()" class="lpf-remove" title="Remove file">✕</button>
            </div>
            <div class="lp-detection" v-if="detectedType">
              <span class="detect-dot"></span>
              <span>Detected: {{ docLabels[detectedType] }}</span>
            </div>
            <div class="lp-file-actions" v-if="uploadedFilename && !prompt">
              <span class="lp-fa-label">What would you like to do with this file?</span>
              <div class="lp-fa-chips">
                <button class="lp-fa-chip" @click="useFileAction('Summarize this document')">Summarize</button>
                <button class="lp-fa-chip" @click="useFileAction('Improve the formatting and structure of this document')">Format & Structure</button>
                <button class="lp-fa-chip" @click="useFileAction('Rewrite this in a more professional tone')">Professional Rewrite</button>
                <button class="lp-fa-chip" @click="useFileAction('Extract the key information and create a summary')">Extract Key Info</button>
              </div>
            </div>
          </div>

          <div class="lp-categories">
            <button v-for="cat in categories" :key="cat.key" :class="['lp-cat', { active: cat.key === activeCategory }]" @click="activeCategory = cat.key">{{ cat.label }}</button>
          </div>

          <div class="lp-grid">
            <div v-for="(card, i) in filteredCards" :key="card.type" class="lp-card" :style="cardTforms[i]" @mousemove="cardHover($event, i)" @mouseleave="cardLeave(i)" @click="useTemplate(card)">
              <div class="lpc-icon"><component :is="card.icon" :size="26" :stroke-width="1.5" /></div>
              <div class="lpc-label">{{ card.label }}</div>
              <div class="lpc-desc">{{ card.desc }}</div>
            </div>
            <input type="file" ref="fileInput" accept=".pdf,.docx,.txt" @change="onFileUpload" hidden />
          </div>

          <div v-if="docStore.list().length" class="lr-section">
            <div class="lr-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Recent documents</span>
            </div>
            <div class="lr-grid">
              <div v-for="doc in docStore.list().slice(0, 8)" :key="doc.id + '-' + docVersion" class="lr-card" @click="openDocument(doc.id)">
                <div class="lr-card-top">
                  <div class="lr-type-icon" :class="'lr-type-' + (doc.type || 'generic')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <button class="lr-del-btn" @click.stop="deleteDocument(doc.id)" title="Delete document">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                <div class="lr-card-body">
                  <div class="lr-name">{{ doc.name || 'Untitled' }}</div>
                  <div class="lr-meta">
                    <span class="lr-badge">{{ docLabels[doc.type] || doc.type }}</span>
                    <span class="lr-date">{{ formatDocDate(doc.updatedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- Workspace -->
      <div v-else key="workspace" class="workspace">
        <header class="ws-header">
          <div class="ws-header-left">
            <button @click="sidebarOpen = !sidebarOpen" class="ws-back-btn" title="Document history">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <button @click="goToLanding" class="ws-back-btn" title="Back to home" style="margin-left:2px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
            <div class="ws-header-divider"></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span class="ws-title">DocAgent</span>
            <span class="ws-type-badge">{{ docLabels[docType] || 'Document' }}</span>
          </div>
          <div class="ws-header-right">
            <div class="ws-zoom">
              <button @click="zoomOut">−</button>
              <span>{{ Math.round(zoom * 100) }}%</span>
              <button @click="zoomIn">+</button>
            </div>
            <div class="export-wrap" ref="exportWrap">
              <button @click="toggleExport" class="export-trigger">
                <Download :size="14" :stroke-width="2" />
                Export
              </button>
              <Transition name="menu">
                <div class="export-menu" v-if="exportOpen">
                  <button class="em-item" @click="doExport('pdf')"><span class="em-label">Export PDF</span><span class="em-shortcut">⌘P</span></button>
                  <button class="em-item" @click="doExport('docx')"><span class="em-label">Export DOCX</span></button>
                  <button class="em-item" @click="doExport('html')"><span class="em-label">Export HTML</span></button>
                  <div class="em-divider"></div>
                  <button class="em-item" @click="doExport('print')"><span class="em-label">Print</span></button>
                  <button class="em-item" @click="doExport('copy-text')"><span class="em-label">Copy as Text</span></button>
                  <button class="em-item" @click="doExport('copy-html')"><span class="em-label">Copy as HTML</span></button>

                </div>
                  </Transition>
            </div>
            <div class="user-menu" ref="wsUserMenu">
              <button @click="userMenuOpen = !userMenuOpen" class="user-trigger">
                <span class="user-avatar">{{ userInitial }}</span>
              </button>
              <Transition name="menu">
                <div class="user-dropdown" v-if="userMenuOpen">
                  <div class="ud-user">
                    <span class="ud-name">{{ authState.user?.name || 'User' }}</span>
                    <span class="ud-email">{{ authState.user?.email || '' }}</span>
                  </div>
                  <div class="ud-usage">
                    <div class="ud-u-label">Documents this month</div>
                    <div class="ud-u-bar"><div class="ud-u-fill" :style="{ width: usagePercent + '%' }"></div></div>
                    <div class="ud-u-text">{{ authState.usage.generated }} / {{ authState.usageLimit.generated }}</div>
                  </div>
                  <router-link :to="{ name: 'Settings' }" class="ud-item" @click="userMenuOpen = false">Settings</router-link>
                  <router-link :to="{ name: 'Pricing' }" class="ud-item" @click="userMenuOpen = false">Billing & Plan</router-link>
                  <div class="ud-divider"></div>
                  <button class="ud-item ud-logout" @click="handleLogout">Sign out</button>
                </div>
              </Transition>
            </div>
          </div>
        </header>

        <div class="ws-body">
          <Transition name="sidebar-slide">
            <aside v-if="sidebarOpen" class="threads-sidebar">
              <div class="ts-header">
                <span class="ts-title">Documents</span>
                <button class="ts-new-btn" @click="newDocument">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                  New
                </button>
              </div>
              <div class="ts-list">
                <button v-for="doc in docStore.list()" :key="doc.id + '-' + docVersion" :class="['ts-item', { active: doc.id === docId }]" @click="openDocument(doc.id)">
                  <div class="ts-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div class="ts-item-text">
                    <span class="ts-item-name">{{ doc.name || 'Untitled' }}</span>
                    <span class="ts-item-meta">{{ docLabels[doc.type] || doc.type }} · {{ formatDocDate(doc.updatedAt) }}</span>
                  </div>
                  <button class="ts-item-del" @click.stop="deleteDocument(doc.id)" title="Delete">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </button>
                <div v-if="!docStore.list().length" class="ts-empty">No saved documents yet</div>
              </div>
            </aside>
          </Transition>
          <aside class="chat-panel">
            <div class="chat-header">
              <div class="chat-header-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>AI Chat</span>
              </div>
            </div>
            <div class="chat-messages" ref="chatMessages">
              <div v-if="!messages.length && !loading" class="chat-empty">
                <MessageSquare :size="28" :stroke-width="1.5" />
                <span>Chat with AI to refine your document</span>
              </div>
              <TransitionGroup name="msg">
                <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
                  <div class="msg-icon"><component :is="msg.role === 'user' ? User : Bot" :size="14" :stroke-width="2" /></div>
                  <div class="msg-content">{{ msg.text }}</div>
                </div>
              </TransitionGroup>
              <div v-if="loading && messages.length" class="msg agent">
                <div class="msg-icon"><Bot :size="14" :stroke-width="2" /></div>
                <div class="msg-content"><span class="loading-dots"><span>.</span><span>.</span><span>.</span></span></div>
              </div>
            </div>
            <div class="quick-actions" v-if="docData">
              <div class="qa-label">Quick actions</div>
              <div class="qa-chips">
                <button class="qa-chip" @click="useSuggestion('Improve this document')">✨ Improve</button>
                <button class="qa-chip" @click="useSuggestion('Make this more professional')">👔 Professional</button>
                <button class="qa-chip" @click="useSuggestion('Make this more concise')">📏 Concise</button>
                <button class="qa-chip" @click="useSuggestion('Rewrite in a formal tone')">🎩 Formal</button>
                <button class="qa-chip" @click="useSuggestion('Rewrite in a friendly tone')">😊 Friendly</button>
                <button class="qa-chip" @click="useSuggestion('Fix spelling and grammar')">📝 Proofread</button>
              </div>
            </div>
            <div class="suggestions" v-if="suggestions.length > 0">
              <div class="qa-label">Suggestions</div>
              <div class="qa-chips">
                <button v-for="(s, i) in suggestions" :key="i" class="qa-chip" @click="useSuggestion(s)">{{ s }}</button>
              </div>
            </div>
            <div class="chat-input-area">
              <div v-if="uploadedFilename" class="ws-file-badge">
                <FileText :size="14" :stroke-width="1.5" />
                <span class="ws-fb-name">{{ uploadedFilename }}</span>
                <span class="ws-fb-size">({{ (uploadedText.length / 1024).toFixed(1) }} KB)</span>
                <button @click.stop="clearUpload()" class="uz-clear" title="Remove file">✕</button>
              </div>
              <div class="ci-row">
                <button @click="$refs.wsFileInput?.click()" class="ci-attach" title="Attach file">
                  <Paperclip :size="15" :stroke-width="2" />
                </button>
                <input type="file" ref="wsFileInput" accept=".pdf,.docx,.txt" @change="onFileUpload" hidden />
                <textarea v-model="chatText" placeholder="Ask me to edit, improve, or modify..." rows="1" @input="autoResizeChat" @keydown.enter.prevent="sendChat"></textarea>
                <button @click="sendChat" :disabled="!chatText.trim() || loading" class="chat-send-btn">
                  <SendHorizonal :size="15" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </aside>

          <main class="editor-panel">
            <div v-if="loading && !docData" class="generating-overlay">
              <div class="gen-bg">
                <div class="gen-bg-orb orb-1"></div>
                <div class="gen-bg-orb orb-2"></div>
              </div>
              <div class="gen-content">
                <div class="gen-icon-wrap">
                  <div class="gen-icon-ring"></div>
                  <div class="gen-icon-ring gen-icon-ring-2"></div>
                  <div class="gen-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  </div>
                </div>
                <h3 class="gen-title">Generating Your Document</h3>
                <div class="gen-status">{{ genStatus }}</div>
                <div class="gen-progress">
                  <div class="gen-progress-bar">
                    <div class="gen-progress-fill" :style="{ width: genProgress + '%' }"></div>
                  </div>
                  <div class="gen-progress-label">{{ genProgress }}%</div>
                </div>
                <p class="gen-hint">This usually takes a few seconds</p>
              </div>
            </div>
            <div v-if="loading && docData" class="loading-bar"><div class="loading-bar-inner"></div></div>
            <div class="editor-container">
              <div v-if="!docData && !loading" class="skeleton-doc">
                <div class="sk-block w-40" style="height:24px;margin:30px auto"></div>
                <div class="sk-block w-65" style="height:10px;margin:0 auto 18px"></div>
                <div class="sk-block w-25" style="height:14px;margin:14px 0 6px"></div>
                <div class="sk-block w-88" style="height:9px;margin:4px 0"></div>
                <div class="sk-block w-72" style="height:9px;margin:4px 0"></div>
                <div class="sk-block w-25" style="height:14px;margin:16px 0 6px"></div>
                <div style="display:flex;justify-content:space-between;margin:4px 0"><div class="sk-block w-42" style="height:12px"></div><div class="sk-block w-18" style="height:12px"></div></div>
                <div class="sk-block w-82" style="height:9px;margin:4px 0 4px 14px"></div>
                <div class="sk-block w-68" style="height:9px;margin:4px 0 4px 14px"></div>
              </div>
              <div v-else-if="docData" class="fade-in-doc">
                <div id="docPageWrapper">
                  <div id="docFloatingToolbar">
                    <div class="tb-scroll">
                      <div class="tb-row">
                        <!-- Undo/Redo -->
                        <button class="tb-btn" @click="docExec('undo')" title="Undo">↩</button>
                        <button class="tb-btn" @click="docExec('redo')" title="Redo">↪</button>
                        <span class="tb-divider"></span>

                        <!-- Font & Size -->
                        <select class="tb-select" @change="docExec('fontName', $event.target.value)" title="Font">
                          <option value="Calibri">Calibri</option>
                          <option value="Arial">Arial</option>
                          <option value="'Times New Roman'">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Inter">Inter</option>
                          <option value="'Courier New'">Courier New</option>
                        </select>
                        <select class="tb-select tb-size" @change="docExecFontSize($event.target.value)" title="Size">
                          <option value="1">8</option>
                          <option value="2">10</option>
                          <option value="3" selected>12</option>
                          <option value="4">14</option>
                          <option value="5">18</option>
                          <option value="6">24</option>
                          <option value="7">36</option>
                        </select>
                        <span class="tb-divider"></span>

                        <!-- Bold, Italic, Underline, Strike -->
                        <button class="tb-btn" @click="docExec('bold')" title="Bold" :class="{ active: isFormatActive('bold') }"><b>B</b></button>
                        <button class="tb-btn" @click="docExec('italic')" title="Italic" :class="{ active: isFormatActive('italic') }"><i>I</i></button>
                        <button class="tb-btn" @click="docExec('underline')" title="Underline" :class="{ active: isFormatActive('underline') }"><u>U</u></button>
                        <button class="tb-btn" @click="docExec('strikeThrough')" title="Strikethrough" :class="{ active: isFormatActive('strikeThrough') }"><s>S</s></button>
                        <span class="tb-divider"></span>

                        <!-- Color -->
                        <label class="tb-color-label" title="Text color">
                          <input type="color" @input="docExec('foreColor', $event.target.value)" class="tb-color-input">
                          <span>A</span>
                        </label>
                        <label class="tb-color-label" title="Highlight">
                          <input type="color" @input="docExec('hiliteColor', $event.target.value)" class="tb-color-input">
                          <span class="tb-highlight">A</span>
                        </label>
                        <button class="tb-btn" @click="docExec('removeFormat')" title="Clear formatting">✕</button>
                        <span class="tb-divider"></span>

                        <!-- Heading -->
                        <select class="tb-select" @change="docExec('formatBlock', $event.target.value)" title="Style">
                          <option value="p">Normal</option>
                          <option value="h1">Heading 1</option>
                          <option value="h2">Heading 2</option>
                          <option value="h3">Heading 3</option>
                          <option value="h4">Heading 4</option>
                          <option value="blockquote">Quote</option>
                          <option value="pre">Code</option>
                        </select>
                        <span class="tb-divider"></span>

                        <!-- Align -->
                        <button class="tb-btn" @click="docExec('justifyLeft')" title="Align left" :class="{ active: isFormatActive('justifyLeft') }">≡</button>
                        <button class="tb-btn" @click="docExec('justifyCenter')" title="Center" :class="{ active: isFormatActive('justifyCenter') }">≡</button>
                        <button class="tb-btn" @click="docExec('justifyRight')" title="Align right" :class="{ active: isFormatActive('justifyRight') }">≡</button>
                        <span class="tb-divider"></span>

                        <!-- Lists & Indent -->
                        <button class="tb-btn" @click="docExec('insertUnorderedList')" title="Bullet list" :class="{ active: isFormatActive('insertUnorderedList') }">•</button>
                        <button class="tb-btn" @click="docExec('insertOrderedList')" title="Numbered list" :class="{ active: isFormatActive('insertOrderedList') }">1.</button>
                        <button class="tb-btn" @click="docExec('outdent')" title="Decrease indent">⇤</button>
                        <button class="tb-btn" @click="docExec('indent')" title="Increase indent">⇥</button>
                        <span class="tb-divider"></span>

                        <!-- Insert -->
                        <button class="tb-btn" @click="docLink" title="Insert link">🔗</button>
                        <button class="tb-btn" @click="docExec('insertHorizontalRule')" title="Horizontal line">—</button>
                        <span class="tb-divider"></span>

                        <!-- Zoom -->
                        <button class="tb-btn" @click="zoomOut" title="Zoom out">−</button>
                        <span class="tb-zoom-pct">{{ Math.round(zoom * 100) }}%</span>
                        <button class="tb-btn" @click="zoomIn" title="Zoom in">+</button>
                        <span class="tb-divider"></span>

                        <!-- Export -->
                        <button class="tb-btn tb-premium" @click="doExport('print')" title="Print / PDF">🖨️</button>
                        <button class="tb-btn" @click="doExport('template')" title="Open in new tab">↗️</button>
                      </div>
                    </div>
                  </div>
                  <div class="doc-page-scaler" :style="{ transform: 'scale(' + zoom + ')', transformOrigin: 'top center' }">
                    <div id="docPage" ref="docPage" class="loaded" contenteditable="true" @input="onDocEdit"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Transition>
    </template>
  </div>
</template>

<script>
import api, { agentApi } from './services/api.js'
import DocEditor from './components/DocEditor.vue'
import * as pdfjs from 'pdfjs-dist'
import mammoth from 'mammoth'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
import { FileText, FileEdit, Presentation, BarChart3, Receipt, Mail, BookOpen, ArrowLeft, MessageSquare, User, Bot, Paperclip, Download, SendHorizonal } from 'lucide-vue-next'
import { authState } from './store/auth.js'
import { docStore } from './store/documents.js'
import { promptHistory } from './store/prompts.js'
import { userProfile } from './store/profile.js'
import { validateDoc, normalizeDocData } from './services/validator.js'
import { scoreDoc } from './services/scorer.js'
import { tonePresets } from './services/tones.js'
import { renderDocument } from './renderers/buildHtml.js'
import LoginModal from '@shared/LoginModal.vue'

const docLabels = {
  resume: 'Resume', cover_letter: 'Cover Letter', proposal: 'Proposal',
  report: 'Report', invoice: 'Invoice', email: 'Email',
  documentation: 'Documentation', generic: 'Document',
}

const docSuggestions = {
  resume: ['Improve bullet points', 'Make more ATS-friendly', 'Quantify achievements', 'Shorten to 1 page'],
  cover_letter: ['Make more formal', 'Highlight key skills', 'Shorten', 'Add enthusiasm'],
  proposal: ['Improve persuasiveness', 'Add pricing details', 'Strengthen executive summary'],
  report: ['Summarize findings', 'Improve clarity', 'Add recommendations'],
  invoice: ['Add line items', 'Recalculate totals', 'Add payment terms'],
  email: ['Make more professional', 'Shorten', 'Improve tone'],
  documentation: ['Add more sections', 'Improve clarity', 'Add examples'],
  generic: ['Improve structure', 'Polish writing', 'Add more detail'],
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'resume', label: 'Resume' },
  { key: 'cover_letter', label: 'Cover Letter' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'report', label: 'Report' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'email', label: 'Email' },
  { key: 'documentation', label: 'Documentation' },
]

const templateCards = [
  { type: 'resume', label: 'Resume', desc: 'ATS-friendly CV', icon: 'FileText', prompt: 'Create a detailed professional resume with substantial content that fills a full A4 page. Include: name, contact info, a professional summary (2-3 sentences), 3+ work experiences each with 3-4 bullet points, education, skills (languages, frameworks, tools), and optionally certifications or projects. Name: Alex Chen. Role: Software Engineer. 4 years experience in React, Node.js, TypeScript. Previous roles at mid-size tech companies.' },
  { type: 'cover_letter', label: 'Cover Letter', desc: 'Professional & tailored', icon: 'FileEdit', prompt: 'Write a detailed professional cover letter at least 3-4 paragraphs long. Include: sender name/contact, date, recipient name/company, a compelling opening paragraph, 2 body paragraphs highlighting specific skills and experience, a strong closing paragraph, and professional sign-off. Name: Jordan Smith. Position: Senior Developer. Company: Google. Highlight 5 years full-stack experience, React expertise, and team leadership.' },
  { type: 'proposal', label: 'Proposal', desc: 'Modern corporate layout', icon: 'Presentation', prompt: 'Create a comprehensive business proposal with detailed content filling at least one page. Include: title, prepared by/for, date, executive summary (3-4 sentences), problem statement, proposed solution with specifics, scope of work with 3-4 detailed items, investment/pricing section, timeline with 3-4 phases, and deliverables. Company: GrowthLab. Client: local retail chain. Budget: $15,000. Timeline: 3 months.' },
  { type: 'report', label: 'Report', desc: 'Academic & structured', icon: 'BarChart3', prompt: 'Generate a comprehensive project report with detailed content filling a full page. Include: title, author, date, executive summary, introduction, methodology with detailed approach, findings with specific data points, conclusion, and actionable recommendations (3-4 items). Use formal academic language with specific details. Project: Cloud Migration for Q4 2025. Prepared by: Sarah Lee.' },
  { type: 'invoice', label: 'Invoice', desc: 'Clean & professional', icon: 'Receipt', prompt: 'Create a detailed invoice with at least 4-5 line items. Include: business name and contact, invoice number, date, due date, client name and email, an itemized table with description/quantity/rate/amount for each item, subtotal, tax calculation, total due, payment terms, and thank you note. Business: TechStudio. Client: Acme Corp. Items: Web Design 5 x $400, Hosting 12 x $50, SEO Audit 1 x $1200, Content Writing 10 x $150, Maintenance 3 x $200.' },
  { type: 'email', label: 'Email', desc: 'AI-crafted messaging', icon: 'Mail', prompt: 'Write a detailed professional email with 3-4 well-developed paragraphs. Include: subject line, greeting, an opening paragraph establishing context, 1-2 body paragraphs with specific details, a clear call to action, professional closing, and sender signature with name and title. Write a follow-up email after a job interview. Name: Sarah. Company: Google. Position: Product Manager. Keep warm and professional but detailed.' },
  { type: 'documentation', label: 'Documentation', desc: 'Technical & workflow', icon: 'BookOpen', prompt: 'Create comprehensive technical documentation with substantial content. Include: title, author, version, date, overview section with 2-3 paragraphs, 4-5 detailed sections each with multiple paragraphs explaining architecture, API endpoints with request/response examples, configuration guide with specific settings, deployment steps, and a conclusion. Title: User Authentication Service. Cover: API documentation, JWT workflow, OAuth integration, database schema.' },
]

const classifiers = {
  resume: [
    [20,['resume','cv','curriculum vitae','résumé']],
    [10,['professional summary','professional profile','career objective','objective statement']],
    [8,['work experience','employment history','professional experience','work history']],
    [6,['education','skills','references','achievements','accomplishments','certifications']],
    [4,['job title','employer','company name','university','bachelor','master','phd']],
  ],
  cover_letter: [
    [20,['cover letter','letter of intent','letter of application']],
    [10,['dear hiring','dear sir','dear madam','dear mr','dear ms','i am writing to','i am writing this']],
    [6,['sincerely','regards','application for']],
  ],
  proposal: [
    [20,['proposal','business plan','project proposal','business proposal']],
    [10,['scope of work','executive summary','proposed solution']],
    [6,['budget','deliverables','timeline','investment','pricing']],
  ],
  report: [
    [20,['report','project report','status report','research report','annual report']],
    [10,['executive summary','methodology','findings','analysis']],
    [6,['recommendations','conclusion','objectives','introduction','abstract']],
  ],
  invoice: [
    [20,['invoice','bill','quotation','estimate','purchase order']],
    [10,['payment terms','total due','amount due','due date','subtotal','itemized']],
    [6,['invoice number','bill to','payment method','bank transfer']],
  ],
  email: [
    [20,['email','e-mail']],
    [10,['subject line','email subject','to:','from:','dear team','dear all']],
    [6,['newsletter','follow-up email','outreach email','best regards','best wishes']],
  ],
  documentation: [
    [20,['documentation','user guide','user manual','api documentation','technical documentation','reference manual']],
    [10,['architecture','deployment guide','installation guide','configuration']],
    [6,['overview','getting started','prerequisites','setup']],
  ],
}
function editDist(a, b) {
  const m = a.length, n = b.length
  if (Math.abs(m - n) > 2) return 99
  const dp = []
  for (let i = 0; i <= m; i++) { dp[i] = [i]; for (let j = 1; j <= n; j++) dp[i][j] = i === 0 ? j : 0 }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
  }
  return dp[m][n]
}

function fuzzyIncludes(text, keyword) {
  if (text.includes(keyword)) return true
  const words = text.split(/\s+/).filter(Boolean)
  const kwWords = keyword.split(/\s+/).filter(Boolean)
  if (kwWords.length === 1) {
    const maxDist = keyword.length <= 4 ? 1 : keyword.length <= 8 ? 2 : 3
    return words.some(w => w.length >= 3 && editDist(w, keyword) <= maxDist)
  }
  return kwWords.every(kw => fuzzyIncludes(text, kw))
}

function classifyDocType(text) {
  const t = text.toLowerCase().trim()
  if (!t) return 'generic'
  const scores = {}
  for (const [type, groups] of Object.entries(classifiers)) {
    let score = 0
    for (const [w, ks] of groups) { for (const k of ks) { if (fuzzyIncludes(t, k)) { score += w; break } } }
    scores[type] = score
  }
  let best = { type: 'generic', score: 0 }
  for (const [type, score] of Object.entries(scores)) { if (score > best.score) best = { type, score } }
  return best.score >= 8 ? best.type : 'generic'
}

export default {
  name: 'App',
  components: { FileText, FileEdit, Presentation, BarChart3, Receipt, Mail, BookOpen, ArrowLeft, MessageSquare, User, Bot, Paperclip, Download, SendHorizonal, DocEditor, LoginModal },
  data() {
    return {
      prompt: '', workspaceActive: false, docType: null, detectedType: null,
      docData: null, editedHtml: '', docKey: 0, docId: null,
      loading: false, zoom: 1, chatText: '', messages: [],
      uploadedText: '', suggestions: [], activeCategory: 'all', uploadedFilename: '', conversationId: '',
      docName: '', showHistory: false,
      genStatus: 'Analyzing your request...',
      genProgress: 0,
      genTimer: null,
      genStatuses: [
        'Analyzing your request...',
        'Researching document structure...',
        'Generating content...',
        'Structuring sections...',
        'Applying formatting...',
        'Polishing your document...',
        'Finalizing...',
      ],
      docValidation: [], docScore: 0, docScoreCats: [], docSuggestions: [], docStore, docVersion: 0,
      categories, templateCards, docLabels,
      toast: { text: '', visible: false, color: '#34c759' }, toastTimer: null,

      exportOpen: false, cardTforms: [], userMenuOpen: false,
      showLoginModal: false, pendingAction: null,
      sidebarOpen: false,
    }
  },
  computed: {
    isAuthenticated() { return authState.isAuthenticated },
    authState() { return authState },
    User() { return User },
    Bot() { return Bot },
    userInitial() { return (authState.user?.name || 'U')[0].toUpperCase() },
    usagePercent() { return Math.min((authState.usage.generated / authState.usageLimit.generated) * 100, 100) },
    recentPrompts() { return this.showHistory ? promptHistory.all : promptHistory.all.slice(0, 3) },
    isStandaloneRoute() {
      const standalone = ['Welcome', 'Pricing', 'Settings', 'Dashboard', 'AuthCallback']
      return standalone.includes(this.$route?.name)
    },
    isAppRoute() { return this.$route?.name === 'App' },
    filteredCards() {
      if (this.activeCategory === 'all') return this.templateCards
      return this.templateCards.filter(c => c.type === this.activeCategory)
    },
  },
  methods: {
    onLoggedIn(data) {
      authState.login(data.token, data.user, data.user?.subscription || null)
      this.showLoginModal = false
      this.$nextTick(() => {
        if (this.pendingAction === 'doLandingSend') { this.pendingAction = null; this.doLandingSend() }
      })
    },
    cardHover(e, i) {
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width * 100).toFixed(1)
      const py = ((e.clientY - r.top) / r.height * 100).toFixed(1)
      el.style.setProperty('--mx', px + '%')
      el.style.setProperty('--my', py + '%')
      const x = (px / 100) - 0.5
      const y = (py / 100) - 0.5
      this.cardTforms[i] = `perspective(500px) rotateX(${y * -12}deg) rotateY(${x * 12}deg) scale(1.03)`
    },
    cardLeave(i) { this.cardTforms[i] = '' },
    toastMsg(text, color = '#34c759') {
      this.toast.text = text; this.toast.color = color; this.toast.visible = true
      clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.toast.visible = false }, 2800)
    },
    onPromptInput(e) {
      const el = e.target
      el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 320) + 'px'
      this.detectType()
    },
    autoResizeChat(e) {
      const el = e.target
      el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    },
    detectType() {
      this.detectedType = this.prompt.trim() ? classifyDocType(this.prompt) : null
    },
    useTemplate(card) {
      this.prompt = card.prompt; this.detectedType = card.type; this.doLandingSend()
    },
    genId() { return crypto.randomUUID() },

    async doLandingSend() {
      if (!this.prompt.trim() || this.loading) return
      if (!this.isAuthenticated) {
        this.pendingAction = 'doLandingSend'
        this.showLoginModal = true
        return
      }
      this.prompt = userProfile.autofill(this.detectedType || 'generic', this.prompt)
      if (authState.isOverLimit) {
        this.toastMsg('You\'ve hit your monthly limit. Upgrade to generate more documents.', '#ff9f0a')
        this.$router.push({ name: 'Pricing' })
        return
      }
      const type = this.detectedType || 'generic'
      this.messages = [{ role: 'user', text: this.prompt }]
      this.docType = type; this.workspaceActive = true; this.loading = true
      this.conversationId = this.genId()
      this.$nextTick(() => this.scrollChat())
      await this.generateDoc(this.prompt, type)
    },
    async generateDoc(text, type) {
      this.loading = true; this.docData = null
      this.startGeneratingAnimation()
      const fullPrompt = this.uploadedText ? text + '\n\n[Attached document]\n' + this.uploadedText : text
      try {
        const res = await agentApi.post('/api/generate', {
          prompt: fullPrompt,
          doc_type: type,
          conversation_id: this.conversationId,
        })
        let raw = res.data.reply || res.data.data?.outputs?.text || res.data.data?.outputs?.result || res.data.data?.outputs?.output
        if (!raw) throw new Error('No output from workflow')
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try { this.docData = normalizeDocData(JSON.parse(jsonMatch[0]), type) }
          catch { this.docData = { title: 'Document', sections: [{ body: raw }] } }
          this.docData = userProfile.mergeInto(this.docData)
          const html = renderDocument(this.docData, type)
          this.editedHtml = html
          this.$nextTick(() => { if (this.$refs.docPage) this.$refs.docPage.innerHTML = html })
          this.docKey++
          this.docName = type ? (docLabels[type] || type) + ' - ' + new Date().toLocaleDateString() : 'Document'
          this.$nextTick(() => this.autoSaveDoc())
          promptHistory.add(text.replace(/\n\n\[CURRENT DOCUMENT\].*/s, '').trim(), type)
        } else {
          this.docData = { title: 'Document', sections: [{ body: raw }] }
          const html2 = renderDocument(this.docData, type)
          this.editedHtml = html2
          this.$nextTick(() => { if (this.$refs.docPage) this.$refs.docPage.innerHTML = html2 })
          this.docKey++
          this.docName = 'Document - ' + new Date().toLocaleDateString()
        }
        this.messages.push({ role: 'agent', text: `${docLabels[type] || 'Document'} generated. You can edit it or ask for changes.` })
      } catch (e) {
        this.toastMsg('Generation failed', '#ff453a')
      } finally { this.stopGeneratingAnimation(); this.loading = false; this.$nextTick(() => this.scrollChat()) }
    },
    docExec(command, value) {
      document.execCommand(command, false, value || null)
      this.$refs.docPage?.focus()
    },
    docExecFontSize(value) {
      this.docExec('fontSize', value)
    },
    isFormatActive(name) {
      try { return document.queryCommandState(name) } catch { return false }
    },
    docLink() {
      const url = prompt('Enter URL:', 'https://')
      if (!url) { this.$refs.docPage?.focus(); return }
      let safeUrl
      try {
        const parsed = new URL(url)
        if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
          this.toastMsg('Only http, https, and mailto URLs are allowed', '#ff9f0a')
          this.$refs.docPage?.focus(); return
        }
        safeUrl = parsed.href
      } catch {
        this.toastMsg('Invalid URL', '#ff9f0a')
        this.$refs.docPage?.focus(); return
      }
      const sel = window.getSelection()
      if (sel && sel.toString()) {
        this.docExec('createLink', safeUrl)
      } else {
        const a = document.createElement('a')
        a.href = safeUrl
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.textContent = safeUrl
        document.execCommand('insertHTML', false, a.outerHTML)
      }
      this.$refs.docPage?.focus()
    },
    onDocEdit(e) {
      this.editedHtml = e.target.innerHTML
    },
    trySimpleEdit(text) {
      if (!this.docData || typeof this.docData !== 'object') return false
      const t = text.toLowerCase().trim()
      let changed = false

      const extractVal = (s) => { return s.replace(/^(to|as) /i, '').replace(/^"(.*)"$/, '$1').trim() }
      const changeField = (field, fullText) => {
        const patterns = [
          new RegExp('change\\s+the?\\s+' + field + '\\s+(?:to|as)\\s+(.+)', 'i'),
          new RegExp('(?:set|update)\\s+(?:the?\\s+)?' + field + '\\s+(?:to|as)\\s+(.+)', 'i'),
          new RegExp('change\\s+' + field + '\\s+(?:to|as)\\s+(.+)', 'i'),
        ]
        for (const p of patterns) {
          const m = fullText.match(p)
          if (m) return extractVal(m[1])
        }
        return null
      }

      const expIdx = (txt) => { const m = txt.match(/experience\s*#?(\d+)/i); return m ? parseInt(m[1]) - 1 : 0 }
      const eduIdx = (txt) => { const m = txt.match(/education\s*#?(\d+)/i); return m ? parseInt(m[1]) - 1 : 0 }

      if (t.includes('full name') || t.includes(' whole name') || (t.includes('change name') && !t.includes('company') && !t.includes('school'))) {
        const v = changeField('name', text)
        if (v) { this.docData.full_name = v; changed = true }
      }
      if (t.includes('email')) {
        const v = changeField('email', text)
        if (v && v.includes('@')) { this.docData.email = v; changed = true }
      }
      if (t.includes('phone') || t.includes('number') || t.includes('mobile')) {
        const v = changeField('phone', text) || changeField('number', text) || changeField('mobile', text)
        if (v) { this.docData.phone = v; changed = true }
      }
      if (t.includes('location') || t.includes('address') || t.includes('city')) {
        const v = changeField('location', text)
        if (v) { this.docData.location = v; changed = true }
      }
      if ((t.includes('job title') || t.includes('position') || t.includes('role')) && !t.includes('proposal')) {
        const idx = expIdx(t)
        const exps = Array.isArray(this.docData.experience) ? this.docData.experience : []
        if (exps[idx]) {
          const v = changeField('job title', text) || changeField('position', text) || changeField('role', text)
          if (v) { exps[idx].job_title = v; changed = true }
        }
      }
      if (t.includes('company') || t.includes('employer')) {
        const idx = expIdx(t)
        const exps = Array.isArray(this.docData.experience) ? this.docData.experience : []
        if (exps[idx]) {
          const v = changeField('company', text)
          if (v) { exps[idx].company = v; changed = true }
        }
      }
      if (t.includes('summary') || t.includes('profile')) {
        const v = changeField('summary', text) || changeField('profile', text)
        if (v) { this.docData.professional_summary = v; changed = true }
      }
      if (t.includes('school') || t.includes('university') || t.includes('institution')) {
        const idx = eduIdx(t)
        const edus = Array.isArray(this.docData.education) ? this.docData.education : []
        if (edus[idx]) {
          const v = changeField('school', text) || changeField('university', text) || changeField('institution', text)
          if (v) { edus[idx].institution = v; changed = true }
        }
      }
      if (t.includes('degree')) {
        const idx = eduIdx(t)
        const edus = Array.isArray(this.docData.education) ? this.docData.education : []
        if (edus[idx]) {
          const v = changeField('degree', text)
          if (v) { edus[idx].degree = v; changed = true }
        }
      }

      if (changed) {
        const h = renderDocument(this.docData, this.docType)
        this.editedHtml = h
        this.$nextTick(() => { if (this.$refs.docPage) this.$refs.docPage.innerHTML = h })
        this.docKey++
        return true
      }
      return false
    },
    async sendChat() {
      if (!this.chatText.trim() || this.loading) return
      const text = this.chatText
      this.messages.push({ role: 'user', text }); this.chatText = ''
      if (this.docData && this.trySimpleEdit(text)) {
        this.messages.push({ role: 'agent', text: 'Updated as requested.' })
        this.scrollChat()
        return
      }
      let contextualPrompt = text
      if (this.docData) {
        contextualPrompt += '\n\n[CURRENT DOCUMENT (modify this according to my request above)]\n' + JSON.stringify(this.docData, null, 2)
      }
      const recent = this.messages.slice(-4).map(m => (m.role === 'user' ? 'User' : 'Assistant') + ': ' + m.text).join('\n')
      if (recent) {
        contextualPrompt += '\n\n[RECENT CONVERSATION]\n' + recent
      }
      this.loading = true; this.$nextTick(() => this.scrollChat())
      await this.generateDoc(contextualPrompt, this.docType)
    },
    useSuggestion(s) { this.chatText = s; this.sendChat() },
    applyTone(tone) {
      this.chatText = tone.prompt
      this.sendChat()
      this.toastMsg(`Applying "${tone.label}" tone...`, '#34c759')
    },
    scrollChat() { this.$nextTick(() => { const el = this.$refs.chatMessages; if (el) el.scrollTop = el.scrollHeight }) },
    goToLanding() {
      this.autoSaveDoc()
      this.workspaceActive = false; this.docData = null; this.messages = []; this.suggestions = []; this.zoom = 1; this.uploadedText = ''; this.uploadedFilename = ''; this.prompt = ''; this.detectedType = null; this.conversationId = ''; this.docName = ''; this.sidebarOpen = false
    },
    formatDocDate(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      const now = new Date()
      const diff = now - d
      if (diff < 3600000) return Math.round(diff / 60000) + 'm ago'
      if (diff < 86400000) return Math.round(diff / 3600000) + 'h ago'
      if (diff < 172800000) return 'Yesterday'
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    },
    newDocument() {
      this.workspaceActive = false; this.docData = null; this.messages = []; this.suggestions = []; this.zoom = 1; this.uploadedText = ''; this.uploadedFilename = ''; this.prompt = ''; this.detectedType = null; this.conversationId = ''; this.docName = ''; this.sidebarOpen = false
    },
    openDocument(id) {
      const doc = docStore.get(id)
      if (!doc) return
      this.docData = doc.docData || null
      this.editedHtml = doc.editedHtml || ''
      this.docType = doc.type || 'generic'
      this.docName = doc.name || 'Document'
      this.docId = doc.id
      this.messages = doc.messages || []
      this.workspaceActive = true
      const setDocContent = () => {
        if (this.$refs.docPage) {
          this.$refs.docPage.innerHTML = this.editedHtml || ''
        } else {
          setTimeout(setDocContent, 50)
        }
      }
      this.$nextTick(setDocContent)
    },
    deleteDocument(id) {
      docStore.deleteDocument(id)
      if (this.docId === id) this.docId = null
      this.docVersion++
    },
    savedDocs() {
      return docStore.list().slice(0, 10)
    },
    zoomIn() { this.zoom = Math.min(this.zoom + 0.1, 1.5) },
    zoomOut() { this.zoom = Math.max(this.zoom - 0.1, 0.5) },
    async readFile(file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'txt') return await file.text()
      if (ext === 'pdf') {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: buf }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map(c => c.str).join(' ') + '\n'
        }
        return text
      }
      if (ext === 'docx') {
        const buf = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer: buf })
        return result.value
      }
      throw new Error('Unsupported file type: .' + ext)
    },
    useFileAction(text) { this.prompt = text; this.doLandingSend() },

    startGeneratingAnimation() {
      this.genProgress = 0
      this.genStatus = 'Analyzing your request...'
      let step = 0
      clearInterval(this.genTimer)
      this.genTimer = setInterval(() => {
        step++
        if (step < this.genStatuses.length) {
          this.genStatus = this.genStatuses[step]
        }
        const target = Math.min(step * 14, 92)
        if (this.genProgress < target) {
          this.genProgress = target
        }
      }, 900)
    },
    stopGeneratingAnimation() {
      clearInterval(this.genTimer)
      this.genProgress = 100
      this.genStatus = 'Done!'
    },

    onDropFile(e) {
      e.currentTarget.classList.remove('drag')
      const f = e.dataTransfer?.files?.[0]
      if (!f) return
      this.uploadedFilename = f.name
      this.readFile(f).then(text => {
        this.uploadedText = text
        this.detectedType = classifyDocType(text)
        this.toastMsg('Loaded ' + f.name + ' (' + text.length + ' chars)', '#34c759')
      }).catch(err => {
        this.toastMsg(err.message || 'Failed to read file', '#ff453a')
        this.clearUpload()
      })
    },
    onFileUpload(e) {
      const f = e.target.files?.[0]
      if (!f) return
      this.uploadedFilename = f.name
      this.readFile(f).then(text => {
        this.uploadedText = text
        this.detectedType = classifyDocType(text)
        this.toastMsg('Loaded ' + f.name + ' (' + text.length + ' chars)', '#34c759')
      }).catch(err => {
        this.toastMsg(err.message || 'Failed to read file', '#ff453a')
        this.clearUpload()
      })
      e.target.value = ''
    },
    clearUpload() { this.uploadedText = ''; this.uploadedFilename = '' },
    checkResume() {
      const docId = this.$route.query.resume
      if (!docId) return
      const doc = docStore.get(docId)
      if (!doc) return
      this.docName = doc.name || ''
      this.docType = doc.type || null
      this.docData = doc.docData || null
      this.editedHtml = doc.editedHtml || ''
      this.prompt = doc.prompt || ''
      if (this.docData) {
        this.workspaceActive = true
        this.docKey++
      }
    },
    autoSaveDoc() {
      if (!this.docData) return
      const docId = this.docId || crypto.randomUUID()
      if (!this.docId) this.docId = docId
      docStore.saveDocument({
        id: docId,
        name: this.docName || (this.docLabels[this.docType] || 'Document') + ' - ' + new Date().toLocaleDateString(),
        type: this.docType,
        docData: this.docData,
        editedHtml: this.getDocContent(),
        messages: this.messages,
        prompt: this.prompt,
      })
      this.docVersion++
    },
    truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s },
    useHistoryPrompt(p) {
      this.prompt = p.text
      this.detectType()
      this.showHistory = false
      this.$nextTick(() => { const ta = document.querySelector('.lp-prompt-inner textarea'); if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 320) + 'px' } })
    },
    clearHistory() { promptHistory.clear(); this.showHistory = false },
    checkTokenOnFocus() {
      if (!authState.isAuthenticated) return
      api.get('/api/auth/me').catch(() => {
        authState.logout()
        this.goToLanding()
        this.$router.push({ name: 'Welcome' })
      })
    },
    handleLogout() {
      this.userMenuOpen = false
      authState.logout()
      this.goToLanding()
      this.$router.push({ name: 'Welcome' })
    },
    toggleExport() { this.exportOpen = !this.exportOpen },
    getDocContent() {
      try {
        return this.$refs.docPage?.innerHTML || this.editedHtml || ''
      } catch {
        return this.editedHtml || ''
      }
    },
    getExportCSS() {
      return `.doc-paper{width:210mm;min-height:296mm;background:#fff;color:#1d1d1f;padding:22mm 20mm 18mm;font-family:Calibri,'Segoe UI',-apple-system,Arial,sans-serif;font-size:10.5pt;line-height:1.35;margin:0 auto}
.doc-paper strong{font-weight:600;color:#1d1d1f}
.doc-paper ul,.doc-paper ol{padding-left:18px;margin:3px 0 6px}
.doc-paper ul li{margin-bottom:2px}
.doc-paper table{width:100%;border-collapse:collapse;margin:8px 0}
.doc-paper td,.doc-paper th{padding:6px 8px;border-bottom:1px solid #e8e8ed;text-align:left;font-size:9.5pt}
.doc-paper th{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;border-bottom:2px solid #8e8e93}
.ol-sec-title{font-family:Georgia,'Times New Roman',serif;font-size:11pt;font-variant:small-caps;letter-spacing:.5px;color:#1d1d1f;margin:10px 0 2px;border-bottom:1px solid #d0d0d5;padding-bottom:2px}
.ol-r-name{font-family:Georgia,'Times New Roman',serif;font-size:26pt;font-weight:700;text-align:center;color:#1d1d1f;margin-bottom:4px}
.ol-r-contact{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9pt;color:#6e6e73;margin-bottom:4px}
.ol-r-contact a{color:#6e6e73;text-decoration:underline}
.ol-r-sep{color:#aeaeb2;margin:0 4px}
.ol-r-summary{font-family:Georgia,'Times New Roman',serif;font-size:10pt;line-height:1.45;color:#6e6e73;margin-bottom:2px}
.ol-r-skills{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.55;color:#6e6e73;margin-bottom:4px}
.resume-entry{margin:2px 0}
.resume-entry-hd{display:flex;justify-content:space-between;align-items:baseline;margin:3px 0 1px}
.resume-entry-sh{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 1px}
.re-left{font-family:Georgia,'Times New Roman',serif;font-size:10pt}
.re-right{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93;white-space:nowrap;margin-left:12px}
.ol-r-list{margin:1px 0 4px;padding-left:18px}
.ol-r-list li{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.4;margin-bottom:1px;color:#6e6e73}
.ol-r-coursework{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93;margin:1px 0 2px}
.ol-inv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
.ol-inv-name{font-family:Georgia,'Times New Roman',serif;font-size:18pt;font-weight:700;color:#1d1d1f;margin-bottom:1px}
.ol-inv-muted{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93;margin:0}
.ol-inv-meta{text-align:right;font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93}
.ol-inv-meta strong{color:#1d1d1f}
.ol-inv-id{margin:0}
.ol-inv-date{margin:0 0 2px}
.ol-inv-divider{border:none;height:1px;background:#e8e8ed;margin:6px 0 10px}
.ol-inv-billto{font-family:Georgia,'Times New Roman',serif;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;margin:8px 0 3px}
.ol-inv-client{font-family:Georgia,'Times New Roman',serif;font-size:12pt;color:#1d1d1f;margin:0 0 6px}
.ol-inv-tbl thead th{font-family:Georgia,'Times New Roman',serif;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;border-top:1px solid #aeaeb2;border-bottom:1px solid #aeaeb2;padding:5px 8px;text-align:left}
.ol-inv-tbl tbody td{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;padding:5px 8px;border-bottom:1px solid #e8e8ed;color:#6e6e73}
.ol-inv-tbl .ol-inv-r{text-align:right}
.ol-inv-totals{text-align:right;margin:4px 0}
.ol-inv-line{font-family:Georgia,'Times New Roman',serif;display:flex;justify-content:flex-end;gap:20px;font-size:9.5pt;color:#6e6e73;margin:1px 0;padding:0 8px}
.ol-inv-total{font-family:Georgia,'Times New Roman',serif;display:flex;justify-content:flex-end;gap:20px;font-size:11pt;font-weight:700;color:#1d1d1f;margin:3px 0;padding:4px 8px 0;border-top:2px solid #1d1d1f}
.ol-inv-pi{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;color:#6e6e73;margin:2px 0}
.ol-cl-header{text-align:right;margin-bottom:10px}
.ol-cl-name{font-family:Georgia,'Times New Roman',serif;font-size:18pt;font-weight:700;color:#1d1d1f;margin:0}
.ol-cl-position{font-family:Georgia,'Times New Roman',serif;font-size:10pt;font-style:italic;color:#8e8e93;margin:1px 0}
.ol-cl-contact{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93;margin:2px 0 0}
.ol-cl-contact a{color:#8e8e93}
.ol-cl-divider{border:none;height:1px;background:#e8e8ed;margin:4px 0 10px}
.ol-cl-date{font-family:Georgia,'Times New Roman',serif;font-size:10pt;color:#8e8e93;margin:0 0 8px}
.ol-cl-rtitle{font-family:Georgia,'Times New Roman',serif;font-size:11pt;font-weight:600;color:#1d1d1f;margin:0}
.ol-cl-rsub{font-family:Georgia,'Times New Roman',serif;font-size:10pt;color:#6e6e73;margin:0}
.ol-cl-subject{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;color:#1d1d1f;margin:6px 0 8px;padding-bottom:4px;border-bottom:1px solid #e8e8ed}
.ol-cl-greeting{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;color:#1d1d1f;margin:0 0 6px}
.ol-cl-body-p{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.55;color:#6e6e73;margin-bottom:6px}
.ol-cl-close{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;color:#1d1d1f;margin:10px 0 2px}
.ol-cl-signature{font-family:Georgia,'Times New Roman',serif;font-size:12pt;font-weight:700;color:#1d1d1f;margin:0}
.ol-em-subject{font-size:10.5pt;color:#1d1d1f;margin:0 0 2px}
.ol-em-to,.ol-em-from{font-size:9pt;color:#6e6e73;margin:0}
.ol-em-greeting{font-size:10.5pt;color:#1d1d1f;margin:8px 0 6px}
.ol-em-body{font-size:10pt;line-height:1.5;color:#6e6e73;margin-bottom:6px}
.ol-em-closing{font-size:10pt;color:#1d1d1f;margin:10px 0 2px}
.ol-em-sig-name{font-size:10.5pt;font-weight:700;color:#1d1d1f;margin:0}
.ol-em-sig-title{font-size:9pt;color:#8e8e93;margin:0}
.ol-em-sig-email{font-size:9pt;color:#8e8e93;margin:0}
.ol-rpt-title-block{text-align:center;margin-bottom:14px}
.ol-rpt-title{font-family:Georgia,'Times New Roman',serif;font-size:20pt;font-weight:800;color:#1d1d1f;letter-spacing:-.5px;margin:0 0 4px}
.ol-rpt-author{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:10pt;color:#6e6e73;margin:0}
.ol-rpt-date{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9pt;color:#8e8e93;margin:0}
.ol-rpt-abs{margin:10px 0}
.ol-rpt-abs-label{font-family:Georgia,'Times New Roman',serif;display:block;font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;margin-bottom:4px}
.ol-rpt-abs-body{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.5;color:#6e6e73;background:#f5f5f7;border-left:3px solid #aeaeb2;padding:10px 14px;border-radius:0 6px 6px 0}
.ol-rpt-auth-affil{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:8.5pt;color:#8e8e93;margin:0}
.ol-rpt-keywords{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#6e6e73;margin:4px 0}
.ol-doc-title{font-family:Georgia,'Times New Roman',serif;font-size:20pt;font-weight:800;color:#1d1d1f;margin-bottom:4px}
.ol-doc-meta{font-family:'SF Mono','Menlo',monospace;font-size:8.5pt;color:#8e8e93;margin-bottom:8px}
.ol-doc-overview{font-family:Georgia,'Times New Roman',serif;font-size:10pt;line-height:1.45;color:#6e6e73;margin-bottom:8px}
.ol-doc-sub{font-family:Georgia,'Times New Roman',serif;font-size:10pt;font-weight:600;font-style:italic;color:#1d1d1f;margin:4px 0 2px;padding-left:12px}
.ol-doc-code{font-family:'SF Mono','Menlo','Courier New',monospace;font-size:8.5pt;line-height:1.4;background:#f5f5f7;border:1px solid #e8e8ed;border-radius:4px;padding:8px 12px;overflow-x:auto;margin:4px 0;white-space:pre-wrap}
.ol-prop-title{font-family:Georgia,'Times New Roman',serif;font-size:20pt;font-weight:800;text-align:center;color:#1d1d1f;letter-spacing:-.5px;margin:0 0 8px}
.ol-prop-meta{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9.5pt;color:#6e6e73;line-height:1.7;margin-bottom:10px}
.ol-prop-meta strong{color:#8e8e93}
.ol-prop-scope{margin:4px 0}
.ol-prop-scope strong{font-size:9.5pt;color:#1d1d1f}
.ol-prop-tl{margin:4px 0}
.ol-prop-tl strong{color:#1d1d1f}
.ol-gen-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;text-align:center;color:#1d1d1f;margin-bottom:16px;letter-spacing:-.5px}
/* Resume */
.r-name{font-family:Georgia,'Times New Roman',serif;font-size:26pt;font-weight:700;text-align:center;color:#1d1d1f;margin-bottom:4px}
.r-contact{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9pt;color:#6e6e73;margin-bottom:4px}
.r-contact a{color:#6e6e73;text-decoration:underline}
.r-sep{color:#aeaeb2;margin:0 4px}
.r-section{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1d1d1f;margin:9px 0 3px;border-bottom:1px solid #e8e8ed;padding-bottom:2px}
.r-text{font-family:Georgia,'Times New Roman',serif;font-size:10pt;line-height:1.45;color:#6e6e73;margin-bottom:4px}
.r-edu-block{margin:3px 0}
.r-edu-header{display:flex;justify-content:space-between;align-items:baseline}
.r-school{font-weight:700;font-size:10pt}
.r-edu-dates{font-size:9pt;color:#8e8e93;white-space:nowrap;margin-left:12px}
.r-degree{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;color:#6e6e73}
.r-coursework{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93;margin:2px 0}
.r-exp-block{margin:4px 0}
.r-exp-header{display:flex;justify-content:space-between;align-items:baseline}
.r-role{font-size:10pt;color:#1d1d1f}
.r-dates{font-size:9pt;color:#8e8e93;white-space:nowrap;margin-left:12px}
.r-company{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;color:#6e6e73;margin-bottom:2px}
.r-list{margin:2px 0 4px;padding-left:18px}
.r-list li{font-size:9.5pt;line-height:1.45;margin-bottom:1.5px;color:#6e6e73}
.r-skills{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.55;color:#6e6e73;margin-bottom:4px}
/* Cover Letter */
.cl-wrapper{max-width:490px;margin:0 auto}
.cl-sender{text-align:right;font-size:9pt;color:#6e6e73;line-height:1.6;margin-bottom:14px}
.cl-name{font-size:10.5pt;font-weight:700;color:#1d1d1f}
.cl-position{font-size:9pt;font-style:italic;color:#8e8e93;margin:1px 0}
.cl-divider{height:1px;background:#e8e8ed;margin:8px 0 12px;border:none}
.cl-date{font-size:9pt;color:#8e8e93;margin-bottom:10px}
.cl-recipient{font-size:9pt;color:#6e6e73;line-height:1.6;margin-bottom:6px}
.cl-recipient-name{font-size:11pt;font-weight:600;color:#1d1d1f}
.cl-company{font-size:10pt;color:#6e6e73}
.cl-subject{font-size:10pt;font-weight:600;color:#1d1d1f;margin-bottom:8px;padding-bottom:3px;border-bottom:1px solid #f0f0f2}
.cl-greeting{font-size:10pt;margin-bottom:7px;color:#1d1d1f}
.cl-body{font-size:10pt;line-height:1.55;color:#1d1d1f}
.cl-body p{margin-bottom:6px;text-align:justify}
.cl-closing{margin-top:12px;font-size:10pt;color:#1d1d1f}
.cl-sig-name{font-size:10pt;font-weight:700;color:#1d1d1f;margin-top:2px}
/* Invoice */
.inv-wrapper{max-width:520px;margin:0 auto}
.inv-header{display:flex;justify-content:space-between;margin-bottom:16px}
.inv-from{font-size:8.5pt;color:#6e6e73;line-height:1.5}
.inv-company{font-size:14pt;font-weight:700;color:#1d1d1f;margin-bottom:2px}
.inv-muted{font-size:8.5pt;color:#8e8e93}
.inv-meta{text-align:right;font-size:8.5pt;color:#6e6e73;line-height:1.5}
.inv-meta-label{font-size:10pt;font-weight:700;color:#1d1d1f}
.inv-number{font-size:10pt;font-weight:600;color:#1d1d1f}
.inv-divider{border:none;height:1px;background:#e8e8ed;margin:6px 0 10px}
.inv-bill-section{margin-bottom:14px}
.inv-label{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;margin-bottom:2px}
.inv-client{font-size:10pt;color:#1d1d1f;line-height:1.5}
.inv-table{width:100%;border-collapse:collapse;margin-bottom:10px}
.inv-table th{font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#8e8e93;letter-spacing:.5px;border-bottom:1px solid #e8e8ed;padding:4px 6px;text-align:left}
.inv-table td{font-size:9pt;padding:5px 6px;border-bottom:1px solid #f0f0f2}
.inv-table .inv-r{text-align:right}
.inv-totals{text-align:right;margin-bottom:12px}
.inv-line{font-size:9pt;color:#6e6e73;margin-bottom:2px;display:flex;justify-content:flex-end;gap:20px}
.inv-grand{font-size:11pt;font-weight:700;color:#1d1d1f;margin-top:4px;padding-top:4px;border-top:2px solid #1d1d1f;display:flex;justify-content:flex-end;gap:20px}
.inv-pi{font-size:9pt;color:#6e6e73;margin:2px 0}
/* Email */
.em-wrapper{max-width:560px;margin:0 auto}
.em-header-bar{height:4px;background:#6b8ba8;border-radius:4px 4px 0 0;margin-bottom:0}
.em-outer{border:1px solid #e8e8ed;border-top:none;padding:16px 20px;border-radius:0 0 6px 6px}
.em-subject-line{font-size:10pt;color:#1d1d1f;margin-bottom:2px}
.em-to-line{font-size:9pt;color:#6e6e73;margin:0}
.em-divider{border:none;height:1px;background:#e8e8ed;margin:8px 0}
.em-greeting-text{font-size:10pt;color:#1d1d1f;margin:8px 0 6px}
.em-body-content{font-size:10pt;line-height:1.5;color:#333;margin-bottom:6px}
.em-body-content p{margin-bottom:6px}
.em-closing-text{font-size:10pt;color:#1d1d1f;margin:10px 0 2px}
.em-sig-block{margin-top:8px}
.em-sig-name{font-size:10.5pt;font-weight:700;color:#1d1d1f;margin:0}
.em-sig-detail{font-size:9pt;color:#8e8e93;margin:0}
/* Proposal */
.prop-wrapper{max-width:520px;margin:0 auto}
.prop-cover-page{border-bottom:2px solid #d0d0d5;margin-bottom:16px;padding-bottom:14px}
.prop-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;text-align:center;color:#1d1d1f;letter-spacing:-.5px;margin:0 0 8px}
.prop-meta{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9.5pt;color:#6e6e73;line-height:1.7;margin-bottom:10px}
.prop-card{border:1px solid #e8e8ed;border-radius:6px;padding:10px 12px;margin:6px 0}
.prop-card-title{font-size:10pt;font-weight:600;color:#1d1d1f;margin-bottom:2px}
.prop-pricing-table{width:100%;border-collapse:collapse;margin:8px 0}
.prop-pricing-table th{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;border-bottom:1px solid #aeaeb2;padding:4px 8px;text-align:left}
.prop-pricing-table td{font-size:9pt;padding:4px 8px;border-bottom:1px solid #f0f0f2}
.prop-tl{font-size:9.5pt;color:#6e6e73;margin:4px 0}
/* Report */
.rpt-wrapper{max-width:520px;margin:0 auto}
.rpt-title-page{text-align:center;margin-bottom:16px}
.rpt-main-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;color:#1d1d1f;margin-bottom:4px}
.rpt-author{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:10pt;color:#6e6e73;margin:0}
.rpt-date{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9pt;color:#8e8e93;margin:0}
.rpt-abstract{margin:10px 0}
.rpt-abstract-label{font-family:Georgia,'Times New Roman',serif;display:block;font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;margin-bottom:4px}
.rpt-abstract-body{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.5;color:#6e6e73;background:#f5f5f7;border-left:3px solid #aeaeb2;padding:10px 14px;border-radius:0 6px 6px 0}
/* Documentation */
.doc-wrapper{max-width:520px;margin:0 auto}
.doc-title-page{margin-bottom:14px}
.doc-main-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;color:#1d1d1f;margin-bottom:4px}
.doc-meta{font-family:'SF Mono','Menlo',monospace;font-size:8.5pt;color:#8e8e93;margin-bottom:8px}
.doc-overview{font-family:Georgia,'Times New Roman',serif;font-size:10pt;line-height:1.45;color:#6e6e73;margin-bottom:8px}
.doc-sub{font-family:Georgia,'Times New Roman',serif;font-size:10pt;font-weight:600;font-style:italic;color:#1d1d1f;margin:4px 0 2px;padding-left:12px}
.doc-code{font-family:'SF Mono','Menlo','Courier New',monospace;font-size:8.5pt;line-height:1.4;background:#f5f5f7;border:1px solid #e8e8ed;border-radius:4px;padding:8px 12px;overflow-x:auto;margin:4px 0;white-space:pre-wrap}
/* Generic */
.gen-wrapper{max-width:520px;margin:0 auto}
.gen-main-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;text-align:center;color:#1d1d1f;margin-bottom:8px}
.gen-meta{text-align:center;font-size:9pt;color:#8e8e93;margin-bottom:12px}
@media print{@page{margin:15mm 18mm}body{background:#fff}.doc-paper{box-shadow:none;padding:0;margin:0;width:auto;min-height:auto}}
.jr-layout{display:flex;width:100%;min-height:296mm;background:#fff}
.jr-sidebar{width:35%;background:#2c3e50;color:#ecf0f1;padding:28px 18px 20px;font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,sans-serif}
.jr-sidebar-header{margin-bottom:16px}
.jr-name{font-size:18pt;font-weight:700;color:#fff;line-height:1.2;margin-bottom:4px}
.jr-title{font-size:9pt;color:#95a5a6;font-weight:400}
.jr-section{margin-bottom:16px}
.jr-section-title{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#95a5a6;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid rgba(255,255,255,.1)}
.jr-contact-item{display:block;font-size:8.5pt;color:#ecf0f1;margin-bottom:3px;line-height:1.4}
.jr-link{color:#5dade2;text-decoration:none}
.jr-edu-item{margin-bottom:8px}
.jr-edu-degree{font-size:9pt;font-weight:600;color:#fff}
.jr-edu-school{font-size:8pt;color:#bdc3c7}
.jr-edu-date{font-size:7.5pt;color:#95a5a6}
.jr-edu-gpa{font-size:7.5pt;color:#95a5a6}
.jr-skills{display:flex;flex-wrap:wrap;gap:4px}
.jr-skill-tag{display:inline-block;font-size:7.5pt;background:rgba(255,255,255,.1);color:#ecf0f1;padding:2px 6px;border-radius:2px}
.jr-main{width:65%;padding:28px 24px 20px;font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,sans-serif;color:#2c3e50}
.jr-section-main{margin-bottom:14px}
.jr-section-title-main{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2c3e50;margin-bottom:6px;padding-bottom:3px;border-bottom:2px solid #2c3e50}
.jr-text{font-size:9pt;line-height:1.5;color:#555;margin:0}
.jr-exp-item{margin-bottom:8px}
.jr-exp-header{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;margin-bottom:2px}
.jr-exp-role{font-size:9.5pt;font-weight:600;color:#2c3e50}
.jr-exp-company{font-size:9pt;color:#555}
.jr-exp-dates{font-size:8pt;color:#95a5a6;margin-left:auto}
.jr-list{margin:2px 0 4px;padding-left:16px}
.jr-list li{font-size:8.5pt;line-height:1.45;color:#555;margin-bottom:1px}
.jr-tech{font-size:8pt;color:#7f8c8d;font-style:italic;margin-bottom:2px}
@media print{@page{margin:12mm 15mm;size:A4}body{background:#fff}.jr-layout{box-shadow:none}.jr-sidebar{background:#2c3e50!important;color:#ecf0f1!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.jr-sidebar-header{background:#2c3e50!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.jr-section-title{color:#95a5a6!important}.jr-skill-tag{background:rgba(255,255,255,.1)!important;color:#ecf0f1!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.jr-section-title-main{border-bottom:2px solid #2c3e50!important}}
`
    },
    download(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100) },



    async doExport(fmt) {
      this.exportOpen = false
      const content = this.getDocContent()
      const label = docLabels[this.docType] || 'document'
      const css = this.getExportCSS()

      if (fmt === 'template' && this.docData) {
        const tmplHtml = renderDocument(this.docData, 'jakes_resume')
        const tmplCss = this.getExportCSS()
        const w = window.open('', '_blank')
        if (w) {
          const doc = w.document
          doc.open()
          doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resume</title><style>' + tmplCss + '</style></head><body style="background:#e8e8ed;display:flex;justify-content:center;padding:20px;font-family:sans-serif">' + tmplHtml + '</body></html>')
          doc.close()
          this.toastMsg('Template preview opened — use Ctrl+P / Cmd+P to save as PDF')
        } else {
          this.toastMsg('Pop-up blocked. Allow pop-ups for this site.', '#ff9f0a')
        }
        return
      }

      if (fmt === 'pdf' || fmt === 'print') { window.print(); this.toastMsg('Use Save as PDF in the print dialog'); return }

      if (fmt === 'copy-text') {
        const d = document.createElement('div'); d.innerHTML = content
        const text = d.textContent || ''
        try { await navigator.clipboard.writeText(text); this.toastMsg('Text copied!') } catch { this.toastMsg('Copy failed', '#ff453a') }
        return
      }

      if (fmt === 'copy-html') {
        const full = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body><div class="doc-paper">' + content + '</div></body></html>'
        try { await navigator.clipboard.writeText(full); this.toastMsg('HTML copied!') } catch { this.toastMsg('Copy failed', '#ff453a') }
        return
      }

      if (fmt === 'html') {
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + label + '</title><style>' + css + '</style></head><body style="background:#f0f0f2;display:flex;justify-content:center;padding:20px"><div class="doc-paper">' + content + '</div></body></html>'
        this.download(new Blob([html], { type: 'text/html' }), label + '.html')
        this.toastMsg('HTML exported!')
        return
      }

      if (fmt === 'docx') {
        const docXml = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>' + css + ' body{margin:0;padding:0;background:#fff}.doc-paper{box-shadow:none;border:none;padding:2.5cm 3cm;margin:0;width:100%;min-height:29.7cm}</style></head><body><div class="doc-paper">' + content + '</div></body></html>'
        this.download(new Blob([docXml], { type: 'application/msword' }), label + '.doc')
        this.toastMsg('Word document downloaded!')
      }
    },


  },
  mounted() {
    this.checkResume()
    this.checkTokenOnFocus()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkTokenOnFocus()
    })
    document.addEventListener('click', (e) => {
      if (this.exportOpen && !this.$refs.exportWrap?.contains(e.target)) this.exportOpen = false
      if (this.userMenuOpen && !this.$refs.userMenu?.contains(e.target) && !this.$refs.wsUserMenu?.contains(e.target)) this.userMenuOpen = false
    })
  },
  watch: {
    '$route.query': {
      handler(q) {
        if (q.resume) this.checkResume()
      },
      immediate: true,
    },
  },
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

:root {
  --bg: #0a0a0e;
  --surface: #111116;
  --card: #16161c;
  --elevated: #1d1d25;
  --border: rgba(255,255,255,0.05);
  --border-light: rgba(255,255,255,0.08);
  --text: #e8eaed;
  --text-muted: #90949e;
  --text-dim: #5f6368;
  --accent: #4682b4;
  --accent-hover: #5a9bd5;
  --accent-glow: rgba(70,130,180,0.12);
  --green: #34c759;
  --red: #ff453a;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --font: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'DM Serif Display', serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font); background: var(--bg); color: var(--text); overflow: hidden; height: 100vh; -webkit-font-smoothing: antialiased; }

/* Toast */
.toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(16px); padding: 10px 22px; border-radius: 999px; color: #fff; font-size: 13px; font-weight: 500; z-index: 9999; opacity: 0; transition: all 0.35s cubic-bezier(0.16,1,0.3,1); pointer-events: none; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* Landing */
.landing { height: 100vh; overflow-y: auto; display: flex; flex-direction: column; background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(70,130,180,0.04), transparent 70%), var(--bg); }
.lp-header { display: flex; align-items: center; padding: 16px 32px; border-bottom: 1px solid var(--border); background: rgba(6,6,8,0.85); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 10; flex-shrink: 0; }
.lp-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 17px; letter-spacing: -0.3px; color: var(--text); }
.lp-logo svg { color: var(--accent); }
.lp-header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.lp-h-link { font-size: 13px; color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.lp-h-link:hover { color: var(--accent); }
.lp-h-btn { padding: 6px 16px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.lp-h-btn:hover { background: var(--accent-hover); }
.user-menu { position: relative; }
.user-trigger { display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; border-radius: 999px; border: 1px solid var(--border); background: transparent; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
.user-trigger:hover { border-color: var(--accent); }
.user-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.user-name { font-size: 12px; color: var(--text); font-weight: 500; }
.user-plan { font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.3px; background: rgba(255,255,255,0.04); padding: 1px 6px; border-radius: 4px; }
.user-dropdown { position: absolute; top: 100%; right: 0; margin-top: 6px; background: var(--elevated); border: 1px solid var(--border-light); border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,0.4); min-width: 220px; z-index: 100; padding: 4px; backdrop-filter: blur(20px); }
.ud-user { padding: 10px 12px 6px; }
.ud-name { display: block; font-size: 13px; font-weight: 600; }
.ud-email { display: block; font-size: 11px; color: var(--text-dim); margin-top: 1px; }
.ud-usage { padding: 8px 12px 6px; }
.ud-u-label { font-size: 10px; color: var(--text-dim); margin-bottom: 4px; }
.ud-u-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; margin-bottom: 3px; }
.ud-u-fill { height: 100%; border-radius: 999px; background: var(--accent); transition: width 0.3s; }
.ud-u-text { font-size: 10px; color: var(--text-muted); }
.ud-item { display: flex; align-items: center; width: 100%; padding: 8px 12px; border: none; background: none; font-size: 12px; text-align: left; cursor: pointer; border-radius: 6px; color: var(--text); text-decoration: none; transition: background 0.15s; font-family: var(--font); }
.ud-item:hover { background: rgba(255,255,255,0.04); }
.ud-logout { color: var(--red); }
.ud-divider { height: 1px; background: var(--border); margin: 3px 0; }
.lp-main { max-width: 1100px; margin: 0 auto; padding: 40px 32px 60px; display: flex; flex-direction: column; align-items: center; flex: 1; width: 100%; }
.lp-hero { text-align: center; margin-bottom: 28px; max-width: 560px; }
.hero-title { font-family: var(--font-display); font-size: clamp(36px, 5vw, 60px); font-weight: 400; letter-spacing: -0.5px; line-height: 1.05; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; gap: 0; }
.hero-word { color: var(--text); }
.hero-word-accent { font-style: italic; color: var(--accent); font-size: 1.15em; display: block; margin-top: -2px; }
.lp-hero p { color: var(--text-muted); font-size: 15px; line-height: 1.6; }
.lp-prompt-card { background: var(--card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 6px; margin-bottom: 20px; transition: border-color 0.2s; width: 100%; max-width: 640px; }
.lp-prompt-card:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.lp-prompt-inner { display: flex; align-items: flex-end; gap: 4px; padding: 4px; }
.lp-prompt-inner textarea { flex: 1; border: none; outline: none; resize: none; font-family: var(--font); font-size: 15px; padding: 10px 8px; line-height: 1.5; background: transparent; color: var(--text); max-height: 320px; transition: box-shadow 0.3s ease; }
.lp-prompt-inner textarea::placeholder { color: var(--text-dim); }
.lp-prompt-inner textarea:focus { box-shadow: 0 0 0 2px rgba(107,139,168,0.15); }
.lp-attach-btn { width: 34px; height: 34px; border-radius: 8px; border: none; background: transparent; color: var(--text-dim); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-bottom: 2px; }
.lp-attach-btn:hover { color: var(--accent); background: var(--accent-glow); }
.lp-send-btn { width: 38px; height: 38px; border-radius: 10px; border: none; background: var(--accent); color: #fff; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
.lp-send-btn:hover { opacity: 0.9; transform: scale(1.05); }
.lp-send-btn:active { transform: scale(0.93); }
.lp-send-btn:disabled { opacity: 0.25; cursor: not-allowed; transform: none; }
.lp-file-badge { display: flex; align-items: center; gap: 6px; padding: 6px 14px 4px; font-size: 12px; color: var(--text-muted); }
.lp-file-badge svg { color: var(--accent); flex-shrink: 0; }
.lpf-name { font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lpf-size { color: var(--text-dim); font-size: 11px; flex-shrink: 0; }
.lpf-remove { background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 4px; transition: all 0.15s; flex-shrink: 0; }
.lpf-remove:hover { color: var(--red); background: rgba(255,69,58,0.08); }
.lp-detection { display: flex; align-items: center; gap: 6px; padding: 6px 14px 8px; font-size: 12px; color: var(--accent); }
.detect-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.lp-categories { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; justify-content: center; }
.lp-cat { padding: 6px 16px; border-radius: 999px; border: 1px solid var(--border); background: transparent; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-muted); transition: all 0.2s; font-family: var(--font); }
.lp-cat:hover { border-color: var(--accent); color: var(--text); }
.lp-cat.active { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }
.lp-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; width: 100%; }
.lp-card { border-radius: var(--radius-md); background: var(--card); border: 1px solid var(--border); cursor: pointer; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); padding: 16px; text-align: center; width: 155px; position: relative; overflow: hidden; }
.lp-card::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(70,130,180,0.06), transparent 50%); opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
.lp-card:hover { border-color: rgba(70,130,180,0.2); background: var(--elevated); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(70,130,180,0.06), 0 2px 8px rgba(0,0,0,0.2); }
.lp-card:hover::before { opacity: 1; }
.lpc-icon { font-size: 28px; margin-bottom: 10px; position: relative; z-index: 1; }
.lpc-label { font-size: 14px; font-weight: 600; margin-bottom: 3px; color: var(--text); position: relative; z-index: 1; }
.lpc-desc { font-size: 11px; color: var(--text-dim); position: relative; z-index: 1; }
/* Upload zone on landing */
.lp-upload-zone { grid-column: 1 / -1; border-radius: var(--radius); background: var(--card); border: 1.5px dashed var(--border-light); cursor: pointer; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); padding: 24px; text-align: center; }
.lp-upload-zone:hover { border-color: var(--accent); background: var(--elevated); }
.lp-upload-zone.drag { border-color: var(--accent); background: var(--accent-glow); transform: scale(1.01); }
.uz-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--text-dim); }
.uz-empty svg { opacity: 0.3; }
.uz-title { font-size: 14px; font-weight: 600; color: var(--text-muted); }
.uz-hint { font-size: 11px; color: var(--text-dim); }
.uz-loaded { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.uz-icon { margin-bottom: 2px; }
.uz-name { font-size: 13px; font-weight: 600; color: var(--text); word-break: break-all; max-width: 100%; }
.uz-status { font-size: 11px; color: var(--accent); }
.uz-detect { font-size: 10px; color: var(--text-dim); }
.uz-detect span { color: var(--accent); font-weight: 600; }
.uz-clear { background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 11px; padding: 4px 10px; border-radius: 6px; transition: all 0.15s; }
.uz-clear:hover { color: var(--red); background: rgba(255,69,58,0.08); }


/* Attach button in workspace chat */
.ci-row { display: flex; gap: 6px; width: 100%; align-items: flex-end; }
.ci-attach { width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text-dim); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.ci-attach:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
.ci-attach:active { transform: scale(0.92); }

/* Workspace file badge */
.ws-file-badge { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
.ws-fb-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.ws-fb-size { color: var(--text-dim); flex-shrink: 0; }

/* Workspace */
.workspace { height: 100vh; display: flex; flex-direction: column; background: var(--bg); }
.ws-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 18px; background: rgba(7,7,10,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); flex-shrink: 0; position: relative; z-index: 20; }
.ws-header-left { display: flex; align-items: center; gap: 10px; }
.ws-header-divider { width: 1px; height: 20px; background: var(--border-light); }
.ws-back-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; transition: all 0.2s; }
.ws-back-btn:hover { color: var(--accent); }
.ws-title { font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: -0.2px; }
.ws-type-badge { padding: 3px 12px; border-radius: 999px; background: var(--accent-glow); border: 1px solid rgba(107,139,168,0.2); color: var(--accent); font-size: 11px; font-weight: 600; }
.ws-header-right { display: flex; align-items: center; gap: 10px; }
.ws-zoom { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-dim); }
.ws-zoom button { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 2px 7px; cursor: pointer; color: var(--text-muted); font-size: 13px; transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
.ws-zoom button:hover { border-color: var(--accent); color: var(--accent); }
.ws-zoom button:active { transform: scale(0.92); }
.ws-zoom span { min-width: 36px; text-align: center; }
.export-wrap { position: relative; }
.export-trigger { padding: 5px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; gap: 6px; transition: all 0.2s cubic-bezier(0.16,1,0.3,1); font-family: var(--font); }
.export-trigger:hover { border-color: var(--accent); color: var(--accent); }
.export-trigger:active { transform: scale(0.97); }
.export-menu { position: absolute; top: 100%; right: 0; margin-top: 6px; background: var(--elevated); border: 1px solid var(--border-light); border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,0.4); min-width: 170px; z-index: 100; padding: 4px; backdrop-filter: blur(20px); }
.em-item { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 8px 12px; border: none; background: none; font-size: 12px; text-align: left; cursor: pointer; border-radius: 6px; color: var(--text); transition: background 0.15s; font-family: var(--font); }
.em-item:hover { background: rgba(255,255,255,0.04); }
.em-shortcut { font-size: 10px; color: var(--text-dim); }
.em-divider { height: 1px; background: var(--border); margin: 3px 0; }

/* Workspace body */
.ws-body { display: flex; flex: 1; overflow: hidden; }

/* Chat panel */
.chat-panel { width: 360px; border-right: 1px solid var(--border); background: var(--surface); display: flex; flex-direction: column; flex-shrink: 0; }
.chat-header { padding: 10px 16px; border-bottom: 1px solid var(--border); background: var(--bg); }
.chat-header-left { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
.chat-header-left svg { color: var(--accent); width: 14px; height: 14px; }
.chat-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; min-height: 0; background: rgba(0,0,0,0.12); }
.chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 32px 20px; text-align: center; color: var(--text-dim); font-size: 13px; line-height: 1.5; margin-top: auto; }
.chat-empty svg { opacity: 0.2; }
.msg { display: flex; gap: 6px; margin-bottom: 2px; }
.msg.user { justify-content: flex-end; }
.msg-content { padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.55; max-width: 100%; word-break: break-word; font-weight: 450; }
.msg.user .msg-content { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
.msg.agent .msg-content { background: var(--card); color: var(--text); border-bottom-left-radius: 4px; border: 1px solid var(--border); }
.loading-dots span { animation: dotPulse 1.4s infinite; opacity: 0; font-size: 16px; line-height: 0.5; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotPulse { 0%,60%,100% { opacity: 0; } 30% { opacity: 1; } }
.chat-input-area { border-top: 1px solid var(--border); padding: 12px 14px; background: var(--bg); }
.chat-input-area textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 13px; font-family: var(--font); resize: none; outline: none; background: var(--card); color: var(--text); transition: border-color 0.2s; min-height: 36px; }
.chat-input-area textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
.chat-input-area textarea::placeholder { color: var(--text-dim); font-size: 13px; }
.chat-send-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: var(--accent); color: #fff; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 8px; align-self: flex-end; }
.chat-send-btn:hover { background: var(--accent-hover); }
.chat-send-btn:active { transform: scale(0.93); }
.chat-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Editor panel */
.editor-panel { flex: 1; overflow: auto; background: var(--bg); position: relative; }
.loading-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10; overflow: hidden; background: rgba(255,255,255,0.04); }
.loading-bar-inner { height: 100%; background: linear-gradient(90deg, transparent, var(--accent), transparent); animation: loadBar 1.5s ease-in-out infinite; width: 40%; }
@keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
.editor-container { padding: 24px; min-height: 100%; display: flex; flex-direction: column; align-items: center; }

/* Skeleton */
.skeleton-doc { width: 210mm; padding: 22mm 20mm 18mm; margin: 24px 0; }
.sk-block { background: rgba(255,255,255,0.04); border-radius: 6px; margin-bottom: 6px; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
.w-18 { width: 18%; } .w-25 { width: 25%; } .w-30 { width: 30%; } .w-35 { width: 35%; } .w-40 { width: 40%; } .w-42 { width: 42%; }
.w-55 { width: 55%; } .w-60 { width: 60%; } .w-65 { width: 65%; } .w-68 { width: 68%; } .w-70 { width: 70%; } .w-72 { width: 72%; }
.w-75 { width: 75%; } .w-78 { width: 78%; } .w-80 { width: 80%; } .w-82 { width: 82%; } .w-85 { width: 85%; } .w-88 { width: 88%; }
.w-90 { width: 90%; } .w-92 { width: 92%; } .w-95 { width: 95%; }

/* Document paper — white sheet, like a real printed page */
.doc-paper { width: 210mm; min-height: 296mm; background: #fff; color: #1d1d1f; padding: 22mm 20mm 18mm; box-shadow: 0 2px 24px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08); font-family: Calibri, 'Segoe UI', -apple-system, Arial, sans-serif; font-size: 10.5pt; line-height: 1.35; outline: none; border-radius: 2px; margin: 12px 0 40px; overflow: hidden; }
.doc-paper strong { font-weight: 600; color: #1d1d1f; }
.doc-paper ul, .doc-paper ol { padding-left: 18px; }






/* Template system — white-paper colors */
.ol-sec-title { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; font-variant: small-caps; letter-spacing: 0.5px; color: #1d1d1f; margin: 10px 0 2px; border-bottom: 1px solid #d0d0d5; padding-bottom: 2px; }

/* New renderer classes */
.r-name{font-family:Georgia,'Times New Roman',serif;font-size:26pt;font-weight:700;text-align:center;color:#1d1d1f;margin-bottom:4px}
.r-contact{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9pt;color:#6e6e73;margin-bottom:4px}
.r-contact a{color:#6e6e73;text-decoration:underline}
.r-sep{color:#aeaeb2;margin:0 4px}
.r-section{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1d1d1f;margin:9px 0 3px;border-bottom:1px solid #e8e8ed;padding-bottom:2px}
.r-text{font-family:Georgia,'Times New Roman',serif;font-size:10pt;line-height:1.45;color:#6e6e73;margin-bottom:4px}
.r-edu-block{margin:3px 0}
.r-edu-header{display:flex;justify-content:space-between;align-items:baseline}
.r-school{font-weight:700;font-size:10pt}
.r-edu-dates{font-size:9pt;color:#8e8e93;white-space:nowrap;margin-left:12px}
.r-degree{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;color:#6e6e73}
.r-coursework{font-family:Georgia,'Times New Roman',serif;font-size:9pt;color:#8e8e93;margin:2px 0}
.r-exp-block{margin:4px 0}
.r-exp-header{display:flex;justify-content:space-between;align-items:baseline}
.r-role{font-size:10pt;color:#1d1d1f}
.r-dates{font-size:9pt;color:#8e8e93;white-space:nowrap;margin-left:12px}
.r-company{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;color:#6e6e73;margin-bottom:2px}
.r-list{margin:2px 0 4px;padding-left:18px}
.r-list li{font-size:9.5pt;line-height:1.45;margin-bottom:1.5px;color:#6e6e73}
.r-skills{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.55;color:#6e6e73;margin-bottom:4px}
.cl-wrapper{max-width:490px;margin:0 auto}
.cl-sender{text-align:right;font-size:9pt;color:#6e6e73;line-height:1.6;margin-bottom:14px}
.cl-name{font-size:10.5pt;font-weight:700;color:#1d1d1f}
.cl-position{font-size:9pt;font-style:italic;color:#8e8e93;margin:1px 0}
.cl-divider{height:1px;background:#e8e8ed;margin:8px 0 12px;border:none}
.cl-date{font-size:9pt;color:#8e8e93;margin-bottom:10px}
.cl-recipient{font-size:9pt;color:#6e6e73;line-height:1.6;margin-bottom:6px}
.cl-recipient-name{font-size:11pt;font-weight:600;color:#1d1d1f}
.cl-company{font-size:10pt;color:#6e6e73}
.cl-subject{font-size:10pt;font-weight:600;color:#1d1d1f;margin-bottom:8px;padding-bottom:3px;border-bottom:1px solid #f0f0f2}
.cl-greeting{font-size:10pt;margin-bottom:7px;color:#1d1d1f}
.cl-body{font-size:10pt;line-height:1.55;color:#1d1d1f}
.cl-body p{margin-bottom:6px;text-align:justify}
.cl-closing{margin-top:12px;font-size:10pt;color:#1d1d1f}
.cl-sig-name{font-size:10pt;font-weight:700;color:#1d1d1f;margin-top:2px}
.inv-wrapper{max-width:520px;margin:0 auto}
.inv-header{display:flex;justify-content:space-between;margin-bottom:16px}
.inv-from{font-size:8.5pt;color:#6e6e73;line-height:1.5}
.inv-company{font-size:14pt;font-weight:700;color:#1d1d1f;margin-bottom:2px}
.inv-muted{font-size:8.5pt;color:#8e8e93}
.inv-meta{text-align:right;font-size:8.5pt;color:#6e6e73;line-height:1.5}
.inv-meta-label{font-size:10pt;font-weight:700;color:#1d1d1f}
.inv-number{font-size:10pt;font-weight:600;color:#1d1d1f}
.inv-divider{border:none;height:1px;background:#e8e8ed;margin:6px 0 10px}
.inv-bill-section{margin-bottom:14px}
.inv-label{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;margin-bottom:2px}
.inv-client{font-size:12pt;color:#1d1d1f;line-height:1.5}
.inv-table{width:100%;border-collapse:collapse;margin-bottom:10px}
.inv-table th{font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#8e8e93;letter-spacing:.5px;border-bottom:1px solid #e8e8ed;padding:4px 6px;text-align:left}
.inv-table td{font-size:9pt;padding:5px 6px;border-bottom:1px solid #f0f0f2}
.inv-table .inv-r{text-align:right}
.inv-totals{text-align:right;margin-bottom:12px}
.inv-line{font-size:9pt;color:#6e6e73;margin-bottom:2px;display:flex;justify-content:flex-end;gap:20px}
.inv-grand{font-size:11pt;font-weight:700;color:#1d1d1f;margin-top:4px;padding-top:4px;border-top:2px solid #1d1d1f;display:flex;justify-content:flex-end;gap:20px}
.inv-pi{font-size:9pt;color:#6e6e73;margin:2px 0}
.em-wrapper{max-width:560px;margin:0 auto}
.em-header-bar{height:4px;background:#6b8ba8;border-radius:4px 4px 0 0;margin-bottom:0}
.em-outer{border:1px solid #e8e8ed;border-top:none;padding:16px 20px;border-radius:0 0 6px 6px}
.em-subject-line{font-size:10pt;color:#1d1d1f;margin-bottom:2px}
.em-to-line{font-size:9pt;color:#6e6e73;margin:0}
.em-divider{border:none;height:1px;background:#e8e8ed;margin:8px 0}
.em-greeting-text{font-size:10pt;color:#1d1d1f;margin:8px 0 6px}
.em-body-content{font-size:10pt;line-height:1.5;color:#333;margin-bottom:6px}
.em-body-content p{margin-bottom:6px}
.em-closing-text{font-size:10pt;color:#1d1d1f;margin:10px 0 2px}
.em-sig-block{margin-top:8px}
.em-sig-name{font-size:10.5pt;font-weight:700;color:#1d1d1f;margin:0}
.em-sig-detail{font-size:9pt;color:#8e8e93;margin:0}
.prop-wrapper{max-width:520px;margin:0 auto}
.prop-cover-page{border-bottom:2px solid #d0d0d5;margin-bottom:16px;padding-bottom:14px}
.prop-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;text-align:center;color:#1d1d1f;letter-spacing:-.5px;margin:0 0 8px}
.prop-meta{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9.5pt;color:#6e6e73;line-height:1.7;margin-bottom:10px}
.prop-card{border:1px solid #e8e8ed;border-radius:6px;padding:10px 12px;margin:6px 0}
.prop-card-title{font-size:10pt;font-weight:600;color:#1d1d1f;margin-bottom:2px}
.prop-pricing-table{width:100%;border-collapse:collapse;margin:8px 0}
.prop-pricing-table th{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;border-bottom:1px solid #aeaeb2;padding:4px 8px;text-align:left}
.prop-pricing-table td{font-size:9pt;padding:4px 8px;border-bottom:1px solid #f0f0f2}
.prop-tl{font-size:9.5pt;color:#6e6e73;margin:4px 0}
.rpt-wrapper{max-width:520px;margin:0 auto}
.rpt-title-page{text-align:center;margin-bottom:16px}
.rpt-main-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;color:#1d1d1f;margin-bottom:4px}
.rpt-author{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:10pt;color:#6e6e73;margin:0}
.rpt-date{font-family:Georgia,'Times New Roman',serif;text-align:center;font-size:9pt;color:#8e8e93;margin:0}
.rpt-abstract{margin:10px 0}
.rpt-abstract-label{font-family:Georgia,'Times New Roman',serif;display:block;font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8e8e93;margin-bottom:4px}
.rpt-abstract-body{font-family:Georgia,'Times New Roman',serif;font-size:9.5pt;line-height:1.5;color:#6e6e73;background:#f5f5f7;border-left:3px solid #aeaeb2;padding:10px 14px;border-radius:0 6px 6px 0}
.doc-wrapper{max-width:520px;margin:0 auto}
.doc-title-page{margin-bottom:14px}
.doc-main-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;color:#1d1d1f;margin-bottom:4px}
.doc-meta{font-family:'SF Mono','Menlo',monospace;font-size:8.5pt;color:#8e8e93;margin-bottom:8px}
.doc-overview{font-family:Georgia,'Times New Roman',serif;font-size:10pt;line-height:1.45;color:#6e6e73;margin-bottom:8px}
.doc-sub{font-family:Georgia,'Times New Roman',serif;font-size:10pt;font-weight:600;font-style:italic;color:#1d1d1f;margin:4px 0 2px;padding-left:12px}
.doc-code{font-family:'SF Mono','Menlo','Courier New',monospace;font-size:8.5pt;line-height:1.4;background:#f5f5f7;border:1px solid #e8e8ed;border-radius:4px;padding:8px 12px;overflow-x:auto;margin:4px 0;white-space:pre-wrap}
.gen-wrapper{max-width:520px;margin:0 auto}
.gen-main-title{font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:800;text-align:center;color:#1d1d1f;margin-bottom:8px}
.gen-meta{text-align:center;font-size:9pt;color:#8e8e93;margin-bottom:12px}







/* ── Document Page (A4 Paper) ── */
#docPageWrapper{display:flex;flex-direction:column;align-items:center;padding:10px 0 40px;height:100%;overflow-y:auto;width:100%}
#docFloatingToolbar{position:sticky;top:0;z-index:30;flex-shrink:0;display:flex;align-items:center;gap:3px;padding:6px 24px;margin:0 0 10px;background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);box-shadow:var(--shadow-md);width:100%}
#docFloatingToolbar .tb-scroll{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
#docFloatingToolbar .tb-row{display:flex;align-items:center;gap:2px;flex-wrap:wrap;flex-shrink:0;justify-content:flex-start}
#docFloatingToolbar .tb-divider{width:1px;height:18px;background:rgba(255,255,255,0.06);margin:0 5px;flex-shrink:0}
#docFloatingToolbar .tb-btn{background:none;border:none;color:var(--text3);width:32px;height:30px;border-radius:var(--radius-xs);cursor:pointer;transition:all 0.12s;font-size:0.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;font-family:inherit}
#docFloatingToolbar .tb-btn.active{color:var(--accent);background:var(--accent-glow)}
#docFloatingToolbar .tb-btn:hover{background:var(--bg-glass-hover);color:var(--text-secondary)}
#docFloatingToolbar .tb-btn.tb-premium{color:var(--accent)}
#docFloatingToolbar .tb-btn.tb-premium:hover{background:var(--accent-dim)}
#docPage{width:210mm;min-height:296mm;background:#fff;color:#1d1d1f;padding:22mm 20mm 18mm;box-shadow:0 2px 24px rgba(0,0,0,.15);font-family:Calibri,"Segoe UI",-apple-system,Arial,sans-serif;font-size:10.5pt;line-height:1.35;outline:none;overflow:hidden;flex-shrink:0;margin:0 0 24px;border-radius:2px}
.doc-page-scaler{transform-origin:top center;margin:0 auto;display:flex;justify-content:center}
.tb-zoom{display:flex;align-items:center;gap:2px}
.tb-zoom-pct{font-size:11px;color:var(--text-tertiary);min-width:32px;text-align:center;font-weight:500}
#docFloatingToolbar .tb-select{background:var(--bg-glass);border:1px solid transparent;border-radius:var(--radius-xs);color:var(--text-secondary);font-size:12px;padding:1px 18px 1px 6px;cursor:pointer;transition:all 0.12s;outline:none;font-family:inherit;height:28px;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%277%27 height=%274%27%3E%3Cpath d=%27M0 0l3.5 4 3.5-4z%27 fill=%27%236e6e73%27/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 5px center;background-size:7px 4px;max-width:110px;min-width:50px}
#docFloatingToolbar .tb-select:hover{background:var(--bg-glass-hover);border-color:var(--border-default)}
#docFloatingToolbar .tb-select:focus{border-color:var(--accent-blue);box-shadow:0 0 0 2px rgba(94,158,255,.15)}
#docFloatingToolbar .tb-select.tb-size{max-width:52px;min-width:36px}
.tb-color-label{position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-xs);cursor:pointer;transition:all 0.12s;color:var(--text3);font-size:11px;flex-shrink:0}
.tb-color-label:hover{background:var(--bg-glass-hover);color:var(--text-secondary)}
.tb-color-label input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;padding:0;border:none}
.tb-highlight{text-decoration:underline;text-underline-offset:2px}

#docPage strong{font-weight:700;color:#1d1d1f}
#docPage ul,#docPage ol{padding-left:18px;margin:3px 0 6px}
#docPage ul li{margin-bottom:2px}


/* ── Threads Sidebar ── */
.threads-sidebar{width:260px;min-width:260px;background:var(--bg-secondary);border-right:1px solid var(--border-subtle);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
.ts-header{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border-subtle)}
.ts-title{font-size:13px;font-weight:600;color:var(--text-secondary)}
.ts-new-btn{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:var(--radius-sm);border:1px dashed var(--border-default);background:transparent;color:var(--text-tertiary);font-size:11px;cursor:pointer;transition:all 0.15s;font-family:inherit}
.ts-new-btn:hover{border-color:var(--accent-blue);color:var(--accent-blue);background:rgba(94,158,255,.04)}
.ts-list{flex:1;overflow-y:auto;padding:6px}
.ts-item{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:var(--radius-sm);background:none;border:none;color:var(--text-secondary);text-align:left;cursor:pointer;transition:all 0.1s;font-family:inherit;margin-bottom:2px}
.ts-item:hover{background:var(--bg-glass)}
.ts-item.active{background:rgba(94,158,255,.08);color:var(--text-primary)}
.ts-item-icon{flex-shrink:0;color:var(--text-tertiary);display:flex}
.ts-item-text{flex:1;min-width:0}
.ts-item-name{display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-item.active .ts-item-name{color:var(--text-primary)}
.ts-item-meta{display:block;font-size:10px;color:var(--text-tertiary);margin-top:1px}
.ts-item-del{width:20px;height:20px;border-radius:4px;border:none;background:transparent;color:var(--text-tertiary);cursor:pointer;display:none;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.1s}
.ts-item:hover .ts-item-del{display:flex}
.ts-item-del:hover{color:var(--accent-red);background:rgba(255,69,58,.06)}
.ts-empty{padding:24px;text-align:center;font-size:12px;color:var(--text-tertiary)}

/* Sidebar slide transition */
.sidebar-slide-enter-active,.sidebar-slide-leave-active{transition:width 0.2s,opacity 0.2s;overflow:hidden}
.sidebar-slide-enter-from,.sidebar-slide-leave-to{width:0;opacity:0;min-width:0;padding:0}

/* ── Recent Documents (Landing) ── */


/* ── Recent Documents ── */
.lr-section{width:100%;margin:24px 0 0}
.lr-head{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border-subtle)}
.lr-head svg{color:var(--text-tertiary)}
.lr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.lr-card{border-radius:var(--radius-lg);background:var(--bg-glass);border:1px solid var(--border-subtle);overflow:hidden;cursor:pointer;transition:all 0.25s cubic-bezier(0.16,1,0.3,1)}
.lr-card:hover{background:var(--bg-glass-hover);border-color:var(--border-default);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.2)}
.lr-card-top{height:80px;display:flex;align-items:flex-start;justify-content:space-between;padding:10px;background:linear-gradient(135deg,rgba(94,158,255,.04),rgba(94,92,230,.03));border-bottom:1px solid var(--border-subtle)}
.lr-del-btn{width:22px;height:22px;border-radius:var(--radius-xs);border:none;background:rgba(0,0,0,.25);color:rgba(255,255,255,.5);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.15s;flex-shrink:0;backdrop-filter:blur(4px)}
.lr-card:hover .lr-del-btn{opacity:1}
.lr-del-btn:hover{background:rgba(255,69,58,.6);color:#fff}
.lr-type-icon{width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);background:var(--bg-secondary);border:1px solid var(--border-subtle)}
.lr-type-resume .lr-type-icon{background:rgba(94,158,255,.1);border-color:rgba(94,158,255,.15);color:var(--accent-blue)}
.lr-type-invoice .lr-type-icon{background:rgba(52,199,89,.1);border-color:rgba(52,199,89,.15);color:var(--accent-emerald)}
.lr-type-proposal .lr-type-icon{background:rgba(245,166,35,.1);border-color:rgba(245,166,35,.15);color:var(--accent-amber)}
.lr-type-cover_letter .lr-type-icon{background:rgba(94,92,230,.1);border-color:rgba(94,92,230,.15);color:var(--accent-indigo)}
.lr-type-email .lr-type-icon{background:rgba(255,69,58,.1);border-color:rgba(255,69,58,.15);color:var(--accent-red)}
.lr-type-report .lr-type-icon{background:rgba(94,158,255,.1);border-color:rgba(94,158,255,.15);color:var(--accent-blue)}
.lr-type-documentation .lr-type-icon{background:rgba(94,158,255,.1);border-color:rgba(94,158,255,.15);color:var(--accent-blue)}
.lr-type-generic .lr-type-icon{background:var(--bg-glass);border-color:var(--border-default);color:var(--text-tertiary)}
.lr-card-body{padding:8px 10px 10px}
.lr-name{font-size:12.5px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
.lr-meta{display:flex;align-items:center;gap:6px}
.lr-badge{font-size:9px;font-weight:600;padding:2px 7px;border-radius:var(--radius-full);background:rgba(94,158,255,.06);color:rgba(94,158,255,.7);border:1px solid rgba(94,158,255,.08);text-transform:capitalize}
.lr-date{font-size:10px;color:var(--text-tertiary)}


/* ── Quick Actions & Suggestions ── */
.quick-actions { padding: 10px 14px 0; border-top: 1px solid var(--border); }
.qa-label { font-size: 9px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.qa-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.qa-chip { padding: 5px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); font-size: 11px; cursor: pointer; color: var(--text-muted); white-space: nowrap; transition: all 0.15s; font-family: inherit; font-weight: 500; }
.qa-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

/* ============ Animations ============ */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.fade-in-doc { animation: fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }

/* Vue Transition: page (landing → workspace) */
.page-enter-active { animation: fadeIn 0.35s cubic-bezier(0.16,1,0.3,1); }
.page-leave-active { animation: fadeIn 0.2s reverse cubic-bezier(0.16,1,0.3,1); }

/* Vue Transition: menu (export dropdown) */
.menu-enter-active { animation: fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1); }
.menu-leave-active { animation: fadeIn 0.15s reverse; }

/* Vue Transition: fade (general) */
.fade-enter-active { animation: fadeIn 0.25s ease; }
.fade-leave-active { animation: fadeIn 0.15s reverse; }

/* Vue TransitionGroup: msg (chat messages) */
.msg-enter-active { animation: slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1); }
.msg-enter-active.msg.user { animation-name: slideInRight; }
.msg-move { transition: transform 0.3s ease; }
.msg-leave-active { display: none; }

/* ─── Generating Overlay ─── */
.generating-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}
.gen-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.gen-bg-orb {
  position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.25;
  animation: float 10s ease-in-out infinite;
}
.gen-bg-orb.orb-1 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(70,130,180,0.3), transparent 70%);
  top: 10%; right: 5%;
}
.gen-bg-orb.orb-2 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(70,130,180,0.2), transparent 70%);
  bottom: 10%; left: 5%;
  animation-delay: -5s;
}
.gen-content {
  position: relative; z-index: 1; display: flex; flex-direction: column;
  align-items: center; text-align: center; animation: fadeInUp 0.5s ease-out;
}
.gen-icon-wrap {
  position: relative; width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
}
.gen-icon-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--accent);
  border-right-color: rgba(70,130,180,0.3);
  animation: spin 1.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.gen-icon-ring-2 {
  inset: 8px;
  border-top-color: rgba(70,130,180,0.5);
  border-right-color: transparent;
  border-bottom-color: var(--accent);
  animation-direction: reverse;
  animation-duration: 2.4s;
}
.gen-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(70,130,180,0.15), rgba(70,130,180,0.04));
  display: flex; align-items: center; justify-content: center;
  color: var(--accent); z-index: 1;
  animation: genPulse 2s ease-in-out infinite;
}
@keyframes genPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(70,130,180,0.2); }
  50% { box-shadow: 0 0 0 12px rgba(70,130,180,0); }
}
.gen-title {
  font-family: var(--font-display); font-size: 18px; font-weight: 700;
  margin-bottom: 8px; letter-spacing: -0.3px;
}
.gen-status {
  font-size: 13px; color: var(--text-muted); margin-bottom: 20px;
  min-height: 20px; transition: opacity 0.2s; animation: fadeIn 0.3s ease-out;
}
.gen-progress {
  display: flex; align-items: center; gap: 12px; width: 240px;
}
.gen-progress-bar {
  flex: 1; height: 4px; border-radius: 999px;
  background: rgba(255,255,255,0.06); overflow: hidden;
}
.gen-progress-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), #6eb5e8);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.gen-progress-label {
  font-size: 11px; color: var(--accent); font-weight: 600;
  font-family: 'SF Mono', monospace; min-width: 32px; text-align: right;
}
.gen-hint { font-size: 11px; color: var(--text-dim); margin-top: 16px; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-24px) scale(1.05); } }

@media print {
  @page { margin: 15mm 18mm; size: A4; }
  body { background: #fff !important; }
  .workspace { height: auto !important; display: block !important; }
  .ws-body { display: block !important; }
  .editor-panel { overflow: visible !important; }
  .editor-container { padding: 0 !important; }
  .app, .workspace, .ws-body, .editor-panel, .editor-container { background: #fff !important; }
  .lp-header, .ws-header, .chat-panel, .threads-sidebar, #docFloatingToolbar,
  .quick-actions, .chat-input-area, .suggestions, .export-wrap, .user-menu,
  .ws-zoom { display: none !important; }
  #docPage { width: 100% !important; min-height: auto !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
  .doc-page-scaler { transform: none !important; }
}
</style>
