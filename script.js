let cropper;

document.addEventListener('DOMContentLoaded', () => {
  const braceletPreview = document.getElementById('braceletPreview');
  const braceletSizeSelect = document.getElementById('braceletSize');
  const selectedCharmsTable = document.getElementById('selectedCharms');
  const totalPriceSpan = document.getElementById('totalPrice');
  const charmOrderDiv = document.getElementById('charmOrder');
  const counterDisplay = document.getElementById('braceletCounter');
  const customContainer = document.getElementById('customCharms');
  const cropContainer = document.getElementById('cropContainer');
  const cropImage = document.getElementById('cropImage');
  const cropButton = document.getElementById('cropButton');
  const imageUpload = document.getElementById('imageUpload');

  let charmCounts = {};
  let chainIdCounter = 0;

  let customCharmCounter = 1;
  let customCharmMap = {}; // maps dataUrl to "CustomX"

  function updateCounter() {
    const used = braceletPreview.querySelectorAll('.bracelet-slot:not(.empty)').length;
    const total = parseInt(braceletSizeSelect.value);
    counterDisplay.textContent = `Slots used: ${used} / ${total}`;
  }

  function updateSelectedCharmsTable() {
    selectedCharmsTable.innerHTML = '';
    if (Object.keys(charmCounts).length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3">No charms selected yet.</td>';
      selectedCharmsTable.appendChild(row);
      return;
    }
    for (const [name, { count, price }] of Object.entries(charmCounts)) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${name}</td><td>${count}</td><td>$${(count * price).toFixed(2)}</td>`;
      selectedCharmsTable.appendChild(row);
    }
  }

  function updateTotal() {
    const total = Object.values(charmCounts).reduce((sum, { count, price }) => sum + count * price, 0);
    totalPriceSpan.textContent = total.toFixed(2);
  }

  function updateCharmOrder() {
    charmOrderDiv.innerHTML = '';
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '10px';

    braceletPreview.querySelectorAll('.bracelet-slot').forEach(slot => {
      const label = document.createElement('div');
      label.textContent = slot.querySelector('img')?.alt || '(empty)';
      label.style.padding = '4px 8px';
      label.style.border = '1px solid #ccc';
      label.style.borderRadius = '6px';
      label.style.background = '#fff8f4';
      label.style.fontSize = '14px';
      row.appendChild(label);
    });

    charmOrderDiv.appendChild(row);
  }

  function createSlot() {
    const slot = document.createElement('div');
    slot.className = 'bracelet-slot empty';
    slot.dataset.chainId = '';
    slot.addEventListener('dragover', e => e.preventDefault());

    slot.addEventListener('drop', e => {
      e.preventDefault();
      const name = e.dataTransfer.getData('name');
      const price = parseFloat(e.dataTransfer.getData('price'));
      const imgSrc = e.dataTransfer.getData('img');
      const isChain = e.dataTransfer.getData('chain') === 'true';

      const index = Array.from(braceletPreview.children).indexOf(slot);
      const slots = braceletPreview.querySelectorAll('.bracelet-slot');

      if (isChain) {
        const secondIndex = index + 3;
        if (secondIndex >= slots.length || !slot.classList.contains('empty') || !slots[secondIndex].classList.contains('empty')) {
          alert('Not enough space or overlapping charm for this chain charm.');
          return;
        }

        const chainId = `chain-${chainIdCounter++}`;
        const firstImg = `images/${name}${name[1]}.png`;
        const secondImg = `images/${name}${name[1]}${name[1]}.png`;

        placeCharmInSlot(slots[index], name, firstImg, price, chainId);
        placeCharmInSlot(slots[secondIndex], name, secondImg, 0, chainId);

        charmCounts[name] = charmCounts[name] || { count: 0, price };
        charmCounts[name].count++;

      } else {
        if (!slot.classList.contains('empty')) return;
        placeCharmInSlot(slot, name, imgSrc, price);
        charmCounts[name] = charmCounts[name] || { count: 0, price };
        charmCounts[name].count++;
      }

      updateSelectedCharmsTable();
      updateTotal();
      updateCounter();
      updateCharmOrder();
    });

    return slot;
  }

  function placeCharmInSlot(slot, name, imgSrc, price, chainId = null) {
    slot.innerHTML = '';
    slot.classList.remove('empty');
    if (chainId) slot.dataset.chainId = chainId;

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = name;
    img.draggable = false;
    slot.appendChild(img);

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      if (chainId) {
        document.querySelectorAll(`[data-chain-id="${chainId}"]`).forEach(linkedSlot => {
          linkedSlot.innerHTML = '';
          linkedSlot.classList.add('empty');
          delete linkedSlot.dataset.chainId;
        });
        charmCounts[name].count--;
        if (charmCounts[name].count === 0) delete charmCounts[name];
      } else {
        slot.innerHTML = '';
        slot.classList.add('empty');
        if (charmCounts[name]) {
          charmCounts[name].count--;
          if (charmCounts[name].count === 0) delete charmCounts[name];
        }
      }

      updateSelectedCharmsTable();
      updateTotal();
      updateCounter();
      updateCharmOrder();
    });
    slot.appendChild(delBtn);
  }

  function resetBracelet(size) {
    braceletPreview.innerHTML = '';
    charmCounts = {};
    for (let i = 0; i < size; i++) {
      braceletPreview.appendChild(createSlot());
    }
    updateSelectedCharmsTable();
    updateTotal();
    updateCounter();
    updateCharmOrder();
  }

  braceletSizeSelect.addEventListener('change', () => {
    resetBracelet(parseInt(braceletSizeSelect.value));
  });

  document.querySelectorAll('.charm[draggable="true"]').forEach(charm => {
    charm.addEventListener('dragstart', e => {
      const img = charm.querySelector('img');
      e.dataTransfer.setData('name', charm.dataset.name);
      e.dataTransfer.setData('price', charm.dataset.price);
      e.dataTransfer.setData('img', img ? img.src : '');
      e.dataTransfer.setData('chain', charm.dataset.chain || 'false');
    });
  });

  imageUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      cropImage.src = reader.result;
      cropContainer.style.display = 'block';
      cropper = new Cropper(cropImage, {
        aspectRatio: 1,
        viewMode: 1
      });
    };
    reader.readAsDataURL(file);
  });

  cropButton.addEventListener('click', () => {
    const canvas = cropper.getCroppedCanvas({ width: 70, height: 70 });
    const dataUrl = canvas.toDataURL();

    let customName;
    if (customCharmMap[dataUrl]) {
      customName = customCharmMap[dataUrl];
    } else {
      customName = `Custom${customCharmCounter++}`;
      customCharmMap[dataUrl] = customName;
    }

    const charm = document.createElement('div');
    charm.className = 'charm';
    charm.setAttribute('draggable', 'true');
    charm.dataset.name = customName;
    charm.dataset.price = '3.00';
    charm.innerHTML = `<img src="${dataUrl}" alt="${customName}" /><span>${customName}</span>`;

    charm.addEventListener('dragstart', e => {
      e.dataTransfer.setData('name', customName);
      e.dataTransfer.setData('price', '3.00');
      e.dataTransfer.setData('img', dataUrl);
      e.dataTransfer.setData('chain', 'false');
    });

    customContainer.appendChild(charm);
    document.getElementById('toggleCustom').checked = true;
    cropContainer.style.display = 'none';
    imageUpload.value = '';
    cropper.destroy();
  });

  resetBracelet(parseInt(braceletSizeSelect.value));

  // ---- Tap to place for mobile ----
let selectedCharm = null;

// When user taps a charm, set it as selected
document.querySelectorAll('.charm').forEach(charm => {
  charm.addEventListener('click', () => {
    selectedCharm = charm;
    // Optional: highlight selected charm
    document.querySelectorAll('.charm').forEach(c => c.classList.remove('selected-charm'));
    charm.classList.add('selected-charm');
  });
});

// When user taps a slot, place the selected charm
braceletPreview.addEventListener('click', e => {
  if (!selectedCharm) return;
  const slot = e.target.closest('.bracelet-slot');
  if (!slot || !slot.classList.contains('empty')) return;

  const name = selectedCharm.dataset.name;
  const price = parseFloat(selectedCharm.dataset.price);
  const img = selectedCharm.querySelector('img').src;
  const isChain = selectedCharm.dataset.chain === 'true';
  const index = Array.from(braceletPreview.children).indexOf(slot);
  const slots = braceletPreview.querySelectorAll('.bracelet-slot');

  if (isChain) {
    const secondIndex = index + 3;
    if (secondIndex >= slots.length || !slots[secondIndex].classList.contains('empty')) {
      alert('Not enough space or overlapping charm for this chain charm.');
      return;
    }
    const chainId = `chain-${chainIdCounter++}`;
    const firstImg = `images/${name}${name[1]}.png`;
    const secondImg = `images/${name}${name[1]}${name[1]}.png`;
    placeCharmInSlot(slots[index], name, firstImg, price, chainId);
    placeCharmInSlot(slots[secondIndex], name, secondImg, 0, chainId);
    charmCounts[name] = charmCounts[name] || { count: 0, price };
    charmCounts[name].count++;
  } else {
    placeCharmInSlot(slot, name, img, price);
    charmCounts[name] = charmCounts[name] || { count: 0, price };
    charmCounts[name].count++;
  }

  updateSelectedCharmsTable();
  updateTotal();
  updateCounter();
  updateCharmOrder();

  // Deselect after placing
  selectedCharm = null;
  document.querySelectorAll('.charm').forEach(c => c.classList.remove('selected-charm'));
});

});
