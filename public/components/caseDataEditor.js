function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCompositeJsonValue(value) {
  return isPlainObject(value) || Array.isArray(value);
}

function formatSimpleEditorValue(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function parseSimpleEditorValue(value) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return raw;
  }
}

function cloneJsonValue(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return {};
  }
}

export function normalizeCaseDataRoot(value) {
  if (isCompositeJsonValue(value)) {
    return value;
  }
  return {};
}

function formatJsonValueType(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

function buildJsonTypeOptions(selectedType = "string") {
  const supportedTypes = ["string", "number", "boolean", "null", "object", "array"];
  return supportedTypes
    .map((type) => `<option value="${type}" ${selectedType === type ? "selected" : ""}>${type}</option>`)
    .join("");
}

function createJsonValueByType(type) {
  if (type === "number") {
    return 0;
  }
  if (type === "boolean") {
    return false;
  }
  if (type === "null") {
    return null;
  }
  if (type === "object") {
    return {};
  }
  if (type === "array") {
    return [];
  }
  return "";
}

function getValueAtPath(target, path) {
  if (path.length === 0) {
    return target;
  }
  return path.reduce((cursor, segment) => cursor?.[segment], target);
}

function setValueAtPath(target, path, nextValue) {
  if (path.length === 0) {
    return nextValue;
  }

  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index]];
  }
  cursor[path[path.length - 1]] = nextValue;
  return target;
}

function removeValueAtPath(target, path) {
  if (path.length === 0) {
    return target;
  }

  const parentPath = path.slice(0, -1);
  const parent = getValueAtPath(target, parentPath);
  const lastSegment = path[path.length - 1];
  if (Array.isArray(parent)) {
    parent.splice(Number(lastSegment), 1);
    return target;
  }
  if (isPlainObject(parent)) {
    delete parent[lastSegment];
  }
  return target;
}

function addObjectFieldAtPath(target, path, key, valueType) {
  const targetNode = getValueAtPath(target, path);
  if (!isPlainObject(targetNode)) {
    return target;
  }
  targetNode[key] = createJsonValueByType(valueType);
  return target;
}

function addArrayItemAtPath(target, path, valueType) {
  const targetNode = getValueAtPath(target, path);
  if (!Array.isArray(targetNode)) {
    return target;
  }
  targetNode.push(createJsonValueByType(valueType));
  return target;
}

function renderCaseDataFriendlyTree(container, rootValue, handlers, escapeHtml) {
  container.innerHTML = "";
  const onLeafChange = handlers.onLeafChange;
  const onRemove = handlers.onRemove;
  const onAddObjectField = handlers.onAddObjectField;
  const onAddArrayItem = handlers.onAddArrayItem;
  const setStatus = handlers.setStatus;

  function buildNodeActions(path, value) {
    const actions = document.createElement("div");
    actions.className = "json-tree-actions";

    if (isPlainObject(value)) {
      actions.innerHTML = `
        <input data-json-add-key type="text" placeholder="new_key">
        <select data-json-add-type>${buildJsonTypeOptions("string")}</select>
        <button type="button" class="secondary compact" data-json-add-field>Add Field</button>
      `;
      const keyInput = actions.querySelector("[data-json-add-key]");
      const typeSelect = actions.querySelector("[data-json-add-type]");
      const addButton = actions.querySelector("[data-json-add-field]");
      addButton.addEventListener("click", () => {
        const key = String(keyInput.value || "").trim();
        if (!key) {
          setStatus("Field key is required.", true);
          return;
        }
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          setStatus(`Field '${key}' already exists.`, true);
          return;
        }
        onAddObjectField(path, key, typeSelect.value);
        keyInput.value = "";
      });
      return actions;
    }

    if (Array.isArray(value)) {
      actions.innerHTML = `
        <select data-json-add-type>${buildJsonTypeOptions("string")}</select>
        <button type="button" class="secondary compact" data-json-add-item>Add Item</button>
      `;
      const typeSelect = actions.querySelector("[data-json-add-type]");
      const addButton = actions.querySelector("[data-json-add-item]");
      addButton.addEventListener("click", () => {
        onAddArrayItem(path, typeSelect.value);
      });
      return actions;
    }

    return actions;
  }

  function renderNodeChildren(parent, value, path, level) {
    if (isPlainObject(value)) {
      parent.appendChild(buildNodeActions(path, value));
      const entries = Object.entries(value);
      if (entries.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.className = "readonly-note";
        emptyNote.textContent = "Empty object";
        parent.appendChild(emptyNote);
        return;
      }

      entries.forEach(([key, childValue]) => {
        renderEntry(parent, key, childValue, [...path, key], level);
      });
      return;
    }

    if (Array.isArray(value)) {
      parent.appendChild(buildNodeActions(path, value));
      if (value.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.className = "readonly-note";
        emptyNote.textContent = "Empty array";
        parent.appendChild(emptyNote);
        return;
      }

      value.forEach((childValue, index) => {
        renderEntry(parent, `[${index}]`, childValue, [...path, index], level);
      });
    }
  }

  function renderEntry(parent, keyLabel, value, path, level) {
    if (isCompositeJsonValue(value)) {
      const block = document.createElement("details");
      block.className = "json-tree-block";
      block.open = level < 2;
      block.innerHTML = `
        <summary>
          <span class="json-tree-key">${escapeHtml(String(keyLabel))}</span>
          <span class="json-tree-summary-actions">
            <span class="json-tree-type">${escapeHtml(formatJsonValueType(value))}</span>
            ${path.length > 0 ? "<button type=\"button\" class=\"secondary compact\" data-json-remove>Remove</button>" : ""}
          </span>
        </summary>
      `;
      const removeButton = block.querySelector("[data-json-remove]");
      if (removeButton) {
        removeButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(path);
        });
      }

      const content = document.createElement("div");
      content.className = "json-tree-children";
      block.appendChild(content);
      renderNodeChildren(content, value, path, level + 1);
      parent.appendChild(block);
      return;
    }

    const row = document.createElement("div");
    row.className = "json-tree-leaf";
    row.innerHTML = `
      <div class="json-tree-leaf-label">
        <span class="json-tree-key">${escapeHtml(String(keyLabel))}</span>
        <span class="json-tree-type">${escapeHtml(formatJsonValueType(value))}</span>
      </div>
      <div class="json-tree-leaf-edit">
        <input type="text" value="${escapeHtml(formatSimpleEditorValue(value))}">
        ${path.length > 0 ? "<button type=\"button\" class=\"secondary compact\" data-json-remove>Remove</button>" : ""}
      </div>
    `;

    const valueInput = row.querySelector("input");
    valueInput.addEventListener("input", () => {
      onLeafChange(path, valueInput.value);
    });
    const removeButton = row.querySelector("[data-json-remove]");
    if (removeButton) {
      removeButton.addEventListener("click", () => onRemove(path));
    }

    parent.appendChild(row);
  }

  if (!isCompositeJsonValue(rootValue)) {
    const invalidRoot = document.createElement("p");
    invalidRoot.className = "readonly-note";
    invalidRoot.textContent = "Friendly mode supports object/array root values.";
    container.appendChild(invalidRoot);
    return;
  }

  const rootBlock = document.createElement("div");
  rootBlock.className = "json-tree-root";
  rootBlock.innerHTML = `
    <p class="readonly-note">Root (${escapeHtml(formatJsonValueType(rootValue))})</p>
  `;
  const rootChildren = document.createElement("div");
  rootChildren.className = "json-tree-children";
  rootBlock.appendChild(rootChildren);
  container.appendChild(rootBlock);
  renderNodeChildren(rootChildren, rootValue, [], 0);
}

