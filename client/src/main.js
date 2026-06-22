import "@mescius/inputman.richtexteditor/CSS/gc.inputman.richtexteditor.css";
import { InputMan } from "@mescius/inputman.richtexteditor";
import '@mescius/inputman.richtexteditor/JS/plugins/all/plugin.js';

// ライセンスキーの設定
//InputMan.LicenseKey = import.meta.env.VITE_INPUTMANJS_LICENSE_KEY || "";
InputMan.appearanceStyle = InputMan.AppearanceStyle.Modern;

GC.InputMan.ConfigurationManager.registerAIService(async (context) => {
  try {
    const controller = new AbortController();
    const { signal } = controller;

    if (context.behavior === "gcsmarttip") {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: context.input,
          systemPrompt: context.prompt,
          stream: false,
        }),
        signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const json = await res.json();
      return json.result || '';
    } else {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: context.input,
          systemPrompt: context.prompt,
          stream: true,
        }),
        signal,
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      try {
        while (!done) {
          const { value, done: isDone } = await reader.read();
          done = isDone;
          if (value) {
            const chunkText = decoder.decode(value, { stream: !done });
            if (chunkText) context.streamWriter(chunkText);
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  } catch (error) {
    throw error;
  }
});

const gcRichTextEditor = new GC.InputMan.GcRichTextEditor(
  document.querySelector('#gcRichTextEditor1'),
  {
    width: 1250,
    height: 600,
    toolbar: ['newdocument', 'print', 'undo', 'redo', 'cut', 'copy', 'paste', 'pastetext', 'selectall',
      'blockquote', 'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript',
      'styles', 'fontfamily', 'fontsize', 'align', 'lineheight', 'forecolor', 'backcolor', 'removeformat',
      'outdent', 'indent', 'aitextassistant'
    ],
    AITextAssistantConfig: {
      behaviorConfig: {
        dialogConfig: {
          width: 700,
          height: 300,
        }
      }
    },
    useAISmartTip: true,
    AISmartTipConfig: {
      prompt: '開発者向けにInputManJSの特長が伝わる文章として100文字以内で簡潔に補完してください',
      //        scenario: 'メシウスのJavaScriptライブラリに関する情報',
    },
    menubar: ['AI'],
    menu: {
      AI: {
        title: 'AI文章作成アシスタント',
        items: ['aitextassistant'],
      },
    },
    setup: (editor) => {
      editor.addContextToolbar('textselection', {
        items: [
          GC.InputMan.GcRichTextEditorToolbarItem.AITextAssistant,
        ],
        predicate: (node) => editor.getSelection(),
        position: 'selection',
      });
    },
  }
);

