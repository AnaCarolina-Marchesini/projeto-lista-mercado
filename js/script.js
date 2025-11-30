(function () {
  const STORAGE_KEY = "shoppingList_easy_v3";
  const listEl = document.getElementById("list");
  const totalEl = document.getElementById("total");
  const itemName = document.getElementById("item-name");
  const itemQty = document.getElementById("item-qty");
  const addForm = document.getElementById("add-form");
  const clearAllBtn = document.getElementById("clear-all");

  let items = [];

  load();
  renderAll();

  // adicionar item
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = itemName.value.trim();
    const qty = parseInt(itemQty.value) || 1;
    if (!name) return;

    items.push({
      id: Date.now() + Math.random(),
      name,
      qty,
      price: null,
      comprado: false,
    });

    itemName.value = "";
    itemQty.value = "1";
    save();
    renderAll();
    itemName.focus();
  });

  // atualizar qty ou price
  listEl.addEventListener("input", (e) => {
    const target = e.target;
    const itemEl = target.closest(".item");
    if (!itemEl) return;
    const id = parseFloat(itemEl.dataset.id);
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (target.classList.contains("qty-input")) {
      item.qty = parseInt(target.value) || 1;
      save();
      updateItemTotalInDOM(itemEl, item);
      updateGrandTotalInDOM();
    }

    if (target.classList.contains("price-input")) {
      const raw = target.value.trim();
      if (raw === "") {
        item.price = null;
      } else {
        const normalized = raw.replace(",", ".");
        const parsed = parseFloat(normalized);
        item.price = Number.isFinite(parsed) ? parsed : null;
      }
      save();
      updateItemTotalInDOM(itemEl, item);
      updateGrandTotalInDOM();
    }
  });

  // remover / marcar comprado
  listEl.addEventListener("click", (e) => {
    const itemEl = e.target.closest(".item");
    if (!itemEl) return;
    const id = parseFloat(itemEl.dataset.id);
    const item = items.find((i) => i.id === id);

    if (e.target.classList.contains("remove")) {
      e.target.setAttribute("aria-label", `Remover item ${item.name}`);
      items = items.filter((i) => i.id !== id);
      save();
      renderAll();
      return;
    }

    if (e.target.classList.contains("done")) {
      item.comprado = !item.comprado;
      e.target.setAttribute(
        "aria-label",
        item.comprado
          ? `Desmarcar item ${item.name}`
          : `Marcar item ${item.name} como comprado`
      );
      save();
      renderAll();
    }
  });

  // limpar tudo
  clearAllBtn.addEventListener("click", () => {
    if (!confirm("Tem certeza que deseja apagar toda a lista?")) return;
    items = [];
    save();
    renderAll();
  });

  function renderAll() {
    listEl.innerHTML = "";
    if (items.length === 0) {
      listEl.innerHTML =
        "<p style='text-align:center;color:#777;'>Nenhum item ainda.</p>";
    } else {
      items.forEach((it) => {
        const itemTotal = it.price ? it.price * it.qty : 0;
        const li = document.createElement("li");
        li.className = "item" + (it.comprado ? " comprado" : "");
        li.dataset.id = it.id;
        li.setAttribute("role", "listitem");

        li.innerHTML = `
          <div class="top">
              <span class="name">${escapeHtml(it.name)}</span>
              <div style="display:flex; gap:6px;">
                  <button class="done">${
                    it.comprado ? "Desfazer" : "✔️ Comprado"
                  }</button>
                  <button class="remove">Remover</button>
              </div>
          </div>

          <div class="inline-inputs">
              <label>Qtd:
                  <input type="number" min="1" class="qty-input"
                      value="${
                        it.qty
                      }" aria-label="Quantidade do item ${escapeHtml(
          it.name
        )}" />
              </label>

              <label>Preço:
                  <input type="text" inputmode="decimal" class="price-input"
                      placeholder="0,00" aria-label="Preço do item ${escapeHtml(
                        it.name
                      )}"
                      value="${
                        it.price !== null ? formatInputValue(it.price) : ""
                      }">
              </label>

              <strong class="item-total" aria-live="polite">${formatCurrency(
                itemTotal
              )}</strong>
          </div>
      `;

        listEl.appendChild(li);
      });
    }
    updateGrandTotalInDOM();
  }

  function updateItemTotalInDOM(itemEl, item) {
    const totalElItem = itemEl.querySelector(".item-total");
    const itemTotal = item.price ? item.price * item.qty : 0;
    if (totalElItem) totalElItem.textContent = formatCurrency(itemTotal);
  }

  function updateGrandTotalInDOM() {
    const total = items.reduce((acc, it) => {
      if (it.price !== null) return acc + it.price * it.qty;
      return acc;
    }, 0);
    totalEl.textContent = formatCurrency(total);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed.map((it) => ({
          ...it,
          qty: parseInt(it.qty) || 1,
          price: it.price === null ? null : Number(it.price),
          comprado: !!it.comprado,
        }));
      }
    } catch (e) {
      console.error("Falha ao carregar", e);
    }
  }

  function formatCurrency(v) {
    return v
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "R$ 0,00";
  }

  function formatInputValue(n) {
    return Number(n).toFixed(2).replace(".", ",");
  }

  function escapeHtml(str) {
    return String(str).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }
})();