export function initCaseDataEditor(form, initialValue, deps) {
  const parseJsonInput = deps?.parseJsonInput;
  const setStatus = deps?.setStatus;
  const escapeHtml = deps?.escapeHtml;

  if (typeof parseJsonInput !== "function" || typeof setStatus !== "function" || typeof escapeHtml !== "function") {
    throw new Error("Case data editor dependencies are missing.");
  }

  const editor = form.querySelector("[data-case-json-editor]");
  if (!editor) {
    return;
  }

  const modeButtons = Array.from(editor.querySelectorAll("[data-json-mode]"));
  const simplePanel = editor.querySelector("[data-json-simple]");
  const rawPanel = editor.querySelector("[data-json-raw]");
  const treeContainer = editor.querySelector("[data-json-tree]");
  const rawTextarea = editor.querySelector("[data-case-json-raw]");
  const hiddenField = editor.querySelector('textarea[name="case_data"]');
  let friendlyValue = {};

  function renderFriendly(value) {
    friendlyValue = cloneJsonValue(value);
    renderCaseDataFriendlyTree(
      treeContainer,
      friendlyValue,
      {
        onLeafChange(path, rawInput) {
          const nextValue = parseSimpleEditorValue(rawInput);
          friendlyValue = setValueAtPath(friendlyValue, path, nextValue);
          syncRawFromFriendly();
        },
        onRemove(path) {
          friendlyValue = removeValueAtPath(friendlyValue, path);
          renderFriendly(friendlyValue);
          syncRawFromFriendly();
        },
        onAddObjectField(path, key, valueType) {
          friendlyValue = addObjectFieldAtPath(friendlyValue, path, key, valueType);
          renderFriendly(friendlyValue);
          syncRawFromFriendly();
        },
        onAddArrayItem(path, valueType) {
          friendlyValue = addArrayItemAtPath(friendlyValue, path, valueType);
          renderFriendly(friendlyValue);
          syncRawFromFriendly();
        },
        setStatus
      },
      escapeHtml
    );
  }

  function syncRawFromFriendly() {
    const jsonText = JSON.stringify(friendlyValue, null, 2);
    rawTextarea.value = jsonText;
    hiddenField.value = jsonText;
  }

  function setMode(mode) {
    const showSimple = mode === "simple";
    modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.jsonMode === mode);
    });
    simplePanel.classList.toggle("hidden", !showSimple);
    rawPanel.classList.toggle("hidden", showSimple);
  }

  function syncSimpleFromRaw(showError) {
    hiddenField.value = rawTextarea.value;

    try {
      const parsed = parseJsonInput(rawTextarea.value || "{}", "Case Data");
      if (!isCompositeJsonValue(parsed)) {
        throw new Error("Case Data must be a JSON object or array.");
      }
      renderFriendly(parsed);
      hiddenField.value = JSON.stringify(parsed, null, 2);
      return true;
    } catch (error) {
      if (showError) {
        setStatus(error.message, true);
      }
      return false;
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.jsonMode;
      if (mode === "simple") {
        if (!syncSimpleFromRaw(true)) {
          return;
        }
        setMode("simple");
        return;
      }
      syncRawFromFriendly();
      setMode("json");
    });
  });

  rawTextarea.addEventListener("input", () => {
    hiddenField.value = rawTextarea.value;
    syncSimpleFromRaw(false);
  });

  const initialRoot = normalizeCaseDataRoot(initialValue);
  renderFriendly(initialRoot);
  const initialJson = JSON.stringify(initialRoot, null, 2);
  rawTextarea.value = initialJson;
  hiddenField.value = initialJson;
  setMode("simple");
}

